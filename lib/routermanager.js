"use strict";

const Nodest = require("nodest");
const Url = require("url");

/**
* Router manager for managing more than 1 router
* @class
*/
class RouterManager {

	/**
	* @param {class Nodal.Controller} controller The controller class to instantiate when a route is activated
	* @param {Nodest.PathContext} pathContext Path object
	*/
	constructor(app) {
		this.routers = {};
		this.defaultRouter = null;
		this.app = app;
	}
	
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
	
	routeFor(routerName, path, controller, pathContext) {
		var r = this.routers[routerName];
		if (!r)
			throw("Router '" + routerName + "' does not exist");
		r.router.route(path, controller, pathContext);
	}
	
	route(path, controller, pathContext) {
		var r = this.defaultRouter;
		if (!r)
			throw("Default router does not exist");
		r.router.route(path, controller, pathContext);
	}
	
	deroute(path) {
		var r = this.defaultRouter;
		if (!r)
			throw("Default router does not exist");
		r.router.deroute(path);
	}
	
	/**
	* Finds the appropriate route given a pathname.
	* @param {string} pathname The requests pathname
	* @return {RouteMatch} The route instance that matches the pathname
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