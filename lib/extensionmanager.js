"use strict";

/**
* Manager class for Nodest extensions
* @class
*/
class ExtensionManager {
	
	constructor(app, extensions) {
		this.all = {};
		
		// create and add all extensions
		for (var i=0; i<extensions.length; i++) {
			var extdef = extensions[i];
			var ext = new extdef.cls(app, extdef.options);
			this.all[extdef.cls.name] = ext;
		}
		
		Object.defineProperty(this, "app", {enumerable: true, value: app});
	}
	
	emit(event, arg) {
		for (var key in this.all) {
			var ext = this.all[key];
			ext.on(event, arg);
		}
	}
	
}

module.exports = ExtensionManager;
