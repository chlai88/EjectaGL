// This file is always executed before the App's index.js. It sets up most
// of Ejecta's functionality and emulates some DOM objects.

// Feel free to add more HTML/DOM stuff if you need it.


// Make 'window' the global scope
self = window = this;

(function(window) {

// The 'ej' object provides some basic info and utility functions
var ej = window.ejecta = new Ejecta.EjectaCore();

// Set up the screen properties and useragent
window.devicePixelRatio = ej.devicePixelRatio;
window.innerWidth = ej.screenWidth;
window.innerHeight = ej.screenHeight;

window.screen = {
	availWidth: window.innerWidth,
	availHeight: window.innerHeight
};

window.navigator = {
	userAgent: ej.userAgent,
	appVersion: ej.appVersion,
	get onLine() { return ej.onLine; } // re-evaluate on each get
};

// Create the default screen canvas
window.canvas = new Ejecta.WebGLCanvas();
window.canvas.type = 'canvas';
window.canvas.style = {};

// The console object
window.console = {
	log: function() {
		var args = Array.prototype.join.call(arguments, ', ');
		ej.log( args );
	},
	
	assert: function() {
		var args = Array.prototype.slice.call(arguments);
		var assertion = args.shift();
		if( !assertion ) {
			ej.log( 'Assertion failed: ' + args.join(', ') );
		}
	}
};
window.console.debug =
	window.console.info =
	window.console.warn =
	window.console.error =
	window.console.log;


// Timers
window.setTimeout = function(cb, t){ return ej.setTimeout(cb, t); };
window.setInterval = function(cb, t){ return ej.setInterval(cb, t); };
window.clearTimeout = function(id){ return ej.clearTimeout(id); };
window.clearInterval = function(id){ return ej.clearInterval(id); };
window.requestAnimationFrame = function(cb, element){ return ej.setTimeout(cb, 16); };


// The native Image, Audio, HttpRequest and LocalStorage class mimic the real elements
window.Image = Ejecta.Image;
window.Audio = Ejecta.Audio;
window.XMLHttpRequest = Ejecta.HttpRequest;
window.localStorage = new Ejecta.LocalStorage();

// Typed array shims
// It's just a regular Javascript object(not an array) acting like an Array.
// Absolutely not for performance improvments that Typed arrays are supposed to give.
// These are just temporary shims for source code compatibility with WebGL
// until typed arrays are supported in Ejecta's JavascriptCore.
function BaseTypedArray(arg, type) {
    // Set the type so that base type(Float32, Int32 etc.) can be queried easily in native code.
    this.__ejecta_type__ = type;
 
    // Check whether the argument is a regular or typed array.
    if( (Object.prototype.toString.call(arg) == "[object Array]") ||
         (arg instanceof BaseTypedArray) ) {
        this.length = arg.length;
        for( var i = 0; i < arg.length; i++ ) {
            this[i] = arg[i];
        }
    } else if( typeof(arg) == "number" ) {
        // Set the array length if the arg is a number.
        this.length = arg;
        for( var i = 0; i < arg; i++ ) { this[i] = 0; }
    } else {
        // Otherwise it's just an empty array (Throw exception?)
        this.length = 0;
    }
}

// Array type constants.
// Must match the one in EJConvert.m till a better mechanism is found.
BaseTypedArray.Int8Array = 1;
BaseTypedArray.Uint8Array = 2;
BaseTypedArray.Int16Array = 3;
BaseTypedArray.Uint16Array = 4;
BaseTypedArray.Int32Array = 5;
BaseTypedArray.Uint32Array = 6;
BaseTypedArray.Float32Array = 7;
BaseTypedArray.Float64Array = 8;

function Int8Array(arg) {
    BaseTypedArray.call(this, arg, BaseTypedArray.Int8Array);
}
Int8Array.prototype = new BaseTypedArray();
Int8Array.prototype.constructor = Int8Array;
 
function Uint8Array(arg) {
    BaseTypedArray.call(this, arg, BaseTypedArray.Int8Array);
}
Uint8Array.prototype = new BaseTypedArray();
Uint8Array.prototype.constructor = Uint8Array;

function Int16Array(arg) {
    BaseTypedArray.call(this, arg, BaseTypedArray.Int16Array);
}
Int16Array.prototype = new BaseTypedArray();
Int16Array.prototype.constructor = Int16Array;

function Uint16Array(arg) {
    BaseTypedArray.call(this, arg, BaseTypedArray.Int16Array);
}
Uint16Array.prototype = new BaseTypedArray();
Uint16Array.prototype.constructor = Uint16Array;

function Int32Array(arg) {
    BaseTypedArray.call(this, arg, BaseTypedArray.Int32Array);
}
Int32Array.prototype = new BaseTypedArray();
Int32Array.prototype.constructor = Int32Array;
 
function Uint32Array(arg) {
    BaseTypedArray.call(this, arg, BaseTypedArray.Int32Array);
}
Uint32Array.prototype = new BaseTypedArray();
Uint32Array.prototype.constructor = Uint32Array;

function Float32Array(arg) {
    BaseTypedArray.call(this, arg, BaseTypedArray.Float32Array);
}
Float32Array.prototype = new BaseTypedArray();
Float32Array.prototype.constructor = Float32Array;

function Float64Array(arg) {
    BaseTypedArray.call(this, arg, BaseTypedArray.Float64Array);
}
Float64Array.prototype = new BaseTypedArray();
Float64Array.prototype.constructor = Float64Array;

window.Int8Array    = Int8Array;
window.Uint8Array   = Uint8Array;
window.Int16Array   = Int16Array;
window.Uint16Array  = Uint16Array;
window.Int32Array   = Int32Array;
window.Uint32Array  = Uint32Array;
window.Float32Array = Float32Array;
window.Float64Array = Float64Array;
 
 
// Set up a "fake" HTMLElement
HTMLElement = function( tagName ){
	this.tagName = tagName;
	this.children = [];
};

HTMLElement.prototype.appendChild = function( element ) {
	this.children.push( element );
	
	// If the child is a script element, begin to load it
	if( element.tagName == 'script' ) {
		ej.setTimeout( function(){
			ej.require( element.src );
			if( element.onload ) {
				element.onload();
			}
		}, 1);
	}
};


// The document object
window.document = {
	location: { href: 'index' },
	
	head: new HTMLElement( 'head' ),
	body: new HTMLElement( 'body' ),
	
	events: {},
	
	createElement: function( name ) {
		if( name === 'canvas' ) {
			var canvas = new Ejecta.Canvas();
			canvas.type = 'canvas';
			canvas.style = {};
			return canvas;
		}
		else if( name == 'audio' ) {
			return new Ejecta.Audio();
		}
		else if( name === 'img' ) {
			return new window.Image();
		}
		return new HTMLElement( name );
	},
	
	getElementById: function( id ){
		if( id === 'canvas' ) {
			return window.canvas;
        }
        // Try to search for shader script with the given id.
        // Returns null if no shaders are found.
        return ej.getShader(id);
	},
	
	getElementsByTagName: function( tagName ) {
		if( tagName === 'head' ) {
			return [document.head];
		}
		else if( tagName === 'body' ) {
			return [document.body];
		}
		return [];
	},
	
	addEventListener: function( type, callback, useCapture ){
		if( type == 'DOMContentLoaded' ) {
			ej.setTimeout( callback, 1 );
			return;
		}
		if( !this.events[type] ) {
			this.events[type] = [];
			
			// call the event initializer, if this is the first time we
			// bind to this event.
			if( typeof(this._eventInitializers[type]) == 'function' ) {
				this._eventInitializers[type]();
			}
		}
		this.events[type].push( callback );
	},
	
	removeEventListener: function( type, callback ) {
		var listeners = this.events[ type ];
		if( !listeners ) { return; }
		
		for( var i = listeners.length; i--; ) {
			if( listeners[i] === callback ) {
				listeners.splice(i, 1);
			}
		}
	},
	
	_eventInitializers: {},
	_publishEvent: function( type, event ) {
		var listeners = this.events[ type ];
		if( !listeners ) { return; }
		
		for( var i = 0; i < listeners.length; i++ ) {
			listeners[i]( event );
		}
	}
};
window.canvas.addEventListener = window.addEventListener = function( type, callback ) { 
	window.document.addEventListener(type,callback); 
};
window.canvas.removeEventListener = window.removeEventListener = function( type, callback ) { 
	window.document.removeEventListener(type,callback); 
};



// Touch events

// Setting up the 'event' object for touch events in native code is quite
// a bit of work, so instead we do it here in JavaScript and have the native
// touch class just call a simple callback.
var touchInput = null;
var touchEvent = {
	type: 'touchstart', 
	target: canvas,
	touches: null,
	targetTouches: null,
	changedTouches: null,
	preventDefault: function(){},
	stopPropagation: function(){}
};

var publishTouchEvent = function( type, all, changed ) {
	touchEvent.touches = all;
	touchEvent.targetTouches = all;
	touchEvent.changedTouches = changed;
	touchEvent.type = type;
	
	document._publishEvent( type, touchEvent );
};
window.document._eventInitializers.touchstart =
	window.document._eventInitializers.touchend =
	window.document._eventInitializers.touchmove = function() {
	if( !touchInput ) {
		touchInput = new Ejecta.TouchInput();
		touchInput.ontouchstart = function( all, changed ){ publishTouchEvent( 'touchstart', all, changed ); };
		touchInput.ontouchend = function( all, changed ){ publishTouchEvent( 'touchend', all, changed ); };
		touchInput.ontouchmove = function( all, changed ){ publishTouchEvent( 'touchmove', all, changed ); };
	}
};



// Devicemotion events

var accelerometer = null;
var deviceMotionEvent = {
	type: 'devicemotion', 
	target: canvas,
	acceleration: {x: 0, y: 0, z: 0},
	accelerationIncludingGravity: {x: 0, y: 0, z: 0},
	preventDefault: function(){},
	stopPropagation: function(){}
};

window.document._eventInitializers.devicemotion = function() {
	if( !accelerometer ) {
		accelerometer = new Ejecta.Accelerometer();
		accelerometer.ondevicemotion = function( x, y, z ){
			deviceMotionEvent.accelerationIncludingGravity.x = x;
			deviceMotionEvent.accelerationIncludingGravity.y = y;
			deviceMotionEvent.accelerationIncludingGravity.z = z;
			document._publishEvent( 'devicemotion', deviceMotionEvent );
		};
	}
};


})(this);
