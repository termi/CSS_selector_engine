# Super fast css selector engine

## Goal

- Be lightweight
- Be fastest
- Be customizable
- Optimised for IE < 8

## Shims

- document.querySelector
- document.querySelectorAll
- document.getElementsByClassName
- document.documentElement.querySelector
- document.documentElement.querySelectorAll
- document.documentElement.getElementsByClassName
- document.documentElement.matchesSelector
- document.documentElement.matches
- Element.prototype.querySelector
- Element.prototype.querySelectorAll
- Element.prototype.getElementsByClassName
- Element.prototype.matchesSelector
- Element.prototype.matches

## Using in IE < 8

```javascript
var $$ = function(node, selector) {
    return document.documentElement.querySelectorAll.call(node, selector)
}
var $$0 = function(node, selector) {
    return document.documentElement.querySelector.call(node, selector)
}
var matchNode = function(node, selector) {
    return document.documentElement.matches.call(node, selector)
}

matchNode( $$(document, "div.class")[0], "div.class" ) == true
```

## Customization

The are few [GGC](http://closure-compiler.appspot.com/home) flags in script. You can set it as you need and compile script with [GGC](http://closure-compiler.appspot.com/home) in _ADVANCED_OPTIMIZATIONS_ mode.

- Build for non-IE lt 8

	set the value of '__GCC__NOT_ONLY_IELT8_SUPPORT__' to 'true' and compile _/__SRC/CSS_selector_engine.js_ using (Google Closure Compiler)[http://closure-compiler.appspot.com/home]

## TODO

- Tests: coming coon
- Benchmark: coming coon

## License

    MIT
