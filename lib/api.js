"use strict";

class APIConstructor {

	format(obj, arrInterface, options, useResource) {

		if (obj instanceof Error) {
			return this.error(obj.message, obj.details);
		}

		return this.response(obj, arrInterface, options);
	}

	meta(total, count, offset, error, summary, resource) {

		if (error) {
			total = 0;
			count = 0;
			offset = 0;
			resource = null;
		}

		let meta = {
			total: total,
			count: count,
			offset: offset,
			error: error
		};

		summary && (meta.summary = summary);
		resource && (meta.resource = resource);

		return meta;

	}
	
	error(status, message, details) {

		return { code: status, message: message, details: details };

	}
}

module.exports = new APIConstructor();

