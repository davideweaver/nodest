"use strict";

const Nodest = require("nodest");
const Statuses = require("statuses");

class ApiController extends Nodest.Controller {

	/**
	* Using API formatting, send an http.ServerResponse indicating there was an error
	* @param {string|Object} msg Error message to send
	* @param {int} status Status of the error to send
	* @param {Object} stack Stack trace of error
	* @return {boolean}
	*/
	error(msg, status, stack) {
		status = status || 500;
		var err = Statuses[status];
		this.ctx.status = status;
		
		this.log.error(msg);
		
		this.render(Nodest.API.error(status, err, msg));
		return true;
	}

	/**
	* Using API formatting to respond with model / object data and a particular status.
	* @param {Object|Array} data Object to be formatted for API response
	* @param {optional Number} status Callback function to call if needed.
	* @param {optional Function} next Callback function to call if needed.
	* @return {boolean}
	*/
	respondWithStatus(data, status, next) {
		if (status)
			this.ctx.status = status;

		return this.render(data, next);
	}

	/**
	* Using API formatting to respond with success, but no model.
	* @param {optional Function} next Callback function to call if needed.
	* @return {boolean}
	*/
	respondWithNoContent(next) {
		this.ctx.status = 204;
		return this.render({}, next);
	}
}

module.exports = ApiController;
