"use strict";

const Koa = require("koa");

class WebService {
	create() {
		var svc =  Koa();
		
		// override context if needed
		//svc.context.throw = function () {
		//	var x = arguments;
		//}
		
		return svc;
	}
}

module.exports = WebService;