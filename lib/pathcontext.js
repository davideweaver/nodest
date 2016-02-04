"use strict"

const Path = require("path");
const Log = require("./log");

/**
* A new Controller instance is created by the Router when its associated route is hit, handles all business logic
* @class
*/
class PathContext {

	/**
	* @param {Nodal.Application} app Parent application object
	*/
	constructor(name, path) {

		// make sure the path doesn't contain a file
		if (path.indexOf(".") >= 0)
			path = Path.dirname(path);

		// setup a log
		this.log = Log.scoped(name);

		Object.defineProperty(this, "name", {enumerable: true, value: name});
		Object.defineProperty(this, "path", {enumerable: true, value: path});
	}
	
	resolve(path) {
		return Path.join(this.path, path);
	}
}

module.exports = PathContext;