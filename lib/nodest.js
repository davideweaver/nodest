/* global process */

const Merge = require("merge");
const Path = require("path");

module.exports = (function() {

  "use strict";
	
	let Nodest = {
		API: null,
		ApiController: null,
    Application: null,
    Bootstrapper: null,
    Controller: null,
    Extension: null,
    Log: null,
		Middleware: null,
    PathContext: null,
    Router: null,
		TemplateManager: null,
		Template: null,
		WebService: null,
    config: null,
		mocha: {
      Test: null,
      TestRunner: null
    },
		settings: {}
  };
	
	/* Lazy Loading */

  let LazyNodest = {
    mocha: {},
		applySettings: function (settings) {
			this.settings = Merge.recursive(this.settings, settings);
		},
		settings: {
			verbose: false,
			errors: {
				expose: false
			},
			service: {
				templates: {
					cache: true
				}
			}
		}
  };

  Object.defineProperties(LazyNodest, {
    API: {
      get: function() {
        return Nodest.API || (Nodest.API = require('./api.js'));
      },
      enumerable: true
    },
    ApiController: {
      get: function() {
        return Nodest.ApiController || (Nodest.ApiController = require('./apicontroller.js'));
      },
      enumerable: true
    },
    Application: {
      get: function() {
        return Nodest.Application || (Nodest.Application = require('./application.js'));
      },
      enumerable: true
    },
		Bootstrapper: {
      get: function() {
        return Nodest.Bootstrapper || (Nodest.Bootstrapper = require('./bootstrapper.js'));
      },
      enumerable: true
    },
		config: {
      get: function() {
        return Nodest.config || (Nodest.config = require('config'));
      },
      enumerable: true
    },
		Controller: {
      get: function() {
        return Nodest.Controller || (Nodest.Controller = require('./controller.js'));
      },
      enumerable: true
    },
		Extension: {
      get: function() {
        return Nodest.Extension || (Nodest.Extension = require('./extension.js'));
      },
      enumerable: true
    },
		ExtensionManager: {
      get: function() {
        return Nodest.ExtensionManager || (Nodest.ExtensionManager = require('./extensionmanager.js'));
      },
      enumerable: true
    },
		Log: {
      get: function() {
        return Nodest.Log || (Nodest.Log = require('./log.js'));
      },
      enumerable: true
    },
		Middleware: {
      get: function() {
        return Nodest.Middleware || (Nodest.Middleware = require('./middleware.js'));
      },
      enumerable: true
    },
		PathContext: {
      get: function() {
        return Nodest.Context || (Nodest.Context = require('./pathcontext.js'));
      },
      enumerable: true
    },
    Router: {
      get: function() {
        return Nodest.Router || (Nodest.Router = require('./router.js'));
      },
      enumerable: true
    },
		Template: {
      get: function() {
        return Nodest.Template || (Nodest.Template = require('./template.js'));
      },
      enumerable: true
    },
		TemplateManager: {
      get: function() {
        return Nodest.TemplateManager || (Nodest.TemplateManager = require('./templatemanager.js'));
      },
      enumerable: true
    },
		WebService: {
      get: function() {
        return Nodest.WebService || (Nodest.WebService = require('./webservice.js'));
      },
      enumerable: true
    },
	});
	
	return LazyNodest;

})();