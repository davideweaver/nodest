const Nodest = require("nodest");

module.exports = logging;

logging.info = function (message, plugin) {
	log(message, "info", plugin);
}

logging.warn = function (message, plugin) {
	log(message, "warn", plugin);
}

logging.error = function (message, plugin) {
	log(message, "error", plugin);
}

logging.debug = function (message, plugin) {
	log(message, "debug", plugin);
}

logging.scoped = function (scope) {

	scoped_logging.info = function (message) {
		log(message, "info", scope);
	}
	
	scoped_logging.warn = function (message) {
		log(message, "warn", scope);
	}
	
	scoped_logging.error = function (message) {
		log(message, "error", scope);
	}
	
	scoped_logging.debug = function (message) {
		log(message, "debug", scope);
	}
	
	function scoped_logging(message) {
		log(message, "info", scope);
	}
	
	return scoped_logging;
}

function logging(message, plugin) {
	log(message, "info", plugin);
}

/**
 * Logs a message to the console with a tag.
 * @param message  the message to log
 * @param tag      (optional) the tag to log with.
 */
function log(message, tag, plugin) {
	var util = require('util')
			, color = require('cli-color')
			, tags, currentTag;
	
    if (isObject(message))
        message = JSON.stringify(message);
    
	tag = tag || 'info';
	
	if (tag == "debug" && Nodest.settings.verbose == false)
		return;
	
	tags = {
		error: color.red.bold,
		warn: color.yellow,
		info: color.cyanBright,
		debug: color.green
	};
	
	currentTag = tags[tag] || function(str) { return str; };
	var logMsg = "";
	
	if (!plugin)
		plugin = " ";
	
	if (plugin)
		logMsg = "[" + plugin + "] " + currentTag("[" + tag + "] ") + message;
	else logMsg = currentTag("[" + tag + "] ") + message;
	
	util.log(logMsg.replace(/(\n|\r|\r\n)$/, ''));
}

function isObject(a) {
    return (!!a) && (a.constructor === Object);
};