(function($, undefined){

    "use strict";

    if (window.formnative !== undefined) {
        return;
    }

    $.fn.formnative = function(options){

        options = $.extend({}, $.fn.formnative.defaultOptions, options);

        var killEvent, setEnabled, removeEnabled, setReadonly, removeReadonly, 
            isTouch, KEY, createCheckbox, createRadio, createSelect, syncAttributes,
            watchAttributes;

        killEvent = function( e ){
            e.preventDefault();
            e.stopPropagation();
        };

        setEnabled = function( $el ){
            $el.removeClass('fntv-disabled');
        };

        removeEnabled = function( $el ){
            $el.addClass('fntv-disabled');
        };

        setReadonly = function( $el ){
            $el.addClass('fntv-readonly');
        };

        removeReadonly = function( $el ){
            $el.removeClass('fntv-readonly');
        };

        isTouch = function(){
            var ua = navigator.userAgent.toLowerCase(),
                isAndroid = ua.match("android"),
                isIphone = ua.match("iphone"),
                isIpad = ua.match("ipad"),
                isIpod = ua.match("ipod");

            if (isAndroid || isIphone || isIpad || isIpod) {
                return true;
            }
        };

        KEY = {
            TAB: 9,
            ENTER: 13,
            ESC: 27,
            SPACE: 32,
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            SHIFT: 16,
            CTRL: 17,
            ALT: 18,
            PAGE_UP: 33,
            PAGE_DOWN: 34,
            HOME: 36,
            END: 35,
            BACKSPACE: 8,
            DELETE: 46
        };

        syncAttributes = function($p, $el){
            var input = $el, nativeEnabled, nativeReadonly;

            nativeEnabled = input.attr("disabled") !== "disabled";
            nativeReadonly = input.attr("readonly") === "readonly";

            if( nativeEnabled ){
                setEnabled( $p );
            } else {
                removeEnabled( $p );
            }

            if( nativeReadonly ){ 
                setReadonly( $p, input );
            } else {
                removeReadonly( $p, input );
            }
        };

        watchAttributes = function( $p, input ){ // totall if-fy
            // mozilla and IE
            input.bind("propertychange.input DOMAttrModified.input", function(){ syncAttributes( $p, input ); });

            // safari and chrome
            if (typeof WebKitMutationObserver !== "undefined"){
                if (input.propertyObserver){ delete input.propertyObserver; input.propertyObserver = null; }
                input.propertyObserver = new WebKitMutationObserver(function (mutations){
                    mutations.forEach( 
                        function(){
                            syncAttributes( $p, input );
                        }
                    );
                });
                input.propertyObserver.observe( input.get(0), { attributes:true, subtree:false } );
            }
        };

        // customize radio elements
        createCheckbox = function( $label ){ // label
            var checkbox;

            checkbox = {
                create: function(){
                    var $klass, $input, $a;

                    $input = $label.find('input');
                    $klass = $input.attr('class') || '';
                    
                    $input.hide().before('<a href="#" class="fntv fntv-checkbox '+$klass+'"></a>');
                    $a = $label.find('.fntv');

                    this.clicks();
                    syncAttributes( $a, $input );
                    // set up watch source
                    watchAttributes( $a, $input );
                },
                clicks: function(){
                    if( $label.hasClass('fntv-disabled') ){
                        return false;
                    }

                    $label.on('click', function(e){
                        killEvent(e);

                        var $l = $(this),
                            $a = $l.find('.fntv-checkbox'),
                            $input = $l.find('input');

                        if( $a.hasClass('fntv-checkboxChecked') ){
                            $a.removeClass('fntv-checkboxChecked');
                            $input.attr("checked", false);
                        } else {
                            $a.addClass('fntv-checkboxChecked');
                            $input.attr("checked", true);
                        }
                        $input.trigger('change');
                    });

                    $label.on('keydown', function(e){
                        if( e.which === KEY.SPACE ){
                            killEvent(e);
                            $(this).trigger('click');
                        }
                    });
                },
                init: function(){
                    checkbox.create();
                    return this;
                }
            };

            return checkbox.init();
        };

        // customize radio elements
        createRadio = function( $label ){ // label
            var radio;

            radio = {
                create: function(){
                    var $klass, $input, $a;

                    $input = $label.find('input');
                    $klass = $input.attr('class') || '';

                    $input.hide().before('<a href="#" class="fntv fntv-radio '+$klass+'"></a>');
                    $a = $label.find('.fntv');

                    this.clicks();
                    syncAttributes( $a, $input );
                    // set up watch source
                    watchAttributes( $a, $input );
                },
                clicks: function(){
                    if( $label.hasClass('fntv-disabled') ){
                        return false;
                    }

                    $label.on('click keydown', function(e){
                        var $l = $(this),
                            $a = $l.find('a'),
                            $input = $l.find('input'),
                            $inputName = $input.attr('name'),
                            $otherLabel;

                        if( e.type === 'click'){
                            killEvent(e);
                            $('input:radio[name="'+$inputName+'"]')
                                .not($input)
                                .attr('checked', false)
                                .prev('a')
                                .removeClass('fntv-radioChecked');
                            $a.addClass('fntv-radioChecked');
                            $input.attr('checked', 'checked').trigger('change');
                        }

                        if( e.type === 'keydown' ){
                            if( e.which === KEY.SPACE ){
                                killEvent(e);
                                $l.trigger('click');
                            }
                            if( e.which === KEY.DOWN || e.which === KEY.RIGHT ){
                                killEvent(e);
                                $otherLabel = $('input:radio[name="'+$inputName+'"]').not($input).parent();
                                $otherLabel.trigger('click');
                                $otherLabel.find('a').focus();
                            }
                            if( e.which === KEY.UP || e.which === KEY.LEFT ){
                                killEvent(e);
                                $otherLabel = $('input:radio[name="'+$inputName+'"]').not($input).parent();
                                $otherLabel.trigger('click');
                                $otherLabel.find('a').focus();
                            }
                        }
                    });
                },
                init: function(){
                    radio.create();
                    return this;
                }
            };

            return radio.init();
        };

        createSelect = function( $el ){
            var $win, $p, select, $klass, $l, $nativeOptions,
                $filterMatch, $filterList, filterTimeout, $lastVal, filterCount, touchDevice;

            // check if touch device to only use native
            touchDevice = isTouch();

            $win = $(window);
            $nativeOptions = [];
            $filterMatch = false;
            $filterList = [];
            $lastVal = "0";
            filterCount = 0;
            $klass = $el.attr('class') || '';
            
            $el.wrap( $('<div class="fntv fntv-select '+$klass+'">') );

            $p = $el.parent();

            select = {
                create: function(){
                    
                    $nativeOptions = this.getNativeOptions();
                    
                    if( touchDevice ){
                        $el.css({'position':'absolute','top':'-20px'}); // jank? (make a class) visibility:hidden won't work
                        $el.parent().css({'overflow':'hidden'});
                        this.mobileClicks();
                    } else {
                        $el.hide();
                    }

                    options.placeholderText = $el.attr('placeholder') || options.placeholderText;
                    
                    $p.append( $('<a class="fntv-select-box" href="#"><span class="fntv-current">' + options.placeholderText + '</span><span class="fntv-arrow" href="#"></span></a>') );

                    // instantiate other methods
                    this.createOptions();
                    this.clicks();
                    syncAttributes( $p, $el );
                    // set up watch source
                    watchAttributes( $p, $el );
                },
                getNativeOptions: function(){
                    return $el.find("option").map(function(i){
                        return {
                            'value' : $.trim( $(this).val() ),
                            'label' : $.trim( $(this).html() ),
                            'index' : i
                        };
                    });
                },
                createOptions: function(){
                    var $list = $('<div class="fntv-list">');

                    $nativeOptions.each(function(i){
                        $list.append('<a href="'+$nativeOptions[i].value+'" data-index="'+$nativeOptions[i].index+'">'+$nativeOptions[i].label+'</a>');
                    });
                    $p.append($list);

                    // update global $l
                    $l = $p.find('.fntv-list');
                },
                createFilteredOptions: function($v){
                    var regex = new RegExp('^'+$v, 'gi');

                    $nativeOptions.each(function(i){
                        if( $nativeOptions[i].label.match(regex) ){
                            $filterMatch = true;
                            $filterList.push({
                                'label':$nativeOptions[i].label,
                                'index':$nativeOptions[i].index
                            });
                        }
                    });

                    // just use array, don't make html list
                    if( $filterMatch && $filterList.length !== 0 ){
                        $p.find('.fntv-current').html( $filterList[0].label );
                    }
                    $lastVal = $v;
                },
                matchFiltered: function(idx){
                    $l.find('.fntv-current-choice').removeClass();
                    $l.find('a:eq('+idx+')').addClass('fntv-current-selection fntv-current-choice').focus();

                    $el.val( $l.find('a:eq('+idx+')').attr('href') );
                },
                mobileClicks: function(){
                    $el.on('change', function(){
                        var $v = $(this).find('option:selected').text();
                        // set value of .select-box
                        $p.find('.fntv-current').html($v);
                    });
                },
                clicks: function(){

                    // open list
                    $p.on('click touchstart', '.fntv-arrow, .fntv-select-box', function(e){

                        if( $p.hasClass('fntv-disabled') ) {
                            return false;
                        }

                        killEvent(e);

                        if( touchDevice ){
                            $(this).siblings('select').focus();
                        } else {
                            select.close( $('.fntv-list').not($l) );

                            // position .list based on viewport (above or below)
                            var offsetTop = ( $p.offset().top + $p.height() ) - $win.scrollTop(),
                                listHeight = $l.height(),
                                openAbove = ( ((offsetTop+listHeight)+5) >= $win.height() ) ? true : false;

                            if( openAbove ){
                                $l.addClass('fntv-openAbove').css({'top':'-'+(listHeight)+'px'});
                            } else {
                                $l.removeClass('fntv-openAbove').css({'top':'100%'});
                            }
                            $l.toggle();
                        }
                    });
                    // select an option
                    $l.on('click', 'a', function(e){
                        killEvent(e);

                        var t = $(this),
                            c = $p.find('.fntv-current');

                        c.html( t.html() );
                        $el.val( t.attr('href') );
                        t.siblings().removeClass();
                        t.addClass('fntv-current-selection fntv-current-choice');
                        select.close( t.parent() );
                    });
                    // hover states
                    $l.on('mouseout', 'a', function(){
                        $(this).removeClass('fntv-current-choice');
                    });
                    $l.on('mouseover', 'a', function(){
                        $(this).addClass('fntv-current-choice').focus();
                    });
                    // click off to close
                    $('body').on('click', function(){
                        if( $l.css('display') !== 'none' ){
                            select.close( $l );
                        }
                    });

                    /*

                        open/close .list w/ no choice selected

                    */
                    $p.find('.fntv-arrow, .fntv-select-box').on('keydown', function(e){
                        e.stopPropagation();

                        var $l = $p.find('.fntv-list'),
                            $currChoice = $l.find('a.fntv-current-choice');

                        /*
                            open using up & down arrow
                        */
                        if( e.which === KEY.DOWN || e.which === KEY.UP ){
                            $(this).trigger('click');

                            if ( $currChoice.length ){
                                $currChoice.focus();
                            } else {
                                $l.find('a:eq(0)').addClass('fntv-current-choice').focus();
                            }
                        }
                        /*
                            toggle using spacebar
                        */
                        if(e.which === KEY.SPACE){
                            if( $l.css('display') === 'none' ){
                                e.preventDefault();

                                $(this).trigger('click');

                                if( $currChoice.length ){
                                    $currChoice.focus();
                                } else {
                                    $l.find('a:eq(0)').addClass('fntv-current-choice').focus();
                                }
                            } else {
                                $l.parent().find('.fntv-current').html( $currChoice.html() ).focus();
                                select.close( $l );
                                $el.val( $currChoice.attr('href') );
                            }
                        }
                        /*
                            close using esc and return keys
                        */
                        if( e.which === KEY.ESC || e.which === KEY.ENTER ){
                            select.close( $l );
                        }
                    });

                    /*
                        filter on keypress
                    */
                    var arr = [];
                    $p.on('keypress', '.fntv-arrow, .fntv-select-box, a', function(e){

                        // search by
                        var $v = String.fromCharCode( e.which ),
                            $current = $p.find('.fntv-current');

                        arr.push($v);
                        var str = arr.join('');

                        var sameKey = ( $v.charAt(0) === $lastVal.charAt(0) ) ? 1 : 0 ;

                        if( sameKey === 1 && $filterList.length !== 0 ){
                            clearTimeout(filterTimeout);
                            if( filterCount >= ($filterList.length-1) ){
                                filterCount = 0;
                                $current.html( $filterList[filterCount].label );
                            } else {
                                $current.html( $filterList[++filterCount].label );
                            }
                        } else {
                            $filterList = [];
                            select.createFilteredOptions(str);
                        }

                        filterTimeout = setTimeout(function(){
                            arr = [];
                            $filterList = [];
                            filterCount = 0;
                        }, 650);

                        // set .current-choice class on match in .list
                        if( $filterMatch ){
                            if( $filterList.length <= 1 ){
                                // the ++filterCount screws things up if only
                                // one item is in $filterList (ex: Florida)
                                var $fl = $filterList[0];
                                if( ! $fl == undefined ){
                                    // Pressing a letter that doens't match an option 
                                    // makes $filterList[0] undefined so we check it first
                                    select.matchFiltered($fl.index);
                                }
                            } else {
                                select.matchFiltered($filterList[filterCount].index);
                            }
                        }
                    });

                    /*

                        key capture while .list open

                    */
                    $p.on('keydown', 'a', function(e){

                        var $a = $(this);
                        var index = $a.index();
                        var optionsLength = $a.siblings().length; // set up somewhere else

                        if(e.which === KEY.SPACE){
                            killEvent(e);
                            $a.trigger('click');
                        }
                        if(e.which === KEY.ESC){
                            killEvent(e);
                            select.close( $l );
                        }
                        if(e.which === KEY.UP){
                            killEvent(e);

                            if( index > 0 ){
                                $a.prev().addClass('fntv-current-choice').focus();
                                $a.removeClass('fntv-current-choice');
                            }
                        }
                        if(e.which === KEY.DOWN){
                            killEvent(e);

                            if( index < optionsLength ){
                                $a.next().addClass('fntv-current-choice').focus();
                                $a.removeClass('fntv-current-choice');
                            }
                        }
                        if(e.which === KEY.TAB){
                            return false;
                        }
                    });
                },
                close: function($list){
                    $list.hide();
                    $list.find('a').removeClass('fntv-current-choice');
                    $list.find('a.fntv-current-selection').addClass('fntv-current-choice');
                    $p.find('.fntv-select-box').focus();
                },
                init: function(){
                    select.create();
                    return this;
                }
            };
            return select.init();
        };
        // end createSelect()

        // loop thru form and customize all elements
        this.find('input[type="checkbox"]').each(function(){
            createCheckbox( $(this).parent() );
        });
        this.find('input[type="radio"]').each(function(){
            createRadio( $(this).parent() ); // label
        });
        this.find('select').each(function(){
            createSelect( $(this) );
        });
    };
    
    //added default options
    $.fn.formnative.defaultOptions = {
        'placeholderText' : 'Select...'
    };
}(jQuery));

