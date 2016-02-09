"use strict";

const Nodest = require("nodest");
const Url = require("url");

/**
* Router manager for managing multiple routers
* @class
*/
class RouterManager {

	/**
	* @param {class Nodal.Application} app The application class to instantiate when a route is activated
	* @param {Nodest.PathContext} pathContext Path object
	*/
	constructor(app) {
		this.routers = {};
		this.defaultRouter = null;
		this.app = app;
	}
	
	/**
	* Adds a new, named router
	* @param {string} name name of router
	* @param {string} prefix The URL prefix for the router
	* @param {boolean} [isDefault] Whether this router should be the default when a new, un-named route is added (defaults to false)
	*/
	add(name, prefix, isDefault) {
		if (isDefault === undefined)
			isDefault = false;
		var r = {
			router: new Nodest.Router(this.app),
			prefix: prefix
		};
		this.routers[name] = r;
		if (isDefault)
			this.defaultRouter = r;
	}
	
	/**
	* Gets a router
	* @param {string} [routerName] name of router, otherwise the default router
	* @return {Nodest.Router} router if found
	*/
	getRouter(routerName) {
		var r = null;
		if (routerName === undefined) {
			r = this.defaultRouter;
			if (!r)
				throw("Default router does not exist");
		}
		else {
			r = this.routers[routerName];
			if (!r)
				throw("Router '" + routerName + "' does not exist");
		}
		return r;
	}
	
	/**
	* Sets up a controller route in the named router
	* @param {string} routerName name of router
	* @param {string} path The path to match for the route
	* @param {string|Nodest.Controller} controller The Controller to dispatch. Can be a Nodest.Controller derived class or a path to a file that exports a controller.
	* @param {Nodest.PathContext} pathContext A Nodest.PathContext to use for resolving the controller path.
	*/
	routeFor(routerName, path, controller, pathContext) {
		this.getRouter(routerName).router.route(path, controller, pathContext);
	}
	
	/**
	* Sets up a controller route using the default router
	* @param {string} path The path to match for the route
	* @param {string|Nodest.Controller} controller The Controller to dispatch. Can be a Nodest.Controller derived class or a path to a file that exports a controller.
	* @param {Nodest.PathContext} pathContext A Nodest.PathContext to use for resolving the controller path.
	*/
	route(path, controller, pathContext) {
		this.getRouter().router.route(path, controller, pathContext);
	}
	
	/**
	* Removes a controller route from the named router
	* @param {string} routerName name of router
	* @param {string} path The path to match for the route
	*/
	derouteFor(routerName, path) {
		this.getRouter(routerName).router.deroute(path);
	}
	
	/**
	* Removes a controller route from the default router
	* @param {string} path The path to match for the route
	*/
	deroute(path) {
		this.getRouter().router.deroute(path);
	}
	
	/**
	* Finds the appropriate route given a pathname.
	* @param {string} pathname The requests pathname
	* @return {Nodest.RouteMatch} The route instance that matches the pathname
	*/
	match(pathname) {
		var emptyRouter = null;
		for (var key in this.routers) {
			var r = this.routers[key];
			var prefix = r.prefix;
			if (prefix != "") {
				if (pathname.substring(0, prefix.length) == prefix) {
					return this.routers[key].router.match(pathname.substring(prefix.length));
				}
			}
			else {
				emptyRouter = this.routers[key];
			}
		}
		if (!emptyRouter)
			return null;
		return emptyRouter.router.match(pathname);
	}
}

module.exports = RouterManager;