"use strict"

const Nodest = require("nodest");

/**
* A new Controller instance is created by the Router when its associated route is hit, handles all business logic
* @class
*/
class Middleware {

	/**
	* @param {Nodal.Application} app Parent application object
	*/
	constructor(app) {

		// setup a log
		this.log = Nodest.Log.scoped("middleware");

		Object.defineProperty(this, "app", {enumerable: true, value: app});
	}
	
	use() {
		return null;
	}
	
	exec() {
		let u = this.use();
		if (u != null)
			return u;
		
		var base = this;
		return function *(next) {
			base.ctx = this;
			base.in();
			yield next;
			base.out();
		}
	}
	
	in() {
	}
	
	out() {
	}
}

module.exports = Middleware;