"use strict";

const Nodest = require("./nodest");
const Application = require("./application");

/**
  * Bootstrapper for running servers. Restarts when changes are made to the underlying file structure.
  * @class
  */
class Bootstrapper {
	
	/**
    * @param {string} path Path to your app.js file which exports your Application
    */
	constructor(application) {
		this.path = "";
		this.extensions = [];
		this.appcls = null;
		if (typeof application == "string")
			this.path = application;
		else this.appcls = application;
	}
	
	/**
	* Extend nodest using the given extension.
	* @param {Nodest.Extension} Extension Class name of the extension to use (typically imported)
	* @param {any} options Options to pass extension
	* @return {Nodest.Extension}
	*/
	extend(Extension, options) {
		return this.extensions.push({
			cls: Extension,
			options: options
		});
	}
	
	/**
    * Begins the Bootstrapper, instantiates your app.
    * @param {function} callback Method to execute when Application is finished initializing.
    */
    start(callback) {

      callback = typeof callback === 'function' ? callback : this._onStart;
      this._onStart = callback;

			// locate application
			if (this.path !== "") {
				this.path = process.cwd() + '/' + this.path;
				this.appcls = require(this.path);
			}
			else this.path = process.cwd();
			let App = this.appcls;
			
			// create a path context
			var context = new Nodest.PathContext("app", this.path);

			if (!(Application.prototype.isPrototypeOf(this.appcls.prototype))) {
				throw new Error("Bootstrapper requires valid Nodest.Application");
			}

			this.app = new App(context, this.extensions);
			
			this._onStart(this.app);
    }
}

module.exports = Bootstrapper;