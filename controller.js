const run = require('run');
const express = require('express');

function addRoute(method, url, handlers) {
  if ( !handlers | handlers.length === 0 ) {
    return this._router[method](`${this.prefix}${url}`);
  }

  let lastHandler = handlers.pop();
  if (lastHandler.constructor.name === 'GeneratorFunction') {
    const lastHandlerGenerator = lastHandler.bind({}); //cloning
    lastHandler = function handler() {
      run( lastHandlerGenerator.bind( null, ...arguments ) ).catch(e => {
        arguments[arguments.length - 1](e);
      });
    }
  } else if (lastHandler.constructor.name === 'AsyncFunction') {
    const lastHandlerFn = lastHandler.bind({});
    lastHandler = async function handler() {
      try {
        await lastHandlerFn.call( null, ...arguments );
      } catch (e) {
        arguments[arguments.length - 1](e);
      }
    }
  }
  this._router[method](`${this.prefix}${url}`, ...this.filters.concat( handlers ), lastHandler);
}

module.exports = class Controller {

  constructor(routePrefix) {
    this._router = express.Router({ strict: true });
    this.prefix = routePrefix ? routePrefix.replace(/\/$/, '') : '';
    this.filters = [];
  }

  restrict(filter) {
    this.filters.push(filter);
  }

  get(url) { addRoute.call(this, 'get', url, Array.from(arguments).slice(1) ); }
  post(url) { addRoute.call(this, 'post', url, Array.from(arguments).slice(1) ); }
  put(url) { addRoute.call(this, 'put', url, Array.from(arguments).slice(1) ); }
  delete(url) { addRoute.call(this, 'delete', url, Array.from(arguments).slice(1) ); }

  get routes() {
    return this._router;
  }
}
