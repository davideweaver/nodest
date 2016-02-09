"use strict";

const Nodest = require("nodest");
const Url = require("url");
const Template = require('./template.js');
const Log = require("./log");
const RouterManager = require("./routermanager");
const KoaCompose = require("koa-compose");

/**
  * Core Nodest Application. Contains globally-applicable logic, methods and properties. Accessible by reference in any Controller or Space.
	* Derive your own class from this and launch it using the Bootstrapper.
  * @class
	* @param {Nodest.PathContext} pathContext Path object
  */
class Application {
	constructor(pathContext, extensions) {
		Object.defineProperty(this, "pathContext", {enumerable: true, value: pathContext});

		// load extensions
		this.extensions = new Nodest.ExtensionManager(this, extensions);

		// call internal init
		this.__init();
	}
	
	__init() {

		// call extensions
		this.extensions.emit("boot");

		// init template manager
		this.templates = new Nodest.TemplateManager(this);

		// init log
		this.log = Log.scoped("app");
		
		// setup web service (based on koa)
		this.koa = (new Nodest.WebService()).create();
		
		// set signed cookie keys
		this.koa.keys = ['im a newer secret', 'i like turtle'];
		
		// setup route manager with default router
		this.routers = new RouterManager(this);
		this.routers.add("noprefix", "", true);
		
		// handle errors (before app initializes itself)
		this.koa.use(function *(next) {
			try {
				yield next;
				if ((this.status < 200 || this.status > 399) && !this.res._hasBody && this.controller) {
					return this.controller.error("", this.status, "");
				}
			} catch (err) {
				if (this.controller) {
					return this.controller.error(err.message, err.status, err.stack);
				}
				throw err;
			}
		});
	
		// call extensions
		this.extensions.emit("pre-init");
	
		// let subclass handle init
		this.init();
		
		// call extensions
		this.extensions.emit("post-init");
	}
	
	/**
	* App init method. Override to provide initialization for the application.
	*/
	init() {
	}

	/**
	* Causes the application to listen to HTTP requests on the given port. Effectively starts the application.
	* @param {int} port Port for server to listen for requests
	*/
	listen(port) {

		// handle routes (after app initializes itself)
		var app = this;
		this.koa.use(function *(next){
			let pathname = Url.parse(this.url, true).pathname;
			var match = app.routers.match(pathname);
			if (match) {
				yield match.activate(app, this);
			}
			yield next;
		});
		
		// listen on port
		this.koa.listen(port);
		this.log.info("app listening: port " + port);
		
		// call started method
		this.started();
	}
	
	/**
	* App started method. Override to provide initialization for the application after it's started.
	*/
	started() {
	}

	/**
	* The current working directory path.
	* @return {string}
	*/
	extend(Extension, options) {
		return this.extensions.add(Extension, options);
	}
	
	/**
	* The current working directory path.
	* @return {string}
	*/
	cwd() {
		return process.cwd();
	}

	/**
	* Use middleware as derived from Nodest.Middleware
	* @param {string|Nodest.Middleware} middleware The path or class of middleware to use.
	* @param {Nodest.PathContext} [pathContext] A Nodest.PathContext to use for resolving the middleware path.
	*/
	use(middleware, pathContext) {	
		// use path context is passed in, otherwise use the app's
		pathContext = pathContext || this.pathContext;
			
		// resolve the middleware, either a path to an exported class or a class
		var Middleware = null;
		if (typeof middleware == "string") {
			Middleware = require(pathContext.resolve(middleware));
		}
		else Middleware = middleware;
		
		// instantiate the middleware, it may be an array of middleware
		var mw = new Middleware(this);
		var r = mw.exec();
		if (Array.isArray(r)) {
			this.koa.use(KoaCompose(r));
		}
		else this.koa.use(r);
	}

	/**
	* Sets up a controller route for the application
	* @param {string} path The path to match for the route
	* @param {string|Nodest.Controller} controller The Controller to dispatch. Can be a Nodest.Controller derived class or a path to a file that exports a controller.
	* @param {Nodest.PathContext} [pathContext] A Nodest.PathContext to use for resolving the controller path.
	*/
	route(path, controller, pathContext) {
		// use path context is passed in, otherwise use the app's
		pathContext = pathContext || this.pathContext;
		
		this.routers.route(path, controller, pathContext);
	}

	/**
	* Sets up a named controller route for the application
	* @param {string} routerName name of router
	* @param {string} path The path to match for the route
	* @param {string|Nodest.Controller} controller The Controller to dispatch. Can be a Nodest.Controller derived class or a path to a file that exports a controller.
	* @param {Nodest.PathContext} [pathContext] A Nodest.PathContext to use for resolving the controller path.
	*/
	routeFor(routerName, path, controller, pathContext) {
		// use path context is passed in, otherwise use the app's
		pathContext = pathContext || this.pathContext;
		
		this.routers.routeFor(routerName, path, controller, pathContext);
	}
	
	/**
	* Removes a controller route for the application
	* @param {string} path The path to match for the route
	*/
	deroute(path) {
		this.routers.deroute(path);
	}
	
	/**
	* Removes a named controller route for the application
	* @param {string} routerName name of router
	* @param {string} path The path to match for the route
	*/
	derouteFor(routerName, path) {
		this.router.derouteFor(routerName, path);
	}
}

module.exports = Application;