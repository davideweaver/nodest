/* global process */

"use strict";

const Nodest = require("./nodest");
const Application = require("./application");

/**
  * Bootstrapper for running servers. Restarts when changes are made to the underlying file structure.
  * @class
  */
class Bootstrapper {
	
	/**
    * @param {string|Nodest.Application} application The path or class of the Application to use.
		* @param {Nodest.WebService} [webservice] The path or class of the WebService to use.
    */
	constructor(application, webservice) {
		this.path = "";
		this.extensions = [];
		this.application = application;
		this.webservice = webservice;
		
		// establish application path
		if (typeof application == "string") {
			this.path = process.cwd() + '/' + application;
		}
		else this.path = process.cwd();
		
		// create a PathContext to resolve filenames
		this.pathContext = new Nodest.PathContext("bootstrapper", process.cwd())
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

			// resolve the Application, either a path to an exported class or a class
			var Application = null;
			if (typeof this.application == "string") {
				Application = require(this.pathContext.resolve(this.application));
			}
			else Application = this.application;
			
			// resolve the WebService, either a path to an exported class or a class
			var WebService = null;
			if (this.webservice !== undefined) {
				if (typeof this.webservice == "string") {
					WebService = require(this.pathContext.resolve(this.webservice));
				}
				else WebService = this.webservice;
			}
			else WebService = Nodest.WebService;

			if (!(Nodest.Application.prototype.isPrototypeOf(Application.prototype))) {
				throw new Error("Bootstrapper requires valid Nodest.Application");
			}

			// create a PathContext for the application
			var context = new Nodest.PathContext("app", this.path);

			// create and start application
			this.app = new Application(context, WebService, this.extensions);
			this._onStart(this.app);
    }
}

module.exports = Bootstrapper;