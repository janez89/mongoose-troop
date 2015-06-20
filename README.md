
# Mongoose Utilities 

[![Build Status](https://travis-ci.org/janez89/mongoose-utilities.png?branch=master)](https://travis-ci.org/janez89/mongoose-utilities)
[![NPM version](https://badge.fury.io/js/mongoose-utilities.png)](http://badge.fury.io/js/mongoose-utilities)

The mongoose utilities is a fork a [Mongoose Troop](https://github.com/tblobaum/mongoose-troop)

A collection of handy plugins for mongoose

## Overview
* [Usage](#usage)
* [Plugins](#plugins)
  * [acl](#acl) (simple access control list)
  * [basicAuth](#basicauth) (simple authentication and registration)
  * [timestamp](#timestamp) (automatic created and modified timestamps)
  * [slugify](#slugify) (url-friendly copies of string properties)
  * [keywords](#keywords) (search-friendly array of stemmed words from string properties)
  * [pubsub](#publish) (message passing)
  * [pagination](#pagination) (query pagination)
  * [rest](#rest) (http or rpc controller)
  * [merge](#merge) (merge a document into another)
  * [removeDefaults](#removedefaults) (remove default values from a document)
  * [getdbrefs](#getdbrefs) (find all document DBRefs)
* [Changelog](#changelog)
* [Authors and contributors](#authors-and-contributors)
* [License](#license)

***

## Usage

```javascript
var mongoose = require('mongoose')
  , mUtilities = require('mongoose-utilities')
  , Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/your-database');

var FooSchema = new Schema({
  name: {type: String}
});


FooSchema.plugin(mUtilities.PluginName, options);

var Foo= mongoose.model('foo', FooSchema); // Category
```

***

## Plugins

Important! 
A list of plugins that have changed since the troop and have new interface.

* pagination changed
* obfuscate removed

[Go to contents](#overview)

***

## acl 
Simple access control list

### Methods

#### instance.addAccess(key)

Add `key` access to a Model instance

#### instance.removeAccess(key)

Remove `key` access to a Model instance

#### instance.access(key [, callback])

Return or callback a boolean

[Go to contents](#overview)

***

## basicAuth 

Simple authentication plugin

### Options

* `loginPath` schema path for username/login (optional, default `username`)
* `hashPath` schema path to hashed password (optional, default `hash`)
* `workFactor` bcrypt work factor (optional, default `10`)

### Methods

#### instance.authenticate(password, callback)

Authenticate a mongoose document

#### instance.setPassword(password, callback)

Set the password for a mongoose document

#### model.authenticate(username, password, callback)

Authenticate a user on the model level

#### model.register(attributes, callback)

Create a new user with given attributes

### Example

```javascript
var mongoose = require('mongoose')
  , mUtilities = require('mongoose-utilities')
  , db = mongoose.connect()
  , UserSchema = new mongoose.Schema()

UserSchema.plugin(mUtilities.basicAuth)

var User = mongoose.model('user', UserSchema)

User.register({
  username: 'foo'
, password: 'bar'
}, function() {
  // ...
})

User.authenticate('foo', 'bar', function(err, doc) {
  // ...
})

User.findOne({ username: 'foo'}, function(err, doc) {
  if (err || !doc) return
  doc.setPassword('foobar', function(err) {
    if (err) return
    doc.authenticate('foobar', function() {
      // ...
    })
  })
})
````

[Go to contents](#overview)

***

## timestamp 

Adds a `created` and `modified` property to the schema, updating the timestamps as expected.

### Options

* `createdPath` schema path for created timestamp (optional, default `created`)
* `modifiedPath` schema path for modified timestamp (optional, default `modified`)
* `useVirtual` use a virtual path for created timestamp based on ObjectId (optional, default `true`)

### Example

```javascript
var mongoose = require('mongoose')
  , mUtilities = require('mongoose-utilities')
  , FooSchema = new mongoose.Schema()

FooSchema.plugin(mUtilities.timestamp)
````

### Note

Using the virtual `created` timestamp you will lose the ability to run queries against it, 
as well as a loss in precision, as it will return a timestamp in seconds.

[Go to contents](#overview)

***

## slugify 

Turn a string based field into a url friendly slug

Converts `this is a title` to `this-is-a-title`

### Options

* `target` schema path for slug destination (optional, default `slug`)
* `source` schema path for slug content (optional, default `title`)
* `maxLength` maximum slug length (optional, default `50`)
* `spaceChar` space replacement character (optional, default `-`)
* `invalidChar` invalid character replacement (optional, default ``)
* `override` override slug field on source path change (optional, default `false`)

### Methods

#### instance.slugify(string)

#### model.slugify(string)

### Example

```javascript
var mongoose = require('mongoose')
  , mUtilities = require('mongoose-utilities')
  , FooSchema = new mongoose.Schema()

FooSchema.plugin(mUtilities.slugify)

var instance = new FooSchema({title: 'well hello there!'})

instance.save(function(err, doc) {
  console.log(doc.slug) // `well-hello-there`
})
````

### Note

This plugin does not currently support nested paths

[Go to contents](#overview)

***

## keywords 

Keyword extraction/creation plugin, can be used as a simple substitute of a full
search indexing package.

Turns `fooed bars` into `['foo', 'bar']`

### Options

* `target` schema path for keyword destination (optional, default `keywords`)
* `source` schema path for extracting keywords, can be an array to specify multiple paths
* `minLength` minimum string length to be used as a keyword (optional, default `2`)
* `invalidChar` replacement char for invalid chars (optional, default ``)
* `naturalize` specifies whether to use a porter stemmer for keywords (optional, default `false`)

### Methods

#### instance.extractKeywords(str)

#### model.extractKeywords(str)

Manually calculate a keyword array with a given string

### Example

```javascript
var mongoose = require('mongoose')
  , mUtilities = require('mongoose-utilities')
  , db = mongoose.connect()

var FooSchema = new mongoose.Schema({
  text: String
})

FooSchema.plugin(mUtilities.keywords, {
  source: 'text'
})

var fooModel = mongoose.model('foo', FooSchema)
  , instance = new FooSchema({ text: 'i am the batman' })

console.log(instance.keywords) // `['am', 'the', 'batman']`

fooModel.find({ 
  keywords: { $in: fooModel.extractKeywords('batman') }
}, function(docs) {
  // ...
})
````

### Note

This plugin does not currently support nested paths

[Go to contents](#overview)

***

## publish 

Plugin to publish/subscribe from a model or instance level, also enabling a model 
to automatically publish changes on `init`, `save`, and `remove` methods.  Both models 
and instances can be published/subscribed to.

### Options

* `auto` attach middleware based on the `hook` for `init`, `save`, and `remove` methods (optional, default `false`)
* `hook` middleware method to attach auto middleware to (optional, default `post`)
* `seperator` redis channel seperator (optional, default `:`)
* `prefix` redis channel prefix, can be a string or function (optional, default ``)
* `channel` channel for schema to publish/subscribe to, can be a string or function (optional, default `schema.constructor.modelName`)
* `publish` redis instance to be used for publishing
* `subscribe` redis instance to be used for subscribing

### Methods

#### instance.publish(doc, options, callback)

#### instance.subscribe(callback)

#### instance.unsubscribe(callback)

#### instance.getChannel()

#### instance.on(event, callback)

#### model.subscribe(callback)

#### model.unsubscribe(callback)

#### model.getChannel()

#### model.on(event, callback)

### Example

```javascript
var redis = require('redis')
  , publish = redis.createClient()
  , subscribe = redis.createClient()
  , mongoose = require('mongoose')
  , mUtilities = require('mongoose-utilities')
  , db = mongoose.connect()

var FooSchema = new mongoose.Schema({
  name: String
})

FooSchema.plugin(mUtilities.publish, {
  publish: redis
, subscribe: subscribe
})

var FooModel = mongoose.model('foo', FooSchema)

FooModel.subscribe() // channel: 'foos'

FooModel.findOne({name: 'bar'}, function(err, instance) {
  // ...
})
````

Once you have a mongoose instance you can now publish it, by default, a model or 
instance will publish to it's own channel

```javascript
instance.publish(null, {
  method: 'save'
}, function(err, count) {
  // publishes to 'foos:4d6e5acebcd1b3fac9000007'
})
````

You can also publish other documents to other models or instances

```javascript
FooModel.publish(instance, function(err, count) {
  // publishes to 'foos'
})
````

or, if you have enabled `hooks`

```javascript
instance.save()
````

You can also subscribe on the instance level

```javascript
instance.subscribe() // channel: 'foos:4d6e5acebcd1b3fac9000007'
````

[Go to contents](#overview)

***

## pagination 

Simple query pagination routines.
Important! The API changed! - not compatible with the mongoose-troop

### Options

* `defaultQuery` Query to use if not specified (optional, default `{}`)
* `defaultLimit` Results per page to use if not specified (optional, default `10`)
* `defaultFields` Fields to use if not specified (optional, default `{}`)
* `defaultSort` Sort to use if not specified (optional, default `{}`)
* `defaultPopulate` Population to use if not specified (optional, default `{}`)
* `remember` Remember the last options used for `query`, `limit`, `sort`, `population` and `fields` (optional, default `false`)

### Methods

#### model.paginate(options, callback)

#### model.firstPage(options, callback)

#### model.lastPage(options, callback)

### Example

Assume that we have a collection with 55 records in it for the following example,
where the `count` field is incremented by 1 for each record, starting at 1.

```javascript
var mongoose = require('mongoose')
  , mUtilities = require('mongoose-utilities')
  , db = mongoose.connect()

var FooSchema = new mongoose.Schema({
  name: String
, count: Number
, category: { type: mongoose.Schema.Types.ObjectId, ref: 'cat' }
})

FooSchema.plugin(mUtilities.pagination)

// OR with default settings
FooSchema.plugin(mUtilities.pagination, {
  defaultPopulate: 'category', 
  defaultSort: { name: 1 }
})

var FooModel = mongoose.model('foo', FooSchema)

var CatSchema = new mongoose.Schema({
  name: String
})

var CatModel = mongoose.model('cat', CatSchema)

FooModel.paginate({ page: 1 }, function (err, provider) {

  // provider.docs.length = 10
  // provider.count = 55
  // provider.pages = 6
  // provider.page = 1
  // provider.limit = 10;
})
````

Which, since using the default options, can also be written as:

```javascript
FooModel.firstPage(function (err, provider) {
  // ...
})
````

Or, if you wanted the last page:

```javascript
FooModel.lastPage(function (err, provider) {
  // provider.docs.length = 5
  // provider.page = 6
})
````

A more verbose pagination call

```javascript
FooModel.paginate({
  page: 2
, query: { count: { $gt: 25 } }
, limit: 25
, fields: { field1: 1, field2: 1 }
, sort: { field1: 1}
, populate: 'field2'
}, function(err, provider) {
  
  // provider.docs.length = 5
  // provider.count = 30
  // provider.pages = 2
  // provider.page = 2

})
````

### Note

If using the `remember` option, the plugin will cache all of the options you give it 
each time you pass them in (except for the page), this can be handy if the params are 
going to be the same each time, if they are different you should not use this option.

Also, when on the last page, the plugin will return the trailing number of documents, 
in the example above the `lastPage` method returned 5 documents, it will never return 
a full set specified by the `limit` when this is the case.

##### Mongoose documentations 
* [Mongoose Sort](http://mongoosejs.com/docs/api.html#query_Query-sort) - sorting records
* [Population](http://mongoosejs.com/docs/populate.html) - There are no joins in MongoDB but sometimes we still want references to documents in other collections.

[Go to contents](#overview)

***

## rest 

### Options

* `pagination` options to send to the pagination plugin above (optional, see plugin defaults above)

Create a REST-ful controller for your models for use with flatiron/director, express, dnode or socket.io

[Go to contents](#overview)

***

## merge 

Merge JSON into your object more easily.

```javascript
instance.merge({title:'A new title', description:'A new description'}).save()
````

[Go to contents](#overview)

***

## getdbrefs 

Get the dbrefs from a schema

```javascript
instance.getdbrefs(function (refs) {
  // ...
})
```

### Note

This plugin does not currently support nested paths

[Go to contents](#overview)

***

## removeDefaults 

Remove all of the default values from your model instance.

`instance.removeDefaults().save()`


### Note

This plugin does not currently support nested paths

[Go to contents](#overview)

***

### Changelog

### Jun 20, 2015 - version: 0.1.1
* bumped bcrypt version

### Aug 12, 2013 - version: 0.1.0
* [Mongoose Troop](https://github.com/tblobaum/mongoose-troop) forked
* removed directory dependency
* removed obfuscate plugin
* Changed pagination API
* Changed rest API
* updated tests
* updated README.md

[Go to contents](#overview)

***

### Authors and contributors

* Thomas Blobaum: [https://github.com/tblobaum](https://github.com/tblobaum)
* Janos Meszaros: [https://github.com/janez89](https://github.com/janez89)
* Profulla Sadangi: [https://github.com/butu5](https://github.com/butu5)
* Beau Sorensen: [https://github.com/sorensen](https://github.com/sorensen)

This project is a work in progress and subject to API changes, please feel free to contribute

[Go to contents](#overview)

***

## License

(The MIT License)

Copyright (c) 2011-2012 Tom Blobaum <tblobaum@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[Go to contents](#overview)