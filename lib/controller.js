"use strict";

const Url = require("url");
const Filesystem = require("fs");
const Nodest = require("nodest");
const Template = require("./template");
const API = require("./api");
const Dot = require("dot");
const Statuses = require("statuses");

// For templates
Dot.templateSettings.varname = "vars, data";
Dot.templateSettings.strip = false;

/**
* A new Controller instance is created by the Router when its associated route is hit, handles all business logic
* @class
*/
class Controller {

	/**
 	* @param {Nodest.PathContext} Nodest PathContext 
	* @param {Koa.Context} koa Context
	* @param {Nodest.Application} app Parent application object
	* @param {Object} vars HTTP request vars containing: location (route), query (GET), body (POST), and id values
	*/
	constructor(pathContext, ctx, app, vars) {

		this._initializeTime = (new Date()).valueOf();
		this._ctx = ctx;
		this._path = Url.parse(this._ctx.url, true).pathname;
		this._headers = {};
		this._log = pathContext.log;
		this._contentType = "text/html";

		Object.defineProperty(this, "pathContext", {enumerable: true, value: pathContext});
		Object.defineProperty(this, "app", {enumerable: true, value: app});
		Object.defineProperty(this, "vars", {enumerable: true, value: vars});
	}

	isGenerator(fn) {
    return fn.constructor.name === 'GeneratorFunction';
	}

	callbackFunc(fn, thisArg) {
		return new Promise((resolve, reject) => {
			fn.call(thisArg, result => resolve(result));
		});
	}
	
	/**
	* Run the given method
	* @private
	* @param {method} value HTTP method to run
	*/
	* run(method) {
		var fn = this[method];
		
		if (this.isGenerator(fn)) { 
			// generator func, yield to it
			yield fn.call(this);
		}
		else if (fn.length == 1) {
			// expects a callback
			yield this.callbackFunc(fn, this);
		}
		else {
			fn.call(this);
		}
	}
	
	/**
	* The Koa Context object
	* @return {koa.Context}
	*/
	get ctx() {
		return this._ctx;
	}
	
	/**
	* The log object
	* @return {Nodest.Log}
	*/
	get log() {
		return this._log;
	}

	get contentType() {
        return this._contentType;
    }

    set contentType(type){
        if(type){ 
            this._contentType = type;
        }
    }

	/**
	* The pathname used by the router to instantiate this controller
	* @return {string}
	*/
	path() {
		return this._path;
	}

	/**
	* Send an http.ServerResponse indicating there was an Internal Server Error (500)
	* @param {string} msg Error message to send
	* @param {Object} details Any additional details for the error (must be serializable)
	* @return {boolean}
	*/
	error(msg, status, stack) {
		status = status || 500;
		var err = Statuses[status];
		this.ctx.status = status;
		
		if (typeof msg === 'object') {
			msg = JSON.stringify(msg);	
		}
		
		this.log.error(msg);
		
		var template = this.template("error/" + status + ".html");
		if (!template.valid) 
			template = this.template("error/index.html");
		
		this.render(
			template.generate({
				status: status,
				msg: err,
				details: msg,
				stack: stack || "no stack",
				config: Nodest.config,
				expose: Nodest.settings.errors.expose
			})
		);
		
		return true;
	}
		
	/**
	* Using API formatting, generate an error or respond with model / object data.
	* @param {Error|Object|Array|Nodal.Model|Nodal.ModelArray} data Object to be formatted for API response
	* @param {optional Function} next Callback function to call if needed.
	* @return {boolean}
	*/
	respond(data, next) {
		return this.render(data, next);
	}
	
	/**
	* Retrieves the template matching the provided name. Lazy loads new templates from disk, otherwise caches.
	* @param {string} templates List of heirarchy of templates (each a full path in the the app/templates directory).
	* @return {Nodest.Template} The template instance
	*/
	template() {

		let templates = Array.prototype.slice.call(arguments)

		try {
			// Loop the template hierarchy 
			let templateContents = templates.map((name) => {
				return this.app.templates.getTemplate(name, false, this.pathContext);
			});
			
			// return the first templates contents
			if (templateContents[0]) {
				return new Template(
					this.app,
					this,
					templateContents[0],
					templates.slice(1).join(',')
				);
			}
		} 
		catch(e) {
			this.log.error(e);
		}

		this.log.debug("Could not load template: " + templates[0]);

		return this.app.templates.find("!");
	}
	
	/**
	* Retrieves a "raw" template (i.e. just an HTML string, no template engine required.)
	* @param {string} name The traw emplate name (full path in the the app/templates directory).
	* @return {Nodal.Template} The template instance
	*/
	rawTemplate(name) {

		let contents = this.app.templates.getTemplate(name, true);

		try {

			return new Template(
				this,
				function() { return contents; }
			);

		} catch(e) {

			this.log.error(e);
			this.log.error("Could not load raw template " + name);
		}

		return this.app.templates.find("!");
	}
	
	/**
	* Send an http.ServerResponse back to the client with data to render
	* @param {string|Buffer|Object} data Data to be returned to the client. Buffers will be written as binary, Objects will be JSON-serialized, and strings will be output as-is.
	* @return {boolean}
	*/
	render(data, next) {

		if (!data) { 
			data = ""; 
		}

		if (data instanceof Buffer) {
			this.ctx.set("Content-Type", this._contentType);
			//this.getHeader('Content-Type') || this.setHeader('Content-Type', 'text/html');
		} 
		else if (typeof data === 'object') {
			this.ctx.set("Content-Type", "application/json");
			try {
				data = JSON.stringify(data);
			} 
			catch(e) {
				data = {};
			}
		} 
		else if (data != "") {
			this.ctx.set("Content-Type", this._contentType);
			data = data + '';
		}

		if (data instanceof Buffer) {
			this.write(data, 'binary');
		} else {
			this.write(data);
		}

		if (next)
			next();

		return true;
	}
	
	/**
	* Use Controller#render instead (which calls this method). Ends the http.ServerResponse by sending data.
	* @param {string|Buffer} data Response to send to client
	* @return {boolean}
	*/
	write(data) {
		this._ctx.response.set(this._headers);
		this._ctx.body = data;

		this._log.debug(this._ctx.method + " " + this._ctx.url + " returned " + this._ctx.status + " in " + ((new Date()).valueOf() - this._initializeTime) + "ms");

		return true;
	}

	/**
	* Method called when a route is hit with a GET request and no "id" parameter. Intended to be overwritten when inherited. Defaults to calling Controller#get.
	*/
	index() {
		this.get.apply(this, arguments);
	}

	/**
	* Method called when a route is hit with a PUT request. Intended to be overwritten when inherited. Defaults to calling Controller#put.
	*/
	update() {
		this.put.apply(this, arguments);
	}

	/**
	* Method called when a route is hit with a GET request, if not first intercepted by custom Controller#index or Controller#show methods. Intended to be overwritten when inherited.
	*/
	get() {
		this.error("", 501);
	}

	/**
	* Method called when a route is hit with a PUT request, if not first intercepted by custom Controller#update method. Intended to be overwritten when inherited.
	*/
	put() {
		this.error("", 501);
	}

	/**
	* Method called when a route is hit with a POST request, if not first intercepted by custom Controller#create method. Intended to be overwritten when inherited.
	*/
	post() {
		this.error("", 501);
	}

	/**
	* Method called when a route is hit with a DELETE request, if not first intercepted by custom Controller#destroy method. Intended to be overwritten when inherited.
	*/
	del() {
		this.error("", 501);
	}

	/**
	* Method called when a route is hit with an OPTIONS request. Typically unused, exists for CORS purposes.
	*/
	options() {
		this.ctx.status = 200;
		this.render();
	}
}

module.exports = Controller;
