/** @license MIT License (c) copyright Egor Halimonenko (termi1uc1@gmail.com|github.com/termi) */

// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @warning_level VERBOSE
// @jscomp_warning missingProperties
// @output_file_name CSS_selector_engine.js
// @check_types
// ==/ClosureCompiler==

/*
 TODO::
 1. Reference combination
 http://css4-selectors.com/selector/css4/reference-combination/
 label:matches(:hover, :focus) /for/ input
 2. Subject of a selector with Child combinator
 http://dev.w3.org/csswg/selectors4/
 For example, the following selector represents a list item LI unique child of an ordered list OL:
 OL > LI:only-child
 However the following one represents an ordered list OL having a unique child, that child being a LI:
 OL! > LI:only-child
 */

// [[[|||---=== GCC DEFINES START ===---|||]]]
/** @define {boolean} */
var __GCC__IS_DEBUG__ = false;
/** @define {boolean} */
var __GCC__NOT_ONLY_IELT8_SUPPORT__ = true;
/** @define {boolean} */
var __GCC__IE_NODE_CONSTRUCTOR_AS_ACTIVX__ = true;
/** @define {boolean} */
var __GCC__IE_NODE_CONSTRUCTOR_AS_DOM_ELEMENT__ = false;
/** @define {boolean} */
var __GCC__QUERY_SELECTOR_ALL_RESULT_AS_NODE_LIST_AND_NODE_LIST_POLYFILL__ = true;
/** @define {boolean} */
var __GCC__EXPORT_MATCHES_SHIMS__ = true;
/** @define {boolean} */
var __GCC__EXPORT_QUERY_SELECTOR_ALL_SHIM__ = true;
/** @define {boolean} */
var __GCC__EXPORT_QUERY_SELECTOR_SHIM__ = true;
/** @define {boolean} */
var __GCC__EXPORT_GET_ELEMENTS_BY_CLASS_NAME_SHIM__ = true;
/** @define {(string|boolean)} */
var __GCC__GLOBAL_QUERY_SELECTOR_ALL_EXPORT__ = false;//"testSelectorAll";
/** @define {(string|boolean)} */
var __GCC__GLOBAL_QUERY_SELECTOR_EXPORT__ = false;//"testSelector";
/** @define {(string|boolean)} */
var __GCC__GLOBAL_MATCHES_SELECTOR_EXPORT__ = false;//"testMatchesSelector";
/** @define {(string|boolean)} */
var __GCC__SHIMED_GET_ATTRIBUTE_SUPPORT__ = true;
// [[[|||---=== GCC DEFINES END ===---|||]]]

;(function(global) {
"use strict";


if(!global["Element"])((global["Element"] =
//Reprisent ActiveXObject as Node, Element and HTMLElement so `<element> instanceof Node` is working (!!!But no in IE9 with in "compatible mode")
	__GCC__IE_NODE_CONSTRUCTOR_AS_ACTIVX__ ? ActiveXObject : __GCC__IE_NODE_CONSTRUCTOR_AS_DOM_ELEMENT__ ? document.createTextNode("") : {}
	).prototype)["ie"] = true;//fake prototype for IE < 8
if(!global["HTMLElement"])global["HTMLElement"] = global["Element"];//IE8
if(!global["Node"])global["Node"] = global["Element"];//IE8



var
	_Element_prototype = global["Element"].prototype
	/** @type {RegExp} @const */
	, RE__getElementsByClassName = /\s*(\S+)\s*/g
	/** @type {string} @const */
	, STRING_FOR_RE__getElementsByClassName = '(?=(^|.*\\s)$1(\\s|$))'
	/** @type {RegExp} @const */
	, RE__selector__easySelector = /^([\w\-\|]+)?((?:\.(?:[\w-]+))+)?$|^#([\w-]+$)/
	/** @type {RegExp} @const */
	, RE__queryComplexSelector__doubleSpaces = /\s*([,>+~ ])\s*/g//Note: Use with "$1"
	/** @type {RegExp} @const */
	, RE__querySelector__arrtSpaceSeparated_toSafe = /\~\=/g//Note: Use with "@="
	/** @type {RegExp} @const */
	, RE__queryComplexSelector__selectorsMatcher = /(^|,|\>|\+|~| ).*?(?=[,>+~ ]|$)/g
	/*TODO::CSS4 Reference combinator
	 , RE__queryComplexSelector__selectorsMatcher = /(^|,|\>|\+|~|\/| ).*?(?=[,>+~/ ]|$)/g

	 */
	/** @type {RegExp} @const */
	, RE__querySelector__dottes = /\./g
	/** @type {RegExp} @const */
	, RE__queryCompoundSelector__spaces = /\s/g
	/** @type {RegExp} @const */
	, RE__queryCompoundSelector__selectorMatch = /^([,>+~ ])?([\w\-\|\*]*)\#?([\w-]*)((?:\.?[\w-])*)(\[.+\])?(?:\:([^!]+))?(!)?$////^([,>+~ ])?(\$)?([\w\-\|\*]*)\#?([\w-]*)((?:\.?[\w-])*)(\[.+\])?(?:\:(.+))?$/
	/*TODO::CSS4 Reference combinator
	 , RE__queryCompoundSelector__selectorMatch = /^([,>+~/ ])?(\$)?([\w\-\|\*]*)\#?([\w-]*)((?:\.?[\w-])*)(\[.+\])?(?:\:(.+))?$/*/
	/** @type {RegExp} @const */
	, RE__queryCompoundSelector__attrMatcher = /^\[?['"]?(.*?)['"]?(?:([\*~&\^\$\@!]?=)['"]?(.*?)['"]?)?\]?$/
	/** @type {RegExp} @const */
	, RE__queryCompoundSelector__pseudoMatcher = /^([^(]+)(?:\\\((.+)\\\))?$/
	/** @type {RegExp} @const */
	, RE__queryCompoundSelector__pseudoNthChildPlus = /\-child\((\dn)\+(\d)\)/g//Note: Use with "-child\($1%$2\)"
	/** @type {RegExp} @const */
	, RE__queryCompoundSelector__pseudoNthChildMatcher = /(?:([-]?\d*)n)?(?:(%|-)(\d*))?//* regexpt from jass 0.3.9 (http://yass.webo.in/) rev. 371 line 181 ( mod === 'nth-last-child' ?...) */
	/** @type {RegExp} @const */
	, RE_matchSelector__isSimpleSelector = /([,>+~ ])/
	/** @const @type {RegExp} */
	, RE_left_spaces = /^\s+/
	/** @const @type {RegExp} */
	, RE_space = /\s/
	/** @const @type {RegExp} */
	, RE_not_a_number = /\D/

	/** @type {Object} @const */
	, SELECTOR_COMBINATOR_MAP = {
		"" : 1,
		" " : 1,
		"," : 1,
		">" : 2,
		"~" : 3,
		"+" : 4/*, TODO::CSS4 Reference combinator
		 "/" : 5//CSS4 Reference combinator
		 */
	}
	/** @type {Object} @const */
	, SELECTOR_ATTR_OPERATIONS_MAP = {
		"" : 1,
		'=' : 2,
		'&=' : 3,
		'^=' : 4,
		'$=' : 5,
		'*=' : 6,
		'|=' : 7,
		'!=' : 8,
		'@=' : 9//this is '~='
	}
	/** @type {Object} @const */
	, SELECTOR_PSEUDOS_MAP = {
		'nth-child' : 0,
		'nth-last-child' : 1,
		'only-child' : 2,
		'first-child' : 3,
		'last-child' : 4,
		'root' : 5,
		'empty' : 6,
		'checked' : 7,
		'lang' : 8,
		'enabled' : 9,
		'disabled' : 10,
		'selected' : 11,
		'contains' : 12,
		'not' : 13,
		'matches' : 14,//TODO:: ":-moz-any", ":-webkit-any"
		'read-only' : 15,       //http://www.w3.org/TR/selectors4/#rw-pseudos
		'read-write' : 16,      //http://www.w3.org/TR/selectors4/#rw-pseudos
		'scope' : 17,
		'focus' : 18,

		//TODO now::
		'nth-match' : 19,
		'column' : 20,
		'nth-column' : 21

		//TODO::
		/*'first-of-type' : 18,
		 'nth-of-type' : 19,
		 'only-of-type' : 20,
		 'nth-last-of-type' : 21,
		 'last-of-type' : 22*/
		/*
		 TODO::   http://css4-selectors.com/selector/css4/
		 'scope' : 17,
		 'dir' ???
		 'nth-match'//nth-match(n of selector) | an E element, the n-th sibling matching selector
		 'nth-last-match'//nth-last-match(n of selector) | an E element, the n-th sibling matching selector, counting from the last one
		 'indeterminate' : 16,
		 'default' : 17,
		 'valid': 18,
		 'invalid' : 19,
		 'in-range' : 20,        //http://www.w3.org/TR/selectors4/#range-pseudos
		 'out-of-range' : 20,    //http://www.w3.org/TR/selectors4/#range-pseudos
		 'required' : 20,        //http://www.w3.org/TR/selectors4/#opt-pseudos
		 'optional' : 20,        //http://www.w3.org/TR/selectors4/#opt-pseudos
		 'column' : 20,          //http://www.w3.org/TR/selectors4/#column-pseudo
		 'nth-column' :20,       //http://www.w3.org/TR/selectors4/#nth-column-pseudo
		 'nth-last-column' : 20, //http://www.w3.org/TR/selectors4/#nth-last-column-pseudo
		 'current' : 20,         //http://www.w3.org/TR/selectors4/#current-pseudo
		 'past' : 20,            //http://www.w3.org/TR/selectors4/#past-pseudo
		 'future' : 20           //http://www.w3.org/TR/selectors4/#future-pseudo
		 */
	}
	/** @type {Object} @const */
	, ATTRIBUTE_SPECIAL_CASE = {
		"href" : function(node) {
			return _Function_call.call(__GCC__SHIMED_GET_ATTRIBUTE_SUPPORT__ && node["__getAttribute__"] || node.getAttribute, node, "href", 2);
		}
	}
	/** @type {Object} @const */
	, ATTRIBUTE_SPECIAL_SPECIFIED = {"coords" : 1, "id" : 1, "name" : 1}

	, _document_documentElement = document.documentElement

	, _NodeList_from = function(iterable, iterable_is_sparseArray) {
		var length = iterable.length >>> 0,
			result = new _NodeList;

		if(__GCC__NOT_ONLY_IELT8_SUPPORT__ && !iterable_is_sparseArray) {
			try {
				result.concat(_Array_slice.call(iterable));
			}
			catch(e) { }

			if(result && result.length === length)return result;
		}

		for(var key = 0 ; key < length ; key++) {
			if(key in iterable)
				result.push(iterable[key]);
		}

		return result;
	}

	, _can_useGetElementsByName_as_getElementById = __GCC__NOT_ONLY_IELT8_SUPPORT__ ? (function() {
		var result = false,
			uiid = "_" + Math.random(),
			tempNode = document.createElement("br");


		_document_documentElement.appendChild(tempNode).id = uiid;
		try {
			result = document.getElementsByName(uiid)[0].id === uiid;
		}
		catch(e) {
			result = false;
		}
		finally {
			_document_documentElement.removeChild(tempNode);
		}

		return result;
	})()
		:
		true

	, sourceIndex_propertyName = "sourceIndex"

	, nodeSourceIndex_support = __GCC__NOT_ONLY_IELT8_SUPPORT__ ?
		sourceIndex_propertyName in _document_documentElement && !("opera" in global)//Old Opera has very slow 'sourceIndex'
		:
		true

	, UUID = 1

	, getNextElement = "nextElementSibling" in _document_documentElement ?
		function(node) {
			return node.nextElementSibling;
		}
		:
		function(node) {
			while((node = node.nextSibling) && node.nodeType != 1) {}
			return node;
		}

	/**
	 *  @const
	 * Use native and probably broken function or Quick, but non-full-standart
	 * For system use only
	 * More standart solution in a.js
	 */
	, _String_trim = String.prototype.trim || function () {
		var  str = this.replace(RE_left_spaces, ''),
			i = str.length;
		while (RE_space.test(str.charAt(--i))){};
		return str.slice(0, i + 1);
	}

	/** @const */
	, _String_split = String.prototype.split

	/** @const */
	, _String_substr = String.prototype.substr

	, _shim_getElementsByClassName

	, tmp

	, native_getElementsByClassName = __GCC__NOT_ONLY_IELT8_SUPPORT__ ?
		(tmp = _document_documentElement.getElementsByClassName) && ((tmp + "").length < 80) && tmp
		:
		void 0

	, _Array_slice = Array.prototype.slice

	, _NodeList

	, _matchesSelector

	, _Function_call = Function.prototype.call

	, native_querySelector = !__GCC__IS_DEBUG__ && _document_documentElement.querySelector
	, native_querySelectorAll = !__GCC__IS_DEBUG__ && _document_documentElement.querySelectorAll
	, document_native_querySelector = !__GCC__IS_DEBUG__ && document.querySelector
	, document_native_querySelectorAll = !__GCC__IS_DEBUG__ && document.querySelectorAll

	, IS_QUERY_SELECTOR_SUPPORT_REF_NODES = false

	//, IS_QUERY_SELECTOR_HAVE_TRUE_SCOPE_SUPPORT = false
;

if(__GCC__NOT_ONLY_IELT8_SUPPORT__ && native_querySelector) {
	tmp = document.createElement("b");
	tmp.uuid = "_" + +new Date();
	tmp.innerHTML = "<i id='" + tmp.uuid + "'>t</i>";

	(IS_QUERY_SELECTOR_SUPPORT_REF_NODES = document_native_querySelector.call(document, "#" + tmp.uuid, tmp)) &&
		(IS_QUERY_SELECTOR_SUPPORT_REF_NODES = IS_QUERY_SELECTOR_SUPPORT_REF_NODES.innerHTML == "t") ||
	(IS_QUERY_SELECTOR_SUPPORT_REF_NODES = false);

	//Google Chrome have wrong implementation of :scope pseudo class
	/*TODO::
	try {
		IS_QUERY_SELECTOR_HAVE_TRUE_SCOPE_SUPPORT = native_querySelector.call(tmp, ":scope>i");
		IS_QUERY_SELECTOR_HAVE_TRUE_SCOPE_SUPPORT = IS_QUERY_SELECTOR_HAVE_TRUE_SCOPE_SUPPORT && IS_QUERY_SELECTOR_HAVE_TRUE_SCOPE_SUPPORT.innerHTML == "t";
	}
	catch(e) {
		IS_QUERY_SELECTOR_HAVE_TRUE_SCOPE_SUPPORT = false
	}
	*/
}

//_NodeList.prototype
if(__GCC__QUERY_SELECTOR_ALL_RESULT_AS_NODE_LIST_AND_NODE_LIST_POLYFILL__) {
	_NodeList = function() {};
	_NodeList.prototype = new Array;

	tmp = new _NodeList;
	tmp.push(1);
	if(!tmp.length && !("NodeList" in global)) {//Internet Explorer refuses to maintain the length property of a subclass created like this | http://dean.edwards.name/weblog/2006/11/hooray/
		// create an <iframe>
		tmp = document.createElement("iframe");
		tmp.style.display = "none";
		document.body.appendChild(tmp);

		// write a script into the <iframe> and steal its Array object
		tmp.contentWindow.document.write(
			"<script>parent.NodeList=Array;<\/script>"
		);
		_NodeList = global["NodeList"];
	}
}//if(__GCC__QUERY_SELECTOR_ALL_RESULT_AS_NODE_LIST_AND_NODE_LIST_POLYFILL__)
else _NodeList = Array;

if(__GCC__NOT_ONLY_IELT8_SUPPORT__ && !nodeSourceIndex_support)sourceIndex_propertyName = "uniqueId";

//Only for IE
if(!native_getElementsByClassName && __GCC__EXPORT_GET_ELEMENTS_BY_CLASS_NAME_SHIM__)_shim_getElementsByClassName = function(klas) {
	klas = klas + "";

	if(__GCC__NOT_ONLY_IELT8_SUPPORT__ && this.querySelectorAll) {//IE8
		try {
			return _NodeList_from(this.querySelectorAll(klas.replace(/\s+(?=\S)|^/g, ".")));
		}
		catch(e){}
	}

	var re,
		result = [],
		nodes = this.all,
		node,
		i = -1;

	if(nodes.length) {
		re = new RegExp(klas.replace(RE__getElementsByClassName, STRING_FOR_RE__getElementsByClassName));

		while(node = nodes[++i]) {
			if(node.className && re.test(node.className)) {
				result.push(node);
			}
		}
	}

	return result;
};



/**
 * A compound selector is a chain of simple selectors that are not separated by a combinator. It always begins with a type selector or a (possibly implied) universal selector. No other type selector or universal selector is allowed in the sequence.
 *
 * @param {!Array} selectorArr parsed CSS3-selector
 * @param {Node|Array.<Node>|Object} roots
 * @param {Array.<Node>} globalResult
 * @param {boolean} globalResultAsSparseArray
 * @param {Node|Array.<HTMLElement>=} preResult
 * @param {boolean=} onlyOne only one need
 * @param {(Object|boolean)=} resultKeys for non-IE browsers
 * @return {Array.<Node>}
 */
function queryCompoundSelector(selectorArr, roots, globalResult, globalResultAsSparseArray, preResult, onlyOne, resultKeys, CSS4_parentSelector_onlyOne_forEachRoot, CSS4_scope_isFirstRule) {
	var result = globalResult || [];

	var /** @type {boolean} */isMatchesSelector = !!preResult
		, /** @type {boolean} */root_is_iterable_object =
			!isMatchesSelector && roots && /*1*/typeof roots["length"] == "number" && /*2*/roots["nodeType"] === void 0//1. fast and unsafe isArray 2. Not a <form>
		, /** @type {Node} */root = isMatchesSelector && (roots = {}) || (
			!roots ? document :
				root_is_iterable_object ?
					roots[0]
					:
					roots)
		, /** @type {Node} */nextRoot
		, /** @type {number} */rootIndex = 0
		, /** @type {(Node|undefined)} */child
		, /** @type {string} */child_nodeName
		, /** @type {Node} */brother
		, /** @type {number} */combinatorType = SELECTOR_COMBINATOR_MAP[selectorArr[1] || ""] || 0
		, /** @type {boolean} */combinatorTypeMoreThen_2 = combinatorType > 2
		, /** @type {(string|undefined)} */tag = selectorArr[2]
		, /** @type {boolean} */needCheck_tag = !!tag
		, /** @type {(string|undefined)} */id = selectorArr[3]
		, /** @type {boolean} */needCheck_id = !!id
		, /** @type {(string|Array.<string>|undefined)} */classes = selectorArr[4]
		, /** @type {boolean} */needCheck_classes = !!classes
		, /** @type {boolean} */needCheck_nodeType = tag === "*"
		, /** @type {number} */iterateIndex
		, /** @type {number} */childrenIndex
		, /** @type {number} */indexIn_resultKeys
		, /** @type {boolean} */match
		, /** @type {boolean} */canWeReturnUnsafeArray
		, /** @type {Array.<string>} */current_AttrCheckObject
		, /** @type {Array.<string>} */css3Pseudo_add
		, /** @type {number} */css3PseudoType

		, /** @type {string} */nodeAttrCurrent_value
		, /** @type {string} */nodeAttrExpected_value
		, /** @type {(RegExp|string)} */klas
		, /** @type {(string|Array.<string>)} */attributeCheckObjects
		, /** @type {(string|Array.<string>)} */css3Pseudo
		, /** @type {Array} */elementsById_Cache
		, /** @type {string} */nodeIndex__Last
		, /** @type {string} */first_last__Child
		, /** @type {string} */previous_next__Sibling
		, _tmp1, _tmp2, _tmp3, _tmp4
	;

	if(needCheck_tag) {
		//Translate selector xml namespace to html namespace : xml|html -> xml:html
		tag = (needCheck_nodeType ? void 0 : tag.replace("|", ":").toUpperCase());
		if(!tag)needCheck_tag = false;
	}

	if(needCheck_classes) {
		//Create RegExp for class checking
		classes = classes.replace(RE__querySelector__dottes, " ");
		if(!native_getElementsByClassName || combinatorType !== 1)klas = new RegExp(classes.replace(RE__getElementsByClassName, STRING_FOR_RE__getElementsByClassName));
	}

	//Prepare attribute selectors
	if(attributeCheckObjects = selectorArr[5]) {
		attributeCheckObjects = _String_split.call(attributeCheckObjects, "][");
		iterateIndex = -1;
		//Parse all attribute selector in attribute check object(array) with structure:
		// {
		//  0 : undefined // not using
		//  1 : <string> // attribute name to check
		//  2 : <number|undefined> // attribute selector operator defined in map SELECTOR_ATTR_OPERATIONS_MAP
		//  3 : <string|undefined> // expected attribute value
		//  4 : <boolean|undefined> // case sensitivity flag
		// }
		// and save it to Array `attributeCheckObjects`
		while(current_AttrCheckObject = attributeCheckObjects[++iterateIndex]) {
			current_AttrCheckObject =
				attributeCheckObjects[iterateIndex] =
					current_AttrCheckObject.match(RE__queryCompoundSelector__attrMatcher)
			;

			// delete unnecessary string
			current_AttrCheckObject[0] = void 0;

			// set selector operator
			current_AttrCheckObject[2] = SELECTOR_ATTR_OPERATIONS_MAP[current_AttrCheckObject[2]];

			// check if expected attribute value has " i" - case sensitivity flag
			_tmp2 = current_AttrCheckObject[3];
			if(_tmp2) {
				if(_tmp2.substr(_tmp2.length - 2) == " i") {//Doesn't use string.substr(-2) due old IE doesn't support that
					//http://css4-selectors.com/selector/css4/attribute-case-sensitivity/
					current_AttrCheckObject[3] = _tmp2.substr(0, _tmp2.length - 2);
					current_AttrCheckObject[4] = true;
				}
			}
		}
		_tmp2 = void 0;
	}

	//Prepare pseudo-class selectors and parse Tree-Structural pseudo-classes
	if(css3Pseudo = selectorArr[6]) {
		css3Pseudo = _String_split.call(css3Pseudo, ":");
		iterateIndex = -1;
		//Parse all attribute selector in attribute check object(array) with structure:
		// {
		//  0 : undefined // not using
		//  1 : <number> // pseudo type defined in map SELECTOR_PSEUDOS_MAP
		//  2 : <Array.<[undefined, number, string, number]>|undefined> // [For Tree-Structural pseudo-class] parsed Tree-Structural pseudo-class rule, for example in :nth-child(an+b) "an+b" - is a rule. Structure for rule:
		// {
		// 0 : undefined // not using
		// 1 : <number> // "a" from "an+b"
		// 2 : <string> // operator "an+b", in this case it is "+"
		// 3 : <number> // "b" from "an+b"
		// }
		//  3 : <string|undefined> // [For Tree-Structural pseudo-class] property for saving caching result of rule (for example "an+b") to Node "nodeIndexLast" or "nodeIndex"
		//  4 : <string|undefined> // [For Tree-Structural pseudo-class] Node child property name: "lastChild" or "firstChild"
		//  5 : <string|undefined> // [For Tree-Structural pseudo-class] Node sibling property name: "previousSibling" or "nextSibling"
		// }
		while(css3Pseudo_add = css3Pseudo[++iterateIndex]) {
			css3Pseudo[iterateIndex] =
				css3Pseudo_add =
					css3Pseudo_add.match(RE__queryCompoundSelector__pseudoMatcher)
			;

			// delete unnecessary string
			css3Pseudo_add[0] = void 0;

			_tmp2 = // save pseudo type into a temporary variable
				css3Pseudo_add[1] =
					SELECTOR_PSEUDOS_MAP[css3Pseudo_add[1]]
			;

			// Check if this is a Tree-Structural pseudo-class 'nth-child' (_tmp2 == 0) or 'nth-last-child' (_tmp2 == 1)
			if(_tmp2 < 2 && css3Pseudo_add[2]) {
				if(!RE_not_a_number.test(css3Pseudo_add[2])) { // number value like nth-child(2n+1)
					css3Pseudo_add[2] = [void 0, 0, '%', css3Pseudo_add[2]];
				}
				else if(css3Pseudo_add[2] === 'even') {
					css3Pseudo_add[2] = [void 0, 2];
				}
				else if(css3Pseudo_add[2] === 'odd') {
					css3Pseudo_add[2] = [void 0, 2, '%', 1];
				}
				else {
					css3Pseudo_add[2] = css3Pseudo_add[2].match(RE__queryCompoundSelector__pseudoNthChildMatcher);
					css3Pseudo_add[2][0] = void 0;// delete unnecessary string
				}

				nodeIndex__Last = css3Pseudo_add[3] = _tmp2 ? "nodeIndexLast" : "nodeIndex";
				first_last__Child = css3Pseudo_add[4] = _tmp2 ? "lastChild" : "firstChild";
				previous_next__Sibling = css3Pseudo_add[5] = _tmp2 ? "previousSibling" : "nextSibling";
			}
			else if(_tmp2 === 17) {//:scope pseudo class
				if(!CSS4_scope_isFirstRule) {
					throw new Error("SYNTAX_ERR");
				}
				isMatchesSelector = true;
				preResult = root_is_iterable_object ? roots : [roots];
				css3Pseudo[iterateIndex] = void 0;
			}
			/*TODO:
			else if(_tmp2 === 18) {//:focus pseudo class
				isMatchesSelector = true;
				preResult = [document.activeElement];
			}*/
		}
		if(css3Pseudo.length == 1 && css3Pseudo[0] === void 0)css3Pseudo = void 0;// If only :scope pseudo-class
	}


	if(isMatchesSelector)combinatorType = 0;
	selectorArr = void 0;// delete unnecessary Array

	//prepear
	if(combinatorType == 1) {
		if(!needCheck_id) {
			needCheck_classes = needCheck_classes && !native_getElementsByClassName;
			needCheck_tag = needCheck_tag && native_getElementsByClassName && !!classes;
		}
		else {
			if(_can_useGetElementsByName_as_getElementById) {//workaround for IE
				preResult = document.getElementsByName(id);
				elementsById_Cache = [];
				iterateIndex = -1;
				while(child = preResult[++iterateIndex]) {
					if(child.id == id) {
						elementsById_Cache.push(child);
					}
				}
			}
			else {
				//other browsers with no native querySelector support
				//workaround from QSA by Dmitriy Pakhtinov ( spb.piksel@gmail.com | http://spb-piksel.ru/ )
				elementsById_Cache = [];
				preResult = [];
				while(child = document.getElementById(id)) {
					preResult.push(child);
					if(child.id == id) {
						elementsById_Cache.push(child);
					}
					child.setAttribute("id", id + " _");
				}
				iterateIndex = -1;
				while(child = preResult[++iterateIndex]) {
					child.setAttribute("id", id);
				}
			}

			preResult = needCheck_id = void 0;
		}
	}

	// Check if we can return NodeList or HTMLCollection directly without converting it to Array
	canWeReturnUnsafeArray =
		(!root_is_iterable_object || roots.length === 1)
			&& !globalResultAsSparseArray
			&& !attributeCheckObjects
			&& !css3Pseudo
			&& !needCheck_tag
			&& !needCheck_classes
			&& !needCheck_id
			&& !CSS4_parentSelector_onlyOne_forEachRoot
	;

	// roots loop
	do {
		// get Nodes for check based on combinator type
		switch(combinatorType) {
			case 0://matchesSelector
				child = preResult[0];
				break;
			case 1://combinator " " or ""
				//if("all" in root && !root.all.length)continue;
				if(!id) {//tagName or/and class
					if(tag === "BODY" && root.nodeType === 9) {
						preResult = [root.body];
						needCheck_classes = !!classes;
						canWeReturnUnsafeArray = canWeReturnUnsafeArray && !needCheck_classes;
					}
					else if(!classes || !native_getElementsByClassName) {
						preResult = root.getElementsByTagName(tag || "*");
					}
					else {
						preResult = "getElementsByClassName" in root ? root.getElementsByClassName(classes) : native_getElementsByClassName.call(root, classes);
					}
				}
				else {//id
					preResult = [];
					if(elementsById_Cache.length) {
						iterateIndex = -1;
						while(child = elementsById_Cache[++iterateIndex]) {
							if(root === document || root.contains(child)){
								preResult.push(child);
								elementsById_Cache.splice(iterateIndex--, 1);
							}
						};
					}
					else return result;
				}
				child = preResult[0];
				break;
			case 2://combinator ">" W3C: "an F element preceded by an E element"
				preResult = root.children;
				child = preResult[0];
				break;
			case 3://combinator "~" W3C: "an F element preceded by an E element"
				nextRoot = roots[rootIndex + 1];
			case 4://combinator "+"
				if(!(child = getNextElement(root))) {
					//If root element has no nextElementSibling -> skip this root
					continue;
				}
		}

		// if we can return unsafe result (NodeList, DOMCollection etc) do it
		if(canWeReturnUnsafeArray) {
			return preResult;
		}

		childrenIndex = 0;

		// child check loop
		if(child) do if(
			(!needCheck_nodeType || child.nodeType === 1) // check node type
				&&
				( // check if we already have this node in result array
					(!__GCC__NOT_ONLY_IELT8_SUPPORT__ || nodeSourceIndex_support) ? // If browser (except Opera) has sourceIndex property on node -> use it as uid value (mostly for IE)
						// mostly IE logic
						!(
							globalResultAsSparseArray // if globalResultAsSparseArray == false -> no need to check
								// check uid for existing in globalResult sparse array
								&& (indexIn_resultKeys = child[__GCC__NOT_ONLY_IELT8_SUPPORT__ ? sourceIndex_propertyName : "sourceIndex"]) in globalResult
							)
						:
						// w3c browsers logic
						!resultKeys // no need to check unique of this Node in result array
							|| (
							(indexIn_resultKeys = child[sourceIndex_propertyName]) ? // check for uid value in special property
								!(indexIn_resultKeys in resultKeys) // if uid exists -> check if it not in resultKeys object
								:
								(indexIn_resultKeys = child[sourceIndex_propertyName] = ++UUID) // if iud not exists -> set uid for Node and save new iud in indexIn_resultKeys
							)

					)
			) {
			//if((!needCheck_nodeType || child.nodeType === 1) && !(globalResultAsSparseArray && (indexIn_resultKeys = (child[sourceIndex_propertyName] || (child[sourceIndex_propertyName] = ++UUID))) in globalResult)) {


			/*if(needCheck_tag && child.nodeName !== tag || needCheck_id && child.id !== id || needCheck_classes && !(child.className && klas.test(child.className))) {
			 resultKeys && (resultKeys[indexIn_resultKeys] = false);
			 continue;
			 }*/
			//if(combinatorType === 1 && nextRoot && nextRoot.contains(root))continue;


			// check nodeName, id and className
			if(match = !(
				needCheck_tag && (child_nodeName = child.nodeName.toUpperCase()) !== tag
					|| needCheck_id && child.id !== id
					|| needCheck_classes && !(child.className && klas.test(child.className))
				)
				) {
				// check passed
				// if nodeName, id and className are matches -> check attributes and pseudo-classes

				if(attributeCheckObjects) {//Check attribute selectors
					iterateIndex = -1;
					//Save node attributes in temporary variable
					_tmp4 = child.attributes;

					while(
						match
							&& (current_AttrCheckObject = attributeCheckObjects[++iterateIndex])
							&& (match =
							(_tmp3 = current_AttrCheckObject[1]) in _tmp4// check if node.attributes has attribute with name saved in _tmp3
							)
						) {
						if(_tmp3 in ATTRIBUTE_SPECIAL_CASE) {// if we have scetial rule for this attribute
							nodeAttrCurrent_value = ATTRIBUTE_SPECIAL_CASE[_tmp3](child);
						}
						else {
							nodeAttrCurrent_value = _tmp4[_tmp3];// get attribute Node
							nodeAttrCurrent_value = // check attribute Node and get it value
								(
									nodeAttrCurrent_value
										&& (nodeAttrCurrent_value.specified || _tmp3 in ATTRIBUTE_SPECIAL_SPECIFIED)
										&& nodeAttrCurrent_value.nodeValue !== ""
									) ? nodeAttrCurrent_value.nodeValue : null
							;
						}

						// Save attribute check operator in a temporary variable
						_tmp1 = current_AttrCheckObject[2];

						// Quick check if we have no attribute value and attribute check operator is not '!=' (8)
						if(nodeAttrCurrent_value === null) {
							match = _tmp1 === 8;
							continue;
						}

						// CSS4 Attribute case-sensitivity
						if(current_AttrCheckObject[4]) {
							nodeAttrCurrent_value = nodeAttrCurrent_value.toUpperCase();
						}

						// Expected attribute value
						nodeAttrExpected_value = current_AttrCheckObject[3];

						switch(_tmp1) {// _tmp1 - attribute check operator defined in map SELECTOR_ATTR_OPERATIONS_MAP

							case 1://css3Attr[2] == '' // W3C "an E element with a "nodeAttrCurrent_value" attribute"
								match = !!nodeAttrCurrent_value || nodeAttrCurrent_value === "";
								break;

							case 2://'=' // W3C "an E element whose "nodeAttrCurrent_value" attribute nodeAttrExpected_value is exactly equal to "nodeAttrExpected_value"
								match = /*nodeAttrCurrent_value && */nodeAttrCurrent_value === nodeAttrExpected_value;
								break;

							case 3://'&=' // from w3.prg "an E element whose "nodeAttrCurrent_value" attribute nodeAttrExpected_value is a list of space-separated nodeAttrExpected_value's, one of which is exactly equal to "nodeAttrExpected_value"
							case 8://'!=' // nodeAttrCurrent_value doesn't contain given nodeAttrExpected_value
								match = (new RegExp('(^| +)' + nodeAttrExpected_value + '($| +)').test(nodeAttrCurrent_value));
								if(_tmp1 === 8)match = !match;
								break;

							case 4://'^=' // from w3.prg "an E element whose "nodeAttrCurrent_value" attribute nodeAttrExpected_value begins exactly with the string "nodeAttrExpected_value"
							case 5://'$=' // W3C "an E element whose "nodeAttrCurrent_value" attribute nodeAttrExpected_value ends exactly with the string "nodeAttrExpected_value"
							case 6://'*=' // W3C "an E element whose "nodeAttrCurrent_value" attribute nodeAttrExpected_value contains the substring "nodeAttrExpected_value"
								_tmp2 = nodeAttrCurrent_value.indexOf(nodeAttrExpected_value);
								match = _tmp1 === 6 ? ~_tmp2 : _tmp1 === 5 ? (_tmp2 == nodeAttrCurrent_value.length - nodeAttrExpected_value.length) : !_tmp2;
								break;

							case 7://'|=' // W3C "an E element whose "nodeAttrCurrent_value" attribute has a hyphen-separated list of nodeAttrExpected_value's beginning (from the left) with "nodeAttrExpected_value"
								match = (/*nodeAttrCurrent_value && */(nodeAttrCurrent_value === nodeAttrExpected_value || !!~nodeAttrCurrent_value.indexOf(nodeAttrExpected_value + '-')));
								break;

							case 9://'~='
								match = /*nodeAttrCurrent_value && */!!~(" " + nodeAttrCurrent_value.replace(RE__queryCompoundSelector__spaces, " ") + " ").indexOf(" " + nodeAttrExpected_value + " ");
								break;
						}
					}
				}

				// check pseudo-classes
				if(match && css3Pseudo) {
					iterateIndex = -1;

					while(
						match
							&& (css3Pseudo_add = css3Pseudo[++iterateIndex])
						) {
						css3PseudoType = css3Pseudo_add[1]; // pseudo type defined in map SELECTOR_PSEUDOS_MAP

						switch(css3PseudoType) {
							case 0://'nth-child': // W3C: "an E element, the n-th child of its parent"
							case 1://'nth-last-child': // W3C: "an E element, the n-th rs of its parent, counting from the last one"
								// css3Pseudo_add[1] - pseudo type defined in map SELECTOR_PSEUDOS_MAP
								// css3Pseudo_add[2] - parsed Tree-Structural pseudo-class rule, for example in :nth-child(an+b) "an+b" - is a rule. Structure for rule:
								// {
								// 0 : undefined // not using
								// 1 : <number> // "a" from "an+b"
								// 2 : <string> // operator "an+b", in this case it is "+"
								// 3 : <number> // "b" from "an+b"
								// }
								// css3Pseudo_add[3] - property for saving caching result of rule (for example "an+b") to Node "nodeIndexLast" or "nodeIndex"
								// css3Pseudo_add[4] - Node child property name: "lastChild" or "firstChild"
								// css3Pseudo_add[5] - Node sibling property name: "previousSibling" or "nextSibling"
								if(!css3PseudoType/*css3PseudoType == 0*/ && !css3Pseudo_add[3])break;
								nodeIndex__Last = css3Pseudo_add[3];
								first_last__Child = css3Pseudo_add[4];
								previous_next__Sibling = css3Pseudo_add[5];
								css3Pseudo_add = css3Pseudo_add[2];

								_tmp3 = child[nodeIndex__Last] || 0;// current child index
								_tmp1 = css3Pseudo_add[3] ? (css3Pseudo_add[2] === '%' ? -1 : 1) * css3Pseudo_add[3] : 0;
								_tmp2 = css3Pseudo_add[1];
								if (_tmp3) {//check if we have already looked into siblings, using exando - very bad
									match = !_tmp2 ?
										!(_tmp3 + _tmp1)
										:
										!((_tmp3 + _tmp1) % _tmp2)
									;
								}
								else {//in the other case just reverse logic for n and loop siblings
									match = false;
									brother = child.parentNode[first_last__Child];

									do {//looping in rs to find if nth expression is correct
										//nodeIndex expando used from Peppy / Sizzle/ jQuery
										if (brother.nodeType == 1 &&
											(brother[nodeIndex__Last] = ++_tmp3) &&
											child === brother &&
											(!_tmp2 ? !(_tmp3 + _tmp1) : !((_tmp3 + _tmp1) % _tmp2))) {
											match = true;
										}
									} while (!match && (brother = brother[previous_next__Sibling]));
								}
								break;

							case 2://'only-child': // W3C: "an E element, only child of its parent"
							case 3://'first-child': // W3C: "an E element, first rs of its parent"
								brother = child;
								while ((brother = brother.previousSibling) && brother.nodeType !== 1) {}
								/* Check for node's existence */
								match = !brother;

								if(!match || css3PseudoType == 3) {
									//Skip brothers from testing START
									while( //TODO:: need massive testing
										(
											brother = combinatorTypeMoreThen_2 ?
												(combinatorType === 4 ?
													void 0
													:
													child === nextRoot ?
														void 0
														:
														getNextElement(child)
													)
												:
												preResult[ ++childrenIndex ]
											)
											&& brother.parentNode == child.parentNode
										){  }
									if(!combinatorTypeMoreThen_2 && combinatorType !== 4) {
										--childrenIndex;
									}
									//Skip brothers from testing END

									break;
								}
							case 4://'last-child': // W3C: "an E element, last rs of its parent"
								match = !getNextElement(child);// Check for node's existence
								break;

							case 5://'root': // W3C: "an E element, root of the document"
								match = (child_nodeName || child.nodeName.toUpperCase()) == "HTML";
								break;

							case 6://'empty': // W3C: "an E element that has no rsren (including text nodes)".
								match = !child.firstChild;
								/*
								 var n, i;
								 for (i = 0;
								 (n = e.childNodes[i]); i++) {
								 if (n.nodeType == 1 || n.nodeType == 3) return false
								 }
								 return true
								 */
								break;

							case 7://'checked': // W3C: "a user interface element E which is checked (for instance a radio-button or checkbox)"
								match = !!child.checked;
								break;

							case 8://'lang': // W3C: "an element of type E in language "fr" (the document language specifies how language is determined)"
								match = (child.lang == css3Pseudo_add || _document_documentElement.lang == css3Pseudo_add);
								break;

							case 9://'enabled':
							case 10://'disabled':
								match = ("disabled" in child && "form" in child/*filter only form elements TODO::check it*/) && (css3PseudoType == 10 ? child.disabled === true && child.type !== 'hidden' : child.disabled === false);
								break;

							case 11://'selected':
								// Accessing this property makes selected-by-default options in Safari work properly.
								match = child.parentNode.selectedIndex && !!child.selected;//Тут уже Closure Compiler не удаляет нужный вызов
								break;

							case 12://'contains':
								match = !!~(child.textContent || child.data || child.innerText || child.nodeValue || child.value || "").indexOf(css3Pseudo[2]);
								break;

							case 13://'not':
							case 14://'matches':
								match = _matchesSelector.call(child, css3Pseudo[2]);
								if(css3PseudoType == 13)match = !match;
								break;

							case 15://'read-only':
							case 16://'read-write':
								child_nodeName || (child_nodeName = child.nodeName.toUpperCase());
								match = (child_nodeName == "INPUT" || child_nodeName == "TEXTAREA" || _Function_call.call(__GCC__SHIMED_GET_ATTRIBUTE_SUPPORT__ && child["__getAttribute__"] || child.getAttribute, child, "contenteditable") !== null) && !child.readonly;
								if(css3PseudoType == 16)match = !match;
								break;

							//case 18: no need to test it here, we olready done this

							case 18://'focus'
								match = child == root.ownerDocument.activeElement;
								break;

							default:
								throw new Error("SYNTAX_ERR");
							/*TODO:: //Non-standart pseudo-classes
							 var f = $$N.nonStandartPseudoClasses[css3Pseudo[1]];
							 if(f)match = f(child);*/
						}
					}
				}
			}

			// If all matches return true we have the right matches node -> save it to result array
			if(match) {
				// If we need only one result Node -> return it immediately
				if(onlyOne) {
					return [child];
				}

				//result.push(child);
				//resultKeys && (resultKeys[indexIn_resultKeys] = result.length - 1);

				if(CSS4_parentSelector_onlyOne_forEachRoot) { // for CSS4 [Determining the Subject of a Selector](http://dev.w3.org/csswg/selectors4/#subject)
					result[rootIndex] = child;
					break;
				}
				else if(globalResultAsSparseArray) { // For IE
					result[indexIn_resultKeys] = child;
				}
				else { // For w3c browsers
					if(resultKeys)resultKeys[indexIn_resultKeys] = true
					result.push(child);
				}
				//resultKeys && (resultKeys[indexIn_resultKeys] = true);
			}
			//else resultKeys && (resultKeys[indexIn_resultKeys] = false);
			child_nodeName = void 0;
			/*else if(indexIn_resultKeys && indexIn_resultKeys in resultKeys && (A = resultKeys[indexIn_resultKeys]) && A !== false) {
			 //sort result
			 result.splice(A, 1);
			 resultKeys[indexIn_resultKeys] = globalResult.length;
			 result.push(child);
			 }*/
		}
		while(// get next child to check
			child = combinatorTypeMoreThen_2 ?
				(combinatorType === 4 ?
					void 0
					:
					child === nextRoot ?
						void 0
						:
						getNextElement(child)
					)
				:
				preResult[ ++childrenIndex ]
			)
			;// child check loop END


		child = void 0;
	}
	while(root = roots[++rootIndex]);// roots loop END

	return result;
}


/**
 * A complex selector is a chain of one or more compound selectors separated by combinators.
 *
 * @param {!string} selector CSS3-selector
 * @param {boolean=} onlyOne only one need
 * @param {(Node|Array.<Node>)=} root
 * @this {Document|HTMLElement|Node}
 * @return {Array.<HTMLElement>}
 * @version 4.0
 */
function queryComplexSelector(selector, onlyOne, root) {
	var hasNodesRef = !!root && this === document//nodesRef supporting only in document.querySelector[All]
		, result = []
		, selElements
	/** @type {boolean} */
		, root_is_iterable_object
		, nqs_node
		, i
	;

	root = hasNodesRef ? root : this;

	if(native_querySelector) {
		try {
			if(hasNodesRef && IS_QUERY_SELECTOR_SUPPORT_REF_NODES) {
				return _NodeList_from(document_native_querySelectorAll.call(document, selector, root));
			}

			root_is_iterable_object =
				/*1*/typeof root["length"] == "number" && /*2*/root["nodeType"] === void 0;//1. fast and unsafe isArray 2. Not a <form>
			nqs_node = root_is_iterable_object ? root[0] : root;
			i = 0;

			do {
				selElements = (
					onlyOne ?
						nqs_node == document ? document_native_querySelector : native_querySelector
						:
						nqs_node == document ? document_native_querySelectorAll : native_querySelectorAll
					).call(nqs_node, selector);

				if(onlyOne || selElements.length) {
					if(onlyOne)return selElements;

					result = result.concat(_Array_slice.call(selElements));
				}
			}
			while(root_is_iterable_object && (nqs_node = root[++i]));

			return _NodeList_from(result);
		}
		catch(__e__) {
			result = [];
		}
	}

	selector = _String_trim.call(selector.replace(RE__queryComplexSelector__doubleSpaces, "$1"));

	var
		rule
		, resultKeys
		, nextRule
		, isLastRule
		, isFirstRule = true
		, fail = false
		, need_SparseArray
		, nodeSortingNeeds
		, forseNo_need_SparseArray = !!document.querySelector["__noorder__"] || !!document.querySelectorAll["__noorder__"]
		, rules = selector
			.replace(RE__querySelector__arrtSpaceSeparated_toSafe, "@=")
			.replace(RE__queryCompoundSelector__pseudoNthChildPlus, "-child\\($1%$2\\)")
			.match(RE__queryComplexSelector__selectorsMatcher)
		, parsedRule
		, haveStackedResult//For CSS4 parent selector
		, stackedResult//For CSS4 parent selector
		, k
		, l
	;

	selElements = root;

	while(rule = rules.shift()) {

		nextRule = rules[0];
		isLastRule = !nextRule || nextRule.charAt(0) === ',';

		if((__GCC__NOT_ONLY_IELT8_SUPPORT__ && !nodeSourceIndex_support) && nextRule && nextRule.length > 1 && !resultKeys)resultKeys = {};

		if(!fail) {
			if(isFirstRule && ("nodeType" in root) && root.nodeType === 9 && rule.toUpperCase() === "BODY") {
				//"Boris Zbarsky <bzbarsky@MIT.EDU>": Mapping selector == "body" to document.body. This isn't a valid optimization for querySelector, since there can in fact be multiple <body> tags and since furthermore document.body can be a <frameset>. A UA could try to optimize this case by keeping track of the <body> tags and such, at some cost on every DOM mutation.
				selElements = [root.body];
				isLastRule ? (result = selElements) : result.concat(selElements);
			}
			else if(isFirstRule && rule === ":root") {
				selElements = [_document_documentElement];
				isLastRule && (result = selElements);
			}
			else if(selElements && (!(root = selElements) || selElements.length === 0)) {//No result in previous rule -> Nothing to do
				selElements = null;
				fail = true;
			}
			else {//CSS3 selector and part of CSS4 selector
				if(need_SparseArray = !forseNo_need_SparseArray && (!__GCC__NOT_ONLY_IELT8_SUPPORT__ || nodeSourceIndex_support) && (isLastRule && (nodeSortingNeeds || !!nextRule || root.length > 1)))nodeSortingNeeds = true;
				parsedRule = rule.match(RE__queryCompoundSelector__selectorMatch);

				/*TODO::CSS4 Reference combinator
				 else if(parsedRule[1] == "/") {
				 if(parsedRule[4] || parsedRule[5] || parsedRule[6] || parsedRule[7] || (!nextRule && nextRule === ",")) {
				 //TODO:: _throwDOMException("SYNTAX_ERR");
				 }
				 else {
				 rules[1] = nextRule.substr(1);//TODO::
				 }
				 }*/

				selElements =
					parsedRule ?
						queryCompoundSelector(
							parsedRule,
							root,
							isLastRule && !haveStackedResult ? result : [],
							need_SparseArray,
							null,
							onlyOne && isLastRule && !haveStackedResult,
							(__GCC__NOT_ONLY_IELT8_SUPPORT__ && !nodeSourceIndex_support) && (isLastRule && resultKeys || !isFirstRule && root.length > 1 && {}),
							haveStackedResult,
							isFirstRule
						)
						:
						[]
				;

				if(haveStackedResult) {
					l = stackedResult.length;
					while(l-- > 0) {
						if(!selElements[l]) {
							selElements.splice(l, 1);
							stackedResult.splice(l, 1);
						}
					}
					if(isLastRule && stackedResult.length) {
						if(onlyOne)return stackedResult[0];

						result = result.concat(stackedResult);
					}
				}
				if(parsedRule && parsedRule[7] !== void 0 && selElements.length && !isLastRule) {//tagName#id.class! <-- "!" CSS4 parent selector
					//TODO:if(haveStackedResult)_throwDOMException("SYNTAX_ERR");//Can be only one "!" parent selector in one compound selector
					haveStackedResult = true;
					stackedResult = [];
					k = -1;
					l = selElements.length;
					while(++k < l) {
						stackedResult.push(selElements[k]);
					}
				}

				// ?? if(selector === "," || !parsedRule)_throwDOMException("SYNTAX_ERR");
			}
		}

		if(onlyOne && isLastRule && selElements.length) {
			return selElements[0];
		}

		//If last rule in this selector
		if(isFirstRule = isLastRule) {
			if(!result.length && selElements) {
				nodeSortingNeeds = false;
				result = _NodeList_from(selElements);
			}
			selElements = null;
			root = this;
			fail = false;
			if(haveStackedResult) {//For CSS4 parent selector
				stackedResult = haveStackedResult = void 0;
			}
		}

		if(!nextRule || nextRule === ",")break;
	}


	if(__GCC__NOT_ONLY_IELT8_SUPPORT__ && !nodeSourceIndex_support && nodeSortingNeeds) {
		result.sort(queryComplexSelector_sort);
	}

	return nodeSortingNeeds ?
		_NodeList_from(result, true) :
		result;
};

function queryComplexSelector_sort(a, b) {
	return a === b ? 0 : a.compareDocumentPosition( b ) & 4 ? -1 : 1;
}

/**
 * @param {!string} selector
 * @this {HTMLElement}
 * @return {boolean}
 */
_matchesSelector =
	_document_documentElement["matches"] ||
	_document_documentElement["webkitMatchesSelector"] ||
	_document_documentElement["mozMatchesSelector"] ||
	_document_documentElement["msMatchesSelector"] ||
	_document_documentElement["oMatchesSelector"] || __GCC__NOT_ONLY_IELT8_SUPPORT__ && "querySelector" in document ?
	function(selector) {
		if(!selector)return false;
		if(selector === "*")return true;
		if(selector === ":root" && this === _document_documentElement)return true;
		if(selector === "body" && this === document.body)return true;

		var thisObj = this,
			parent,
			i,
			str,
			tmp,
			match = false;

		if(!RE_matchSelector__isSimpleSelector.test(selector) && (parent = thisObj.parentNode) && "querySelector" in parent) {
			match = parent.querySelector(selector) === thisObj;
		}

		if(!match && (parent = thisObj.ownerDocument)) {
			tmp = parent.querySelectorAll(selector);
			for (i in tmp ) if(Object.prototype.hasOwnProperty.call(tmp, i)) {
				match = tmp[i] === thisObj;
				if(match)return true;
			}
		}
		return match;
	}
	:
	function(selector) {
		if(!selector)return false;
		if(selector === "*")return true;
		if(this === _document_documentElement && selector === ":root")return true;
		if(this === document.body && selector.toUpperCase() === "BODY")return true;

		//selector = _String_trim.call(selector.replace(RE__queryComplexSelector__doubleSpaces, "$1"));

		var thisObj = this,
			isSimpleSelector,
			tmp,
			match = false,
			i;

		selector = _String_trim.call(selector);

		if(isSimpleSelector = selector.match(RE__selector__easySelector)) {
			switch (selector.charAt(0)) {
				case '#':
					return thisObj.id === selector.slice(1);
					break;
				default:
					match = !(tmp = isSimpleSelector[2]) || thisObj.className && (new RegExp(tmp.replace(RE__querySelector__dottes, " ").replace(RE__getElementsByClassName, STRING_FOR_RE__getElementsByClassName))).test(thisObj.className);
					return match && !(tmp = isSimpleSelector[1]) || (thisObj.tagName && thisObj.tagName.toUpperCase() === tmp.toUpperCase());
					break;
			}
		}
		else if(!RE_matchSelector__isSimpleSelector.test(selector)) {//easy selector
			tmp = queryCompoundSelector(selector.match(RE__queryCompoundSelector__selectorMatch), null, false, null, thisObj, true);

			return tmp[0] === thisObj;
		}
		else {
			tmp = queryComplexSelector.call(thisObj.ownerDocument, selector);

			for ( i in tmp ) if(Object.prototype.hasOwnProperty.call(tmp, i)) {
				match = tmp[i] === thisObj;
				if(match)return true;
			}
			return false;
		}
	}
;

if(__GCC__EXPORT_MATCHES_SHIMS__) {
	//SHIM export
	tmp = "matchesSelector";
	if(!_document_documentElement[tmp]) {
		_Element_prototype["matches"] = _document_documentElement["matches"] = _Element_prototype[tmp] = _document_documentElement[tmp] = _matchesSelector;
	}

	tmp = "matches";
	if(!(tmp in _Element_prototype))_Element_prototype[tmp] = document.documentElement[tmp] = _Element_prototype.matchesSelector;
}//if(__GCC__MATCHES_SHIM__)

if(__GCC__EXPORT_QUERY_SELECTOR_ALL_SHIM__) {
	tmp = "querySelectorAll";
	/**
	 * @param {!string} selector
	 * @param {(Node|Array.<Node>)=} nodesRef
	 * @this {Document|Node}
	 * @return {Array.<Node>}
	 */
	_Element_prototype[tmp] = _document_documentElement[tmp] = document[tmp] = function(selector, nodesRef) {
		return queryComplexSelector.call(this, selector, false, nodesRef);
	}
}//if(__GCC__QUERY_SELECTOR_ALL_SHIM__)


if(__GCC__EXPORT_QUERY_SELECTOR_SHIM__){
	tmp = "querySelector";
	/**
	 * @param {!string} selector
	 * @param {(Node|Array.<Node>)=} nodesRef
	 * @this {Document|Node}
	 * @return {Node}
	 */
	_Element_prototype[tmp] = _document_documentElement[tmp] = document[tmp] = function(selector, nodesRef) {
		return queryComplexSelector.call(this, selector, true, nodesRef) || null;
	}
}//if(__GCC__QUERY_SELECTOR_SHIM__)

if(__GCC__EXPORT_GET_ELEMENTS_BY_CLASS_NAME_SHIM__) {
	tmp = "getElementsByClassName";
	if(!document[tmp])_Element_prototype[tmp] = _document_documentElement[tmp] = document[tmp] = _shim_getElementsByClassName;
}
//SHIM export







//export for tests
if(__GCC__GLOBAL_QUERY_SELECTOR_EXPORT__) {
	window[__GCC__GLOBAL_QUERY_SELECTOR_EXPORT__] = function(selector, root) {
		return queryComplexSelector.call(root || _document_documentElement, selector, true);
	}
}
if(__GCC__GLOBAL_QUERY_SELECTOR_ALL_EXPORT__) {
	window[__GCC__GLOBAL_QUERY_SELECTOR_ALL_EXPORT__] = function(selector, root) {
		return queryComplexSelector.call(root || _document_documentElement, selector);
	}
}
if(__GCC__GLOBAL_MATCHES_SELECTOR_EXPORT__) {
	window[__GCC__GLOBAL_MATCHES_SELECTOR_EXPORT__] = function(selector, root) {
		return _document_documentElement["matches"].call(root || _document_documentElement, selector);
	}
}
//export for tests

_Element_prototype = tmp = void 0;

})(window);
