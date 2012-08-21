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
 http://css4-selectors.com/selector/css4/subject-of-selector-with-child-combinator/
 For example, the following selector represents a list item LI unique child of an ordered list OL:
 OL > LI:only-child
 However the following one represents an ordered list OL having a unique child, that child being a LI:
 $OL > LI:only-child
 */

// [[[|||---=== GCC DEFINES START ===---|||]]]
/** @define {boolean} */
var __GCC__NOT_ONLY_IELT8_SUPPORT__ = false;
/** @define {boolean} */
var __GCC__IE_NODE_CONSTRUCTOR_AS_ACTIVX__ = true;
/** @define {boolean} */
var __GCC__IE_NODE_CONSTRUCTOR_AS_DOM_ELEMENT__ = false;
/** @define {boolean} */
var __GCC__QUERY_SELECTOR_ALL_RESULT_AS_NODE_LIST_AND_NODE_LIST_POLYFILL__ = true;
/** @define {boolean} */
var __GCC__MATCHES_SHIM__ = true;
/** @define {boolean} */
var __GCC__QUERY_SELECTOR_ALL_SHIM__ = true;
/** @define {boolean} */
var __GCC__QUERY_SELECTOR_SHIM__ = true;
/** @define {boolean} */
var __GCC__GET_ELEMENTS_BY_CLASS_NAME_SHIM__ = true;
/** @define {(string|boolean)} */
var __GCC__GLOBAL_QUERY_SELECTOR_ALL_EXPORT__ = false;
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
  , RE__queryManySelector__doubleSpaces = /\s*([,>+~ ])\s*/g//Note: Use with "$1"
  /** @type {RegExp} @const */
  , RE__querySelector__arrtSpaceSeparated_toSafe = /\~\=/g//Note: Use with "@="
  /** @type {RegExp} @const */
  , RE__queryManySelector__selectorsMatcher = /(^[>+~ ]?|,|\>|\+|~| ).*?(?=[,>+~ ]|$)/g
  /** @type {RegExp} @const */
  , RE__querySelector__dottes = /\./g
  /** @type {RegExp} @const */
  , RE__queryOneSelector__spaces = /\s/g
  /** @type {RegExp} @const */
  , RE__queryOneSelector__selectorMatch = /^([,>+~ ])?([\w\-\|\*]*)\#?([\w-]*)((?:\.?[\w-])*)(\[.+\])?(?:\:(.+))?$/
  /** @type {RegExp} @const */
  , RE__queryOneSelector__attrMatcher = /^\[?['"]?(.*?)['"]?(?:([\*~&\^\$\@!]?=)['"]?(.*?)['"]?)?\]?$/
  /** @type {RegExp} @const */
  , RE__queryOneSelector__pseudoMatcher = /^([^(]+)(?:\(([^)]+)\))?$//* regexpt from jass 0.3.9 (http://yass.webo.in/) rev. 371 line 166 from right */
  /** @type {RegExp} @const */
  , RE__queryOneSelector__pseudoNthChildPlus = /\-child\((\dn)\+(\d)\)/g//Note: Use with "-child\($1%$2\)"
  /** @type {RegExp} @const */
  , RE__queryOneSelector__pseudoNthChildMatcher = /(?:([-]?\d*)n)?(?:(%|-)(\d*))?//* regexpt from jass 0.3.9 (http://yass.webo.in/) rev. 371 line 181 ( mod === 'nth-last-child' ?...) */
  /** @type {RegExp} @const */
  , RE_matchSelector__isSimpleSelector = /([,>+~ ])/
  /** @const @type {RegExp} */
  , RE_left_spaces = /^\s+/
   /** @const @type {RegExp} */
  , RE_space = /\s/
	
  /** @type {Object} @const */
  , selectorCombinatorTypeMap = {
    "" : 1,
    " " : 1,
    "," : 1,
    ">" : 2,
    "~" : 3,
    "+" : 4
  }
  /** @type {Object} @const */
  , selectorAttrOperatorsMap = {
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
  , selectorPseudosMap = {
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
    'matches' : 14,//:-moz-any, :-webkit-any
    'read-only' : 15,       //http://www.w3.org/TR/selectors4/#rw-pseudos
    'read-write' : 16      //http://www.w3.org/TR/selectors4/#rw-pseudos
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
  , attributeSpecialCase = {
    "href" : function(node) {
      return node.getAttribute("href", 2);
    }
  }
  /** @type {Object} @const */
  , attributeSpecialSpecified = {"coords" : 1, "id" : 1, "name" : 1}

  , _NodeList_from = function(iterable, iterable_is_sparseArray) {
      var length = iterable.length >>> 0,
        result = new _NodeList;

      if(!iterable_is_sparseArray) {
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

  , hasSourceIndex = __GCC__NOT_ONLY_IELT8_SUPPORT__ ? 
      sourceIndex_propertyName in _document_documentElement && !("opera" in global)//Old Opera has very slow 'sourceIndex'
      :
      true

  , UUID = 1

  , _document_documentElement = document.documentElement

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

  /** @const */
  , _String_substr_with_negative_value_support = 
	"ab".substr(-1) == "b" ?
		String.prototype.substr
		:
		function(start, length) {
			return _String_substr.call(this, start < 0 ? (start = this.length + start) < 0 ? 0 : start : start, length);
		}

  , _shim_getElementsByClassName

  , isNative_getElementsByClassName = __GCC__NOT_ONLY_IELT8_SUPPORT__ ? 
      _document_documentElement.getElementsByClassName && (_document_documentElement.getElementsByClassName + "").length < 80
      :
      false

  , _Array_slice = Array.prototype.slice

  , tmp

  , _NodeList

  , _matchesSelector
;


//_NodeList.prototype
if(__GCC__QUERY_SELECTOR_ALL_RESULT_AS_NODE_LIST_AND_NODE_LIST_POLYFILL__) {
_NodeList = function() {}
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

if(__GCC__NOT_ONLY_IELT8_SUPPORT__ && !hasSourceIndex)sourceIndex_propertyName = "uniqueId";

//Only for IE
if(!isNative_getElementsByClassName && __GCC__GET_ELEMENTS_BY_CLASS_NAME_SHIM__)_shim_getElementsByClassName = function(klas) {
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
}



/**
 * @param {!string} selector CSS3-selector
 * @param {Node|Array.<Node>|Object} roots
 * @param {Array.<Node>} globalResult
 * @param {boolean} globalResultAsSparseArray 
 * @param {Node|Array.<HTMLElement>=} preResult
 * @param {boolean=} onlyOne only one need
 * @param {(Object|boolean)=} resultKeys for non-IE browsers
 * @return {Array.<Node>}
 */
function queryOneSelector(selector, roots, globalResult, globalResultAsSparseArray, preResult, onlyOne, resultKeys) {
  var /** @type {Array.<string>} */selectorArr = selector.match(RE__queryOneSelector__selectorMatch) || [];
  //if(selector === "," || !selectorArr)_throwDOMException("SYNTAX_ERR");

  var result = globalResult || [];

  var /** @type {boolean} */isMatchesSelector = !!preResult
    , /** @type {Node} */root = isMatchesSelector && (roots = {}) || (!roots ? document : 
                                "length" in roots ? //fast and unsafe isArray
                                  roots[0] :
                                  roots)
    , /** @type {Node} */nextRoot
    , /** @type {number} */rootIndex = 0
    , /** @type {(Node|undefined)} */child
    , /** @type {string} */child_nodeName
    , /** @type {Node} */brother
    , /** @type {number} */combinatorType = selectorCombinatorTypeMap[selectorArr[1] || ""] || 0
    , /** @type {boolean} */combinatorTypeMoreThen_2 = combinatorType > 2
    , /** @type {(string|undefined)} */tag = selectorArr[2]
    , /** @type {boolean} */needCheck_tag = !!tag
    , /** @type {(string|undefined)} */id = selectorArr[3]
    , /** @type {boolean} */needCheck_id = !!id
    , /** @type {(string|Array.<string>|undefined)} */classes = selectorArr[4]
    , /** @type {boolean} */needCheck_classes = !!classes
    , /** @type {boolean} */needCheck_nodeType = tag === "*"
    , /** @type {number} */kr
    , /** @type {number} */childrenIndex
    , /** @type {number} */indexIn_resultKeys
    , /** @type {boolean} */match
    , /** @type {boolean} */canWeReturnUnsafeArray
    , /** @type {Array.<string>} */css3Attr_add
    , /** @type {Array.<string>} */css3Pseudo_add
    , /** @type {number} */css3PseudoOperatorType

    , /** @type {string} */nodeAttrCurrent_value
    , /** @type {string} */nodeAttrExpected_value
    , /** @type {(RegExp|string)} */klas
    , /** @type {(string|Array.<string>)} */ css3Attr
    , /** @type {(string|Array.<string>)} */ css3Pseudo
    , /** @type {Array} */elementsById_Cache
    , a, b, c, u
    , A, B, C
  ;

  if(needCheck_tag) {
    tag = (needCheck_nodeType ? void 0 : tag.replace("|", ":").toUpperCase());
  }
  
  if(needCheck_classes) {
    classes = classes.replace(RE__querySelector__dottes, " ");
    if(!isNative_getElementsByClassName || combinatorType !== 1)klas = new RegExp(classes.replace(RE__getElementsByClassName, STRING_FOR_RE__getElementsByClassName));
  }

  if(isMatchesSelector)combinatorType = 0;

  if(css3Attr = selectorArr[5]) {
    css3Attr = _String_split.call(css3Attr, "][");
    kr = -1;
    while(css3Attr_add = css3Attr[++kr]) {
      css3Attr_add = css3Attr[kr] = css3Attr_add.match(RE__queryOneSelector__attrMatcher);
      
      //selectorAttrOperatorsMap

      css3Attr_add[2] = selectorAttrOperatorsMap[css3Attr_add[2]];

      b = css3Attr_add[3];
      if(b) {
        if(_String_substr_with_negative_value_support.call(b, -2) == " i") {
          //http://css4-selectors.com/selector/css4/attribute-case-sensitivity/
          css3Attr_add[3] = b.substr(0, b.length - 2);
          css3Attr_add[4] = true;
        }
      }
    }
    b = void 0;
  }

  if(css3Pseudo = selectorArr[6]) {
    css3Pseudo = css3Pseudo.match(RE__queryOneSelector__pseudoMatcher);
    css3PseudoOperatorType = selectorPseudosMap[css3Pseudo[1]];
    if(css3PseudoOperatorType < 2 && css3Pseudo[2]) {// 'nth-child':0 and 'nth-last-child':1
      if(!/\D/.test(css3Pseudo[2]))css3Pseudo_add = [null, 0, '%', css3Pseudo[2]];
      else if(css3Pseudo[2] === 'even')css3Pseudo_add = [null, 2];
      else if(css3Pseudo[2] === 'odd')css3Pseudo_add = [null, 2, '%', 1];
      else css3Pseudo_add = css3Pseudo[2].match(RE__queryOneSelector__pseudoNthChildMatcher);
      A = css3PseudoOperatorType ? "nodeIndexLast" : "nodeIndex";
      B = css3PseudoOperatorType ? "lastChild" : "firstChild";
      C = css3PseudoOperatorType ? "previousSibling" : "nextSibling";
    }
  }
  
  selectorArr = selector = void 0; 

  //prepear
  if(combinatorType == 1) {
    if(!needCheck_id) {
      needCheck_classes = needCheck_classes && !isNative_getElementsByClassName;
      needCheck_tag = needCheck_tag && isNative_getElementsByClassName && !!classes;
    }
    else {
      if(_can_useGetElementsByName_as_getElementById) {//workaround for IE
        preResult = document.getElementsByName(id);
        elementsById_Cache = [];
        kr = -1;
        while(child = preResult[++kr]) {
          if(child.id == id) {
            elementsById_Cache.push(child);
          }
        };
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
        };
        kr = -1;
        while(child = preResult[++kr]) {
          child.setAttribute("id", id);
        };
      }

      preResult = needCheck_id = void 0;
    }
  }

  canWeReturnUnsafeArray = (!("length" in roots) || roots.length === 1) && !globalResultAsSparseArray && !css3Attr && !css3Pseudo && !needCheck_tag && !needCheck_classes && !needCheck_id;

  do {
    child = void 0;
    switch(combinatorType) {
      case 1://" " or ""
        //if("all" in root && !root.all.length)continue;
        if(!id) {//tagName or/and class
          if(tag === "BODY" && root.nodeType === 9) {
            preResult = [root.body];
            needCheck_classes = !!classes;
            canWeReturnUnsafeArray = canWeReturnUnsafeArray && !needCheck_classes;
          }
          else if(!classes || !isNative_getElementsByClassName) {
            preResult = root.getElementsByTagName(tag || "*");
          }
          else {
            preResult = root.getElementsByClassName(classes);
          }
        }
        else {//id
          preResult = [];
          if(elementsById_Cache.length) {
            kr = -1;
            while(child = elementsById_Cache[++kr]) {
              if(root === document || root.contains(child)){
                preResult.push(child);
                elementsById_Cache.splice(kr--, 1);
              }
            };
          }
          else return result;
        }
        child = preResult[0];
      break;
      case 2://">" W3C: "an F element preceded by an E element"
        preResult = root.children;
        child = preResult[0];
      break;
      case 3://"~" W3C: "an F element preceded by an E element"
        nextRoot = roots[rootIndex + 1];
      case 4://"+"
        if(!(child = getNextElement(root)))continue;
      default:
    }

    if(canWeReturnUnsafeArray)return preResult;

    childrenIndex = 0;

    if(child) do {
      if((!needCheck_nodeType || child.nodeType === 1)) {
        if(
              (!__GCC__NOT_ONLY_IELT8_SUPPORT__ || hasSourceIndex) ?
	  !(globalResultAsSparseArray && 
	     (indexIn_resultKeys = child[__GCC__NOT_ONLY_IELT8_SUPPORT__ ? sourceIndex_propertyName : "sourceIndex"]) in globalResult)
               :
               !resultKeys || ((indexIn_resultKeys = child[sourceIndex_propertyName]) ? !(indexIn_resultKeys in resultKeys) : (child[sourceIndex_propertyName] = ++UUID))) {
        //if((!needCheck_nodeType || child.nodeType === 1) && !(globalResultAsSparseArray && (indexIn_resultKeys = (child[sourceIndex_propertyName] || (child[sourceIndex_propertyName] = ++UUID))) in globalResult)) {


          /*if(needCheck_tag && child.nodeName !== tag || needCheck_id && child.id !== id || needCheck_classes && !(child.className && klas.test(child.className))) {
            resultKeys && (resultKeys[indexIn_resultKeys] = false);
            continue;
          }*/
          //if(combinatorType === 1 && nextRoot && nextRoot.contains(root))continue;

          if(match = !(needCheck_tag && (child_nodeName = child.nodeName.toUpperCase()) !== tag || needCheck_id && child.id !== id || needCheck_classes && !(child.className && klas.test(child.className)))) {
            if(css3Attr) {
              kr = -1;
              u = child.attributes;

              while(match && (css3Attr_add = css3Attr[++kr]) && (match = (c = css3Attr_add[1]) in u)) {
                if(c in attributeSpecialCase)nodeAttrCurrent_value = attributeSpecialCase[c](child);
                else {
                  nodeAttrCurrent_value = u[c];
                  nodeAttrCurrent_value = (nodeAttrCurrent_value && (nodeAttrCurrent_value.specified || c in attributeSpecialSpecified) && nodeAttrCurrent_value.nodeValue !== "") ? nodeAttrCurrent_value.nodeValue : null;
                }
                
                a = css3Attr_add[2];

                if(nodeAttrCurrent_value === null) {
                  if(!(match = a == 8))
                  match = false;
                  continue;
                }

                if(css3Attr_add[4]) {//Attribute case-sensitivity
                  nodeAttrCurrent_value = nodeAttrCurrent_value.toUpperCase();
                }

                nodeAttrExpected_value = css3Attr_add[3];

                /* function calls for CSS2/3 attributes selectors */
                switch(a) {
                  /* W3C "an E element with a "nodeAttrCurrent_value" attribute" */
                  case 1://css3Attr[2] == ''
                    match = !!nodeAttrCurrent_value || nodeAttrCurrent_value === "";
                  break;

                  /*
                  W3C "an E element whose "nodeAttrCurrent_value" attribute nodeAttrExpected_value is
                  exactly equal to "nodeAttrExpected_value"
                  */
                  case 2://'='
                    match = /*nodeAttrCurrent_value && */nodeAttrCurrent_value === nodeAttrExpected_value;
                  break;

                  /*
                  from w3.prg "an E element whose "nodeAttrCurrent_value" attribute nodeAttrExpected_value is
                  a list of space-separated nodeAttrExpected_value's, one of which is exactly
                  equal to "nodeAttrExpected_value"
                  */
                  case 3://'&='
                  /* nodeAttrCurrent_value doesn't contain given nodeAttrExpected_value */
                  case 8://'!='
                    match = /*nodeAttrCurrent_value && */(new RegExp('(^| +)' + nodeAttrExpected_value + '($| +)').test(nodeAttrCurrent_value));
                    if(a == 8)match = !match;
                  break;

                  /*
                  from w3.prg "an E element whose "nodeAttrCurrent_value" attribute nodeAttrExpected_value
                  begins exactly with the string "nodeAttrExpected_value"
                  */
                  case 4://'^='
                  /*
                  W3C "an E element whose "nodeAttrCurrent_value" attribute nodeAttrExpected_value
                  ends exactly with the string "nodeAttrExpected_value"
                  */
                  case 5://'$='
                  /*
                  W3C "an E element whose "nodeAttrCurrent_value" attribute nodeAttrExpected_value
                  contains the substring "nodeAttrExpected_value"
                  */
                  case 6://'*='
                    b = nodeAttrCurrent_value.indexOf(nodeAttrExpected_value);
                    match = a === 6 ? ~b : a === 5 ? (b == nodeAttrCurrent_value.length - nodeAttrExpected_value.length) : !b;
                  break;

                  /*
                  W3C "an E element whose "nodeAttrCurrent_value" attribute has
                  a hyphen-separated list of nodeAttrExpected_value's beginning (from the
                  left) with "nodeAttrExpected_value"
                  */
                  case 7://'|='
                    match = (/*nodeAttrCurrent_value && */(nodeAttrCurrent_value === nodeAttrExpected_value || !!~nodeAttrCurrent_value.indexOf(nodeAttrExpected_value + '-')));
                  break;

                  case 9://'~='
                    match = /*nodeAttrCurrent_value && */!!~(" " + nodeAttrCurrent_value.replace(RE__queryOneSelector__spaces, " ") + " ").indexOf(" " + nodeAttrExpected_value + " ");
                  break;
                }
              }
            }
        
            if(match && css3Pseudo) {
              /*
              function calls for CSS2/3 modificatos. Specification taken from
              http://www.w3.org/TR/2005/WD-css3-selectors-20051215/
              on success return negative result.
              */
              switch(css3PseudoOperatorType) {
                /* W3C: "an E element, the n-th child of its parent" */
                case 0://'nth-child':
                /* W3C: "an E element, the n-th rs of its parent, counting from the last one" */
                case 1://'nth-last-child':
                  if(!css3Pseudo_add[1] && !css3Pseudo_add[3])break;
                  c = child[A] || 0;
                  a = css3Pseudo_add[3] ? (css3Pseudo_add[2] === '%' ? -1 : 1) * css3Pseudo_add[3] : 0;
                  b = css3Pseudo_add[1];
                  if (c) {//check if we have already looked into siblings, using exando - very bad
                    match = !b ? !(c + a) : !((c + a) % b);
                  }
                  else {//in the other case just reverse logic for n and loop siblings
                    match = false;
                    brother = child.parentNode[B];
                    //c++;
                    do {//looping in rs to find if nth expression is correct
                      //nodeIndex expando used from Peppy / Sizzle/ jQuery
                      if (brother.nodeType == 1 &&
                        (brother[A] = ++c) &&
                        child === brother &&
                        (!b ? !(c + a) : !((c + a) % b))) {
                        match = true;
                      }
                    } while (!match && (brother = brother[C]));
                  }
                break;

                /* W3C: "an E element, only child of its parent" */
                case 2://'only-child':
                /* implementation was taken from jQuery.1.7 */
                /* W3C: "an E element, first rs of its parent" */
                case 3://'first-child':
                /* implementation was taken from jQuery.1.7 */
                  brother = child;
                  while ((brother = brother.previousSibling) && brother.nodeType !== 1) {}
                /* Check for node's existence */
                  match = !brother;

                  if(!match || css3PseudoOperatorType == 3)break;
                /* W3C: "an E element, last rs of its parent" */
                case 4://'last-child'://In this block we lose "rs" value
                /* Check for node's existence */
                  match = !getNextElement(child);
                break;

                /* W3C: "an E element, root of the document" */
                case 5://'root':
                  match = (child_nodeName || child.nodeName.toUpperCase()) == "HTML";
                break;             
                /*
                Rrom w3.org: "an E element that has no rsren (including text nodes)".
                Thx to John, from Sizzle, 2008-12-05, line 416
                */
                case 6://'empty':
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
                /*
                W3C: "a user interface element E which is checked
                (for instance a radio-button or checkbox)"
                */
                case 7://'checked':
                  match = !!child.checked;
                break;
                /*
                W3C: "an element of type E in language "fr"
                (the document language specifies how language is determined)"
                */
                case 8://'lang':
                  match = (child.lang == css3Pseudo_add || _document_documentElement.lang == css3Pseudo_add);
                break;

                case 9://'enabled':
                case 10://'disabled':
                  match = ("disabled" in child && "form" in child/*filter only form elements TODO::check it*/) && (css3PseudoOperatorType == 10 ? child.disabled === true && child.type !== 'hidden' : child.disabled === false);
                break;

                /* thx to John, from Sizzle, 2008-12-05, line 407 */
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
                  if(css3PseudoOperatorType == 13)match = !match;
                break;

                case 15://'read-only':
                case 16://'read-write':
                  child_nodeName || (child_nodeName = child.nodeName.toUpperCase());
                  match = (child_nodeName == "INPUT" || child_nodeName == "TEXTAREA" || child.getAttribute("contenteditable") !== null) && !child.readonly;
                  if(css3PseudoOperatorType == 16)match = !match;
                break;
                /*TODO::
                default:
                  //Non-standart pseudo-classes
                  var f = $$N.nonStandartPseudoClasses[css3Pseudo[1]];
                  if(f)match = f(child);*/
              }
            }
          }

          if(match) {
            if(onlyOne)return [child];
            //result.push(child);
            //resultKeys && (resultKeys[indexIn_resultKeys] = result.length - 1);

            if(globalResultAsSparseArray) {
              result[indexIn_resultKeys] = child;
            }
            else {
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
      }
    }
    while( child = combinatorTypeMoreThen_2 ? (combinatorType === 4 ? void 0 : child === nextRoot ? void 0 : getNextElement(child) ) : preResult[ ++childrenIndex ] );
    

  }
  while(root = roots[++rootIndex]);

  return result;
}


/**
 * @param {!string} selector CSS3-selector
 * @param {boolean=} onlyOne only one need
 * @param {(Node|Array.<Node>)=} root
 * @this {Document|HTMLElement|Node} root
 * @return {Array.<HTMLElement>}
 * @version 4.0
 */
function queryManySelector(selector, onlyOne, root) {
  root || (root = this);

  var rt,
    rules,
    timeStamp;

  selector = _String_trim.call(selector.replace(RE__queryManySelector__doubleSpaces, "$1"));

  var result = [],
    rule,
    i = -1,
    selElements = root,
    el,
    k,
    l,
    resultKeys,
    nextRule,
    lastRule,
    firstRule = true,
    fail = false,
    need_SparseArray,
    result_isSparseArray,
    forseNo_need_SparseArray = !!document.querySelector["__noorder__"] || !!document.querySelectorAll["__noorder__"];

      
  rules = selector
    .replace(RE__querySelector__arrtSpaceSeparated_toSafe, "@=")
    .replace(RE__queryOneSelector__pseudoNthChildPlus, "-child\($1%$2\)")
    .match(RE__queryManySelector__selectorsMatcher)
  ;

  while((rule = rules[++i])) {
    
    nextRule = rules[i + 1];
    lastRule = !nextRule || nextRule.charAt(0) === ',';

    if((__GCC__NOT_ONLY_IELT8_SUPPORT__ && !hasSourceIndex) && nextRule && nextRule.length > 1 && !resultKeys)resultKeys = {};

    if(!fail) {
      if(firstRule && ("nodeType" in root) && root.nodeType === 9 && rule.toUpperCase() === "BODY") {
        //"Boris Zbarsky <bzbarsky@MIT.EDU>": Mapping selector == "body" to document.body. This isn't a valid optimization for querySelector, since there can in fact be multiple <body> tags and since furthermore document.body can be a <frameset>. A UA could try to optimize this case by keeping track of the <body> tags and such, at some cost on every DOM mutation.
        selElements = [root.body];
        lastRule ? (result = selElements) : result.concat(selElements);
      }
      else if(firstRule && rule === ":root") {
        selElements = [_document_documentElement];
        lastRule && (result = selElements);
      }
      else if(selElements && (!(root = selElements) || selElements.length === 0)) {//No result in previous rule -> Nothing to do
        selElements = null;
        fail = true;
      }
      else if(!fail) {//CSS3 selector
        if(need_SparseArray = !forseNo_need_SparseArray && (!__GCC__NOT_ONLY_IELT8_SUPPORT__ || hasSourceIndex) && (lastRule && (result_isSparseArray || !!nextRule || root.length > 1)))result_isSparseArray = true;
        selElements = queryOneSelector(rule, root, lastRule ? result : [], need_SparseArray, null, onlyOne && lastRul, (__GCC__NOT_ONLY_IELT8_SUPPORT__ && !hasSourceIndex) && (lastRule && resultKeys || !firstRule && root.length > 1 && {}));
      }
    }

    //If last rule in this selector
    if(firstRule = lastRule) {
      if(!result.length && selElements) {
        result_isSparseArray = false;
        result = _NodeList_from(selElements);
      }
      selElements = null;
      root = this;
      fail = false;
    }
    
    if(!nextRule || nextRule === ",")break;
  }
   

  if((__GCC__NOT_ONLY_IELT8_SUPPORT__ && !hasSourceIndex)) {
    result.sort(queryManySelector_sort);
  }

  return result_isSparseArray ?
    _NodeList_from(result, true) :
    result;
};

function queryManySelector_sort(a, b) {
  return a === b ? 0 : a.compareDocumentPosition( b ) & 4 ? -1 : 1;
}

if(__GCC__MATCHES_SHIM__) {
/**
 * @param {!string} selector
 * @this {HTMLElement}
 * @return {boolean}
 */
_matchesSelector = function(selector) {
  if(!selector)return false;
  if(selector === "*")return true;
  if(this === _document_documentElement && selector === ":root")return true;
  if(this === document.body && selector.toUpperCase() === "BODY")return true;

  //selector = _String_trim.call(selector.replace(RE__queryManySelector__doubleSpaces, "$1"));

  var thisObj = this,
    isSimpleSelector,
    tmp,
    match = false,
    i,
    str;

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
    tmp = queryOneSelector(selector, null, false, null, thisObj, true);
    
    return tmp[0] === thisObj;
  }
  else {
    tmp = queryManySelector.call(thisObj.ownerDocument, selector);

    for ( i in tmp ) if(Object.prototype.hasOwnProperty.call(tmp, i)) {
          match = tmp[i] === thisObj;
          if(match)return true;
      }
      return false;
  }
}

//SHIM export
tmp = "matchesSelector";
if(!_document_documentElement[tmp]) {
  _Element_prototype["matches"] = _document_documentElement["matches"] = _Element_prototype[tmp] = _document_documentElement[tmp] = _Element_prototype[tmp] = _document_documentElement["webkitMatchesSelector"] ||
    _document_documentElement["mozMatchesSelector"] ||
    _document_documentElement["msMatchesSelector"] ||
    _document_documentElement["oMatchesSelector"] ||
    __GCC__NOT_ONLY_IELT8_SUPPORT__ && "querySelector" in document ? function(selector) {
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
  } : _matchesSelector;
}

tmp = "matches";
if(!(tmp in _Element_prototype))_Element_prototype[tmp] = document.documentElement[tmp] = _Element_prototype.matchesSelector;
}//if(__GCC__MATCHES_SHIM__)

if(__GCC__QUERY_SELECTOR_ALL_SHIM__) {
tmp = "querySelectorAll";
if(!document[tmp]) {
 /**
  * @param {!string} selector
  * @param {(Node|Array.<Node>)=} nodesRef
  * @this {Document|Node}
  * @return {Array.<Node>}
  */
  _Element_prototype[tmp] = _document_documentElement[tmp] = document[tmp] = function(selector, nodesRef) {
    return queryManySelector.call(this, selector, false, nodesRef);
  }
}
}//if(__GCC__QUERY_SELECTOR_ALL_SHIM__)


if(__GCC__QUERY_SELECTOR_SHIM__){
tmp = "querySelector";
if(!document[tmp]) {
  /**
   * @param {!string} selector
   * @param {(Node|Array.<Node>)=} nodesRef
   * @this {Document|Node}
   * @return {Node}
   */
  _Element_prototype[tmp] = _document_documentElement[tmp] = document[tmp] = function(selector, nodesRef) {
    return queryManySelector.call(this, selector, true, nodesRef)[0] || null;
  }
}
}//if(__GCC__QUERY_SELECTOR_ALL_SHIM__)

if(__GCC__GET_ELEMENTS_BY_CLASS_NAME_SHIM__) {
tmp = "getElementsByClassName";
if(!document[tmp])_Element_prototype[tmp] = _document_documentElement[tmp] = document[tmp] = _shim_getElementsByClassName;
}
//SHIM export







//export for tests
if(__GCC__GLOBAL_QUERY_SELECTOR_ALL_EXPORT__) {
window[__GCC__GLOBAL_QUERY_SELECTOR_ALL_EXPORT__] = function(selector, root) {
  return queryManySelector.call(root || document, selector);
}
}

//export for tests


})(window);
