"use strict";

const Nodest = require("nodest");
const Filesystem = require("fs");
const Path = require("path");
const Dot = require("dot");

Dot.templateSettings.varname = "vars, data";
Dot.templateSettings.strip = false;

/**
* Manager class for HTML templates
* @class
*/
class TemplateManager {
	
	constructor(app) {
		this.all = {};
		
		this._templates = {
			'!': new Nodest.Template(app, null)
		};
		this._templateData = {};
		
		Object.defineProperty(this, "pathContext", {enumerable: true, value: app.pathContext});
		Object.defineProperty(this, "app", {enumerable: true, value: app});
	}
	
	/**
	* Set default key-value pair for data objects to be sent to templates. i.e. "api_url" if you need it accessible from every template.
	* @param {string} name Key which you're setting for the data object
	* @param {any} value Value which you're setting for the specified key
	* @return {any}
	*/
	setTemplateData(name, value) {
		this._templateData[name] = value;
		return value;
	}

	/**
	* Unsets template data for the specified key
	* @param {string} name Key which you're unsetting
	*/
	unsetTemplateData(name) {
		delete this._templateData;
	}

	resolveTemplatePath(path) {
		try { 
			return Filesystem.readFileSync(path); 
		} 
		catch (e) {
			return null;
		}
	}

	/**
	* Retrieves the template from the cache or loads the template and caches it
	* @param {string} The template name (full path in the the app/templates directory).
	* @param {optional boolean} raw Whether or not the template is "raw" (i.e. just an HTML string, no template engine required.) Defaults to false.
	* @param {optional Nodest.PathContext} pathContext PathContext used to try resolving the given template.
	* @return {Nodal.Template} The template instance
	*/
	getTemplate(name, raw, pathContext) {
		raw = !!raw | 0; // coerce to 0, 1

		if (!this._templates[name]) {
			this._templates[name] = Array(2);
		}

		if(Nodest.settings.service.templates.cache && this._templates[name][raw]) {
			return this._templates[name][raw];
		}

		// use path to resolve filename
		var contents = "";
		var filename = name;
		
		// if we were passed pathContext, try using it
		if (pathContext) {
			filename = pathContext.resolve(name);
		}
		
		// try given filename
		contents = this.resolveTemplatePath(filename);
		if (!contents) {
			// try relative
			filename = this.pathContext.resolve(name);
			contents = this.resolveTemplatePath(filename);
			if (!contents) {
				// try root
				filename = Path.join(this.app.cwd(), "./templates/", name);
				contents = this.resolveTemplatePath(filename);
				if (!contents) {
					// try module
					filename = Path.join(__dirname, "../templates", name);
					contents = this.resolveTemplatePath(filename);
				}
			}
		}

		if (contents == null) {
			return null;
		}

		this._templates[name][raw] = raw ? contents : Dot.template(contents);

		return this._templates[name][raw];
	}
	
	find(name) {
		return this._templates[name];
	}
	
	get data() {
		return this._templateData;
	}

}

module.exports = TemplateManager;
