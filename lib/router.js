"use strict";

const Nodest = require("nodest");
const Url = require("url");
const Querystring = require("querystring");
const Routes = require("routes");
const Log = require("./log").scoped("router");
const Controller = require('./controller');

/**
* Routes are what the router uses to actually instantiate Controllers
* @class
*/
class Route {

	/**
	* @param {class Nodal.Controller} controller The controller class to instantiate when a route is activated
	* @param {Nodest.PathContext} pathContext Path object
	*/
	constructor(controller, pathContext) {
		if (!Controller.prototype.isPrototypeOf(controller.prototype)) {
			throw new Error('Route requires a valid Controller');
		}
		this.controller = controller;
		this.pathContext = pathContext;
	}
}

/**
* Object returned by a match on the router. Activates the controller for the route.
* @class
*/
class RouteMatch {
	
	 constructor(app, result) {
		 this.app = app;
		 this.result = result;
		 this.route = result.fn;
	 }
	 
	/**
	* Parse query parameters from a query string. Matches arrays and object query param definitions. (obj[a]=1&obj[b]=2)
	* @param {string} query The query string to match
	* @return {Object} The parsed object
	*/
	parseQueryParameters(query) {

		let obj = {};

		Object.keys(query).forEach(function(key) {

			let newKey, subKey;
			let value = query[key];
			let match = key.match(/(.*)\[(.*)\]$/);

			if (match) {

				newKey = match[1];
				subKey = match[2];

				if (subKey) {
					obj[newKey] = obj[newKey] || {};
					obj[newKey][subKey] = value;
					return;
				}

				value = !(value instanceof Array) ? [value] : value;

				obj[newKey] = value;
				return;

			}

			obj[key] = value;
			return;

		});

		return obj;

	}

	/**
	* Activate the route once you know it has been hit.
	* @param {Nodest.Application} app The Nodest.Application instance assocatied with this route / router
	* @param {Koa.Context} ctx
	*/
	* activate(app, ctx) {
		
		let urlParts = Url.parse(ctx.url, true);

		let query = this.parseQueryParameters(urlParts.query);
		
		if (this.result.params.id === undefined)
			this.result.params.id = "";
		
		let headers = {};
		Object.keys(ctx.request.headers).forEach(function(key) {
			headers[key] = ctx.request.headers[key];
		});

		let locals = {
			path: urlParts.path,
			pathname: urlParts.pathname,
			href: urlParts.href,
			host: urlParts.host,
			hostname: urlParts.hostname,
			params: this.result.params,
			splats: this.result.splats,
			port: urlParts.port,
			protocol: urlParts.protocol,
			search: urlParts.search,
			route: this.result.route,
			query: query,
			ip_address: headers['x-forwarded-for'] || ctx.req.connection.remoteAddress,
			headers: headers
		};
			
		let controller = new this.route.controller(
			this.route.pathContext,
			ctx,
			app,
			locals
		);
		
		this.app.extensions.emit("controller-create", controller);
		
		ctx.controller = controller;
		
		let method = ({
			'GET': ['index', 'get'],
			'PUT': ['put', 'update'],
			'POST': ['post', 'post'],
			'DELETE': ['del', 'del'],
			'OPTIONS': ['options', 'options']
		}[ctx.request.method] || ['index', 'get'])[(this.result.params.id != "") | 0];
			
		Log.debug("routing " + this.route.controller.name + ":" + method);
		
		yield controller.run(method);
	}
}

// default controller
class DefaultController extends Nodest.Controller {
	get() {
		this.ctx.throw(404);
	}
}

/**
* Delegates HTTP.ClientRequest to specified routes, which dispatch Controllers.
* see: https://www.npmjs.com/package/routes
* @class
*/
class Router {

	constructor(app) {
		this.app = app;
		this.routes = Routes();	
		
		// create a default match
		this.defaultMatch = new RouteMatch(app, { 
			fn: new Route(DefaultController, new Nodest.PathContext("default", __dirname)),
			route: "",
			params: {},
			splats: []
		});	
	}

	/**
	* Creates a route with a specified regex that dispatches a given Controller
	* @param {string} path The path to match for the route
	* @param {string|Nodest.Controller} controller The Controller to dispatch. Can be a Nodest.Controller derived class or a path to a file that exports a controller.
	* @param {Nodest.PathContext} pathContext Object used to resolve paths
	*/
	route(path, controller, pathContext) {
		var Controller = null;
		if (typeof controller == "string") {
			
			// figure out the controller path using the pathContext
			var controllerPath = pathContext.resolve(controller);
			Controller = require(controllerPath);
			
			// we also need to create a new PathContext relative
			// to the new controller's path
			pathContext = new Nodest.PathContext(pathContext.name, controllerPath);
		}
		else Controller = controller;
		
		var route = new Route(Controller, pathContext);
		
		this.routes.addRoute(path, route);
	}

	/**
	* Removes a controller route
	* @param {string} path The path to match for the route
	*/
	deroute(path) {
		this.routes.removeRoute(path);
	}

	/**
	* Finds the appropriate route given a pathname.
	* @param {string} pathname The request pathname
	* @return {RouteMatch} The route instance that matches the pathname
	*/
	match(pathname) {
		var m = this.routes.match(pathname);
		if (m)
			return new RouteMatch(this.app, m);
		return this.defaultMatch;
	}

};

module.exports = Router;
