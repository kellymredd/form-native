form-native
===========

Custom form elements that behave natively.

NOTE: Still being worked on and tested. Has yet to be let loose in the wild (ie: production environment).


Implementation
--------------

Simply add form-native.js and form-native.css or .scss to your project and call it thusly:

    $('#form-id').formidable();


Form-native.js expected form element markup:

	<label>
		<input type="text | radio | checkbox | etc">
		Name of label
	</label>


SASS vs. non-SASS files
-----------------------

Form-native.js comes with two versions of a base style sheet. You can choose to use the SASS version or the non-SASS - both of which are identical
as the non-SASS version is just the compiled version of the SASS file.

NOTE: The SASS version requires Compass.
