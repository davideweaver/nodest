"use strict";

const Koa = require("koa");

/**
* Factory class for creating Koa module. Override this class and pass it in the BootStrapper to use your own version of Koa 
* @class
*/
class WebService {
	
	/**
		* @param {Nodest.Application} app Parent application object
	*/
	constructor(app) {
		Object.defineProperty(this, "app", {enumerable: true, value: app});
	}
	
	/**
	* Create the Koa object to be used throughout the app
	* @return {koa}
	*/
	create() {
		return Koa();
	}
}

module.exports = WebService;