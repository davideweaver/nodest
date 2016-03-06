"use strict"

const Path = require("path");
const Filesystem = require("fs");
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

		// we don't require a .js on our paths, maybe we need one
		if (!this.exists(path)) {
			path += ".js";
		}

		// if the path points to a file, remove the filename
		if (this.exists(path)) {
			if (this.isFile(path)) {
				path = Path.dirname(path);
			}
		}	

		// setup a log
		this.log = Log.scoped(name);

		Object.defineProperty(this, "name", {enumerable: true, value: name});
		Object.defineProperty(this, "path", {enumerable: true, value: path});
	}
	
	/**
	 * Tests the existence of a file or directory.
	 * @param {string} path The path to the file/directory to test.
	 * @return {bool} Whether or not the file/directory exists.
	*/
	exists(path) {
		try {
    	Filesystem.accessSync(path, Filesystem.F_OK);
    	return true;
		} catch (e) {
			return false;
		}
	}
	
	/**
	 * Tests if the path is a file.
	 * @param {string} path The path to test.
	 * @return {bool} Whether or not the path is a file.
	*/
	isFile(path) {
		return Filesystem.lstatSync(path).isFile()
	}
	
	/**
	 * Tests if the path is a directory.
	 * @param {string} path The path to test.
	 * @return {bool} Whether or not the path is a directory.
	*/
	isDirectory(path) {
		return Filesystem.lstatSync(path).isDirectory()
	}
	
	/**
	 * Resolves a path in relation to the current path. 
	 * @param {string} path The path to resolve.
	 * @return The resolved path.
	*/
	resolve(path) {
		return Path.join(this.path, path);
	}
}

module.exports = PathContext;