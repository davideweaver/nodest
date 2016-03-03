# nodest

Minimalist framework on top of [koa](https://github.com/koajs/koa), inspired by [nodal](https://github.com/keithwhor/nodal).

* Simple application spinup
* Express-style routing to controllers.
* Controllers for API and templated HTML.
* Controller support for callbacks and generators.
* JSON configuration.
* Logging.
* Multiple HTTP services.
* Multiple routers.

## Status

Currently alpha, functionally complete, tests being written.

## Installation

Install using [npm](https://www.npmjs.org/):

```sh
$ npm install nodest
```


## Basic Usage

The following demonstrates a simple, HelloWorld Nodest app. 

```javascript
const Nodest = require("nodest");

class Controller extends Nodest.Controller {
	index() {
		this.ctx.body = "HelloWorld";
	}
}

class App extends Nodest.Application {
	init() {
		this.route("/", Controller);
	}
}

new Nodest.Bootstrapper(App).start((app) => { app.listen(3000) });
```

Using ES6 class syntax, a class derived from **Nodest.Application** is defined. It's **init()** method is overriden to define a route for **"/"** to a class derived from **Nodest.Controller**.
The controller override method **index** which will be called automatically when the route is matched on the request.
The **index()** method uses Koa's context to set the body of the response.
The **Nodest.Bootstrapper** is used to start the app on port 3000.



## Nodest and Koa

One of the goals for Nodest was to provide a very minimal layer around Koa. 
Nodest provides Koa access points so that you can use the Koa classes as you normally would but in a slightly more organized (in our opinion) way.
Nodest accomplishes that by defining small wrapper classes around the Koa classes.

The Nodest.Application class has a **.koa** property that represents the [Koa.Application](https://github.com/koajs/koa/blob/master/docs/api/index.md) class. 
The Nodest.Controller classes have a **.ctx** property that represents the [Koa.Context](https://github.com/koajs/koa/blob/master/docs/api/context.md) class.
Using these properties you can configure your app and respond to HTTP requests like you would normally do in Koa.

As seen in the basic example above, we use the **.ctx** property of our controller to respond to the HTTP request with "HelloWorld".



## Reference Classes in Separate Files

The basic usage example above references the App and Controller classes directly. You could also import the classes from another file.
Nodest also supports a shortcut for referencing those classes. You can reference the App or Controllers exported from another file using a path instead of a class reference.
This lets you organize your project by breaking up classes into separate files, yet reduces the amount of code required to do so.
For example, create a new file...

**controller.js**

```javascript
const Nodest = require("nodest");

class Controller extends Nodest.Controller {
	index() {
		this.ctx.body = "HelloWorld";
	}
}

module.exports = Controller;
```

and reference like...

```javascript
const Controller = require("./controller.js");
...
this.route("/", Controller)
```
or simply...
```javascript
this.route("/", "./controller.js")
```


## Controllers

Nodest.Controllers are your primary way of interacting with HTTP requests. 
Just create a route in you application that points to a controller. When a request comes in with a path matching your route, your controller will be created and called.

As shown in the basic usage example, you can override the **index()** method of your controller and interact with the Koa.Context class.
Nodest also provides some built-in functionality that may make your job a little easier.

```javascript
const Nodest = require("nodest");

class Controller extends Nodest.Controller {
	index() {
		this.ctx.body = "HelloWorld";
	}
}

module.exports = Controller;
```

### Controller Types

Nodest provides two controller base classes. 
The main controller class that you derive your controllers from is Nodest.Controller. 
Use Nodest.Controller as a general way of returning HTML to the client.

There is also the Nodest.ApiController class that should be used for implementing API-style responses, typically using JSON to respond to a non-browser client.
This controller will handle things slightly different if it knows the client is not a browser. 
For example, errors that are thrown will be formatted as a JSON message instead of HTML content.

### Response Helpers

As mentioned before, you are free to use the **.ctx** property to respond to the HTTP request.
Nodest also has some methods to respond to requests.

**HTML Rendering with Templates**

Nodest makes it pretty easy to render HTML using HTML templates. 
This example won't go into the details of how templates work (see HTML Templating), but it will show a useful example.

The **.render()** method sends back HTML to the client, similar to <code>this.ctx.body = "HelloWorld";</code>. 
This example uses the **.template()** method to load and generate HTML from \*.html files. 
Shown here is a hierarchy of templates, referenced in the template as **.child()**. 

```javascript
class ExampleController extends Nodest.Controller {
  index() {
    this.render(
      this.template("layout.html", "index.html")
        .generate({
          title: "My Page",
          body: "This is my first post"
        })
    );
  }
}
```

**layout.html**

```html
<!DOCTYPE html>
<html>
  <head>
    <title>{{=data.title}}</title>
  </head>
  <body>
    <div class="container">
      {{=this.child()}}
    </div>
  </body>
</html>
```

**index.html**

```html
<div>
  <h1>{{=data.title}}</h1>
  <p>{{=data.body}}</p>
</div>
```

**JSON Responses**

If your controller is handling an API-style request you'll want to send back JSON.
Use the **respond()** method for doing that and it will serialize correctly with the appropriate Content-Type.
Notice we are using the Nodest.ApiControllerclass.

```javascript
class ExampleController extends Nodest.ApiController {
  get() {
    this.respond({
      id: 102,
      name: "Joe Smith",
      email: "joe@acme.com"	
    });
  }
}
```


### Mapped Controller Methods

Nodest will attempt to map the current HTTP Method to methods of your controller class. 
For example, when a request is received with the GET method, the **index()** method will be called on your controller.
If a DELETE method is received the **del()** method will be called.

**NOTE** In addition to Method mapping, the route will be inspected for the **:id** token. 
If the **:id** token exists in your route and resolved in the current request, the method called on your controller will be different.


| HTTP METHOD | :id Resolved | Controller Method |
| --- | --- | --- |
| GET | No | Controller.index() |
| GET | Yes | Controller.get() |
| POST | No | Controller.post() |
| POST | Yes | Controller.post() |
| PUT | No | Controller.put() |
| PUT | Yes | Controller.update() |
| DELETE | No | Controller.del() |
| DELETE | Yes | Controller.del() |

If the **:id** token is resolved then the value for that id can be found in the **this.vars.params.id** property of the controller.
Here is a complete REST-style example using mapped methods.

**NOTE** This example uses ES6 generators toallow us to yiled on our async Contacts API.

````javascript
const Contacts = require("./lib/contacts.es6");

class ContactsController extends Nodest.ApiController {
	
  * index() {
    this.respond(yield Contacts.all());
  }
	
  * get() {
    this.respond(yield Contacts.find(this.vars.params.id));
  }
	
  * post() {
    var contact = Contacts.fromBody(this.ctx);
    this.respond(yield Contacts.add(contact));
  }
	
  * update() {
    var contact = Contacts.fromBody(this.ctx);
    this.respond(yield Contacts.update(this.vars.params.id, contact));
  }
	
  * del() {
    yield Contacts.del(this.vars.params.id));
    this.ctx.status(204);
  }
}
````

### Async Controller Methods

As you can see in the previous example, we use ES6 Generators to handle responses using our async Contacts API.
By adding the ***** in front of our built-in methods, Nodest knows how to call them.
Nodest also supports traditional callback-style APIs. 
Just provide a **next** argument in the built-in methods like this example.

```javascript
const Contacts = require("./lib/contacts");

class ContactsController extends Nodest.ApiController {
  index(next) {
    this.respond(Contacts.all(next));
  }
}
``` 



## Routes

Routing in Nodest is handled by the [routes](https://www.npmjs.com/package/routes) module.
It's pretty similar to routes in Express.

```javascript
this.route("/articles/:title?", ArticleController);
this.route("/admin/*?", auth);
this.route("/:controller/:action/:id.:format?", GenericController);
```

Besides routing the request to the correct controller, these routes will create two collections under the **Controller.vars** property.
One collection will be **.vars.params** which will contain each token and it's corresponding value.
The other collection will be **.vars.splats** which is an array of values matching the wildcard portion of the route.

Using the routes defined above, <code>/posts/show/1.json</code> would result in...

```javascript
{
  params: {
    controller: 'posts',
    action: 'show',
    id: '1',
    format: 'json'
  },
  splats: []
}
``` 

And <code>/admin/reports</code> would result in...

```javascript
{
  params: {},
  splats: [ "reports" ]
}
```

See https://www.npmjs.com/package/routes for more information on routing.




## Middleware

Nodest takes the same approach for middleware as it does for the controllers. 
You can use our light-weight wrappers for setting up your middleware, or you can do it directly with Koa.

### Write Your Own Middleware

To write your own custom logic as middleware you simply have to write a class derived from the Nodest.Middleware class.
Your class can handle the HTTP request as it comes in and/or handle the HTTP response on it's way out. 
Below is an example of a class doing both.

```javascript
class TimerMiddleware extends Nodest.Middleware {
  in() {
    this.start = new Date().getTime();	
  }
  out() {
    var ms = new Date().getTime() - this.start;
    this.ctx.set('X-Response-Time', ms + 'ms');
  }	
}
```

This will start a timer when the request is received and record the duration in a custom header on the way out.
You can implement one or both of the base methods.

Register your middleware class in the init() routine of you application with **Application.use()**.

```javascript
class App extends Nodest.Application {  
  init() {
    this.use("./timer.middleware.js");
  }
}
```

### Use Koa Middleware

Nodest makes it pretty simple to load pre-built Koa middleware from npm. 
Derive your middleware class as you did previously.
This time implement the **use()** method instead of in() and out(). 
Have that method return an array of your require'd modules.

```javascript
const KoaBodyParser = require("koa-body-parser");
const KoaCors = require("kcors");

class TimerMiddleware extends Nodest.Middleware {
  use() {
    return [ KoaBodyParser(), KoaCors() ];
  }
}
```

Register this the same way you registered your custom middleware class.

**NOTE** You can also use the **.koa** property of your application class to register Koa middleware.

```javascript
this.koa.use(KoaStaticFolder("./static"));
```


### Example: Serve Static Content with Koa Middleware

It's pretty common to want to serve static files like images or stylesheets from your app. 
That's can be done pretty easily using **koa-static-folder** middleware. 
Use **npm** to install the module first. Then create your middleware class...

**static.middleware.js**
```javascript
const Nodest = require("nodest");
const KoaStaticFolder = require("koa-static-folder");

class TimerMiddleware extends Nodest.Middleware {
  use() {
    return [ KoaStaticFolder("./static") ];
  }
}

module.exports = TimerMiddleware;
```

**app.js**
```javascript
const Nodest = require("nodest");

class App extends Nodest.Application {  
  init() {
    this.use("./static.middleware.js");
  }
}
```

That will allow your HTML files to reference static content under the **/static** folder of your root.
For example...

```html
<a href="/"><img src="/static/images/logo.png" /></a>
```




## Error Handling

TDB




## HTML Templates

TBD




## Configuration

Nodest supports configuration using the [config](https://www.npmjs.com/package/config) module.
Just create a **config** directory at the root of your application and create a file in there.
This file contains JSON that can be easily referenced from within your app.

**config/default.json**

```javascript
{
  "server": {
    "port": 3000,
    "static": "./static",
    "verbose": true
  }
}
```

From within your app you have access to that configuration using the **Nodest** namespace.

```javascript
const Nodest = require("nodest");
...
app.listen(Nodest.config.server.port);
```

You can also override your config for your production environment.

**config/production.json**

```javascript
{
  "server": {
    "port": 80,
    "verbose": false
  }
}
```

Use the **NODE_ENV** environment variable to control which configuration gets loaded.

```sh
$ export NODE_ENV=production
$ node index.js
```
Now when you access those variables from within your app, "port" and "verbose" have a new value while remains "static" unchanged.

### Logging

Nodest provides a simple logging mechanism. The App and Controller base classes each contain a **.log** property that you can use.

```javascript
app.log("simple logging");
```

This will produce the following line on the console.

```sh
3 Feb 08:00:04 - [app] [info] simple logging
```

You'll notice the message is logged with the **time**, **scope** (app) and **channel** (info).
You have finer control of your log messages. The call above logs your message to the **info** channel. 
You can specify the channel you want to log to by calling a different function.

```javascript
app.log.info("this is information");
app.log.debug("for debug messages"); // controlled by Nodest.settings.verbose
app.log.warn("you're getting too close");
app.log.error("something bad happened");
```

You're also able to control the scope your messages will use by **scoping** the log function. 
There are a couple ways you'll want to use scoping. The long way is to do it inline. 

```javascript
Nodest.Log.scoped("mycode").warn("this is a warning");
```

As a shortcut, define your scoped log as a variable.

```javascript
var log = Nodest.Log.scoped("mycode");
log("this is info");
log.warn("this is a warning");
```

This will produce...

```sh
3 Feb 08:00:04 - [mycode] [info] this is info
3 Feb 08:00:04 - [mycode] [warn] this is a warning
```

### Settings

You can change the default behavior of certain Nodest features by applying different settings. 
This is typically done before bootstrapping your application. Here is the current list of settings.

```javascript
{
  verbose: false, // show debug logging
  errors: {
    expose: false // show detailed errors
  },
  service: {
    templates: {
      cache: true // cache HTML templates
    }
  }
}
```

To override the defaults, prior to bootstrapping the app...

```javascript
Nodest.applySettings({
  verbose: true
});
...
new Nodest.Bootstrapper(App).start((app) => { app.listen(3000) });
```





## Contributing

Please submit all issues and pull requests to the [davideweaver/nodest](https://github.com/davideweaver/nodest) repository!

## Tests

Run tests using `npm test`. (not available yet)

## Support

If you have any problem or suggestion please open an issue [here](https://github.com/davideweaver/nodest/issues).






