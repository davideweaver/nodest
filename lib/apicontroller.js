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
		
		//if (typeof msg === 'object') {
		//	msg = JSON.stringify(msg);	
		//}
		
		this.log.error(msg);
		
		this.render(Nodest.API.error(status, err, msg));
		return true;
	}

}

module.exports = ApiController;
