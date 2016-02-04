"use strict";

/**
* Base class for Nodest extensions
* @class
*/
class Extension {
	
	constructor(app, options) {
		Object.defineProperty(this, "app", {enumerable: true, value: app});
		Object.defineProperty(this, "options", {enumerable: true, value: options});
	}
	
	init() {	
	}
	
	on(event, arg) {
	}
	
}

module.exports = Extension;
