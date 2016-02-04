"use strict";

const Nodest = require("nodest");
const Statuses = require("statuses");

class ApiController extends Nodest.Controller {

	/**
	* Using API formatting, send an http.ServerResponse indicating there was an Internal Server Error (500)
	* @param {string|Object} msg Error message to send
	* @param {Object} details Any additional details for the error (must be serializable)
	* @return {boolean}
	*/
	error(msg, status, stack) {
		status = status || 500;
		var err = Statuses[status];
		this.status(status);
		
		//if (typeof msg === 'object') {
		//	msg = JSON.stringify(msg);	
		//}
		
		this.log.error(msg);
		
		this.render(Nodest.API.error(status, err, msg));
		return true;
	}

}

module.exports = ApiController;