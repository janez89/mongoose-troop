
// Dependencies
var util = require('util')
  , assert = require('assert')
  , mongoose = require('mongoose')
  , pagination = require('../lib/pagination')
  , common = require('./support/common')
  , db = common.db
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId

idOfLastFooDoc = null;
// Run tests
describe('Pagination', function () {
  describe('#default()', function () {
    var FooSchema = new Schema({ count: Number })
    FooSchema.plugin(pagination)
    var FooModel = db.model('paginateFoo', FooSchema)
    
    before(function () {
      FooModel.remove(function (err) {
        assert.strictEqual(err, null)
      })
    })

    it('should populate the db', function (done) {
      for (var x = 1; x <= 55; x++) {
        var instance = new FooModel({ count: x })
        instance.save(function(err, doc) {
          assert.strictEqual(err, null)
          if (doc.count == 55) {
            idOfLastFooDoc = doc._id; 
            done()
          }
        })
      }
    })
    
    it('should have custom properties', function (done) {
      assert.strictEqual(typeof FooSchema.statics.paginate, 'function')
      assert.strictEqual(typeof FooSchema.statics.firstPage, 'function')
      assert.strictEqual(typeof FooSchema.statics.lastPage, 'function')
      done()
    })

    it('should paginate', function (done) {
      FooModel.paginate({
        page: 1
      , limit: 10
      }, function (err, provider) {
        assert.strictEqual(err, null)
        assert.strictEqual(provider.count, 55)
        assert.strictEqual(provider.pages, 6)
        assert.strictEqual(provider.page, 1)
        assert.strictEqual(provider.docs.length, 10)
        done()
      })
    })

    it('should paginate', function (done) {
      FooModel.paginate({
        page: 1
      , limit: 25
      }, function (err, provider) {
        assert.strictEqual(err, null)
        assert.strictEqual(provider.count, 55)
        assert.strictEqual(provider.pages, 3)
        assert.strictEqual(provider.page, 1)
        assert.strictEqual(provider.docs.length, 25)
        done()
      })
    })

    it('should paginate with null query', function (done) {
      FooModel.paginate({
        query: null
      , page: 1
      , limit: 25
      }, function (err, provider) {
        assert.strictEqual(err, null)
        assert.strictEqual(provider.count, 55)
        assert.strictEqual(provider.pages, 3)
        assert.strictEqual(provider.page, 1)
        assert.strictEqual(provider.docs.length, 25)
        done()
      })
    })

    it('should paginate with null object query', function (done) {
      FooModel.paginate({
        query: {}
      , page: 1
      , limit: 25
      }, function (err, provider) {
        assert.strictEqual(err, null)
        assert.strictEqual(provider.count, 55)
        assert.strictEqual(provider.pages, 3)
        assert.strictEqual(provider.page, 1)
        assert.strictEqual(provider.docs.length, 25)
        done()
      })
    })

    it('should paginate with query', function (done) {
      FooModel.paginate({
        query: { count: 10 }
      , page: 1
      , limit: 25
      }, function (err, provider) {
        assert.strictEqual(err, null)
        assert.strictEqual(provider.count, 1)
        assert.strictEqual(provider.pages, 1)
        assert.strictEqual(provider.page, 1)
        assert.strictEqual(provider.docs.length, 1)
        assert.strictEqual(provider.docs[0].count, 10)
        done()
      })
    })

    it('should go the last page', function (done) {
      FooModel.lastPage(function (err, provider) {
        assert.strictEqual(err, null)
        assert.strictEqual(provider.count, 55)
        assert.strictEqual(provider.pages, 6)
        assert.strictEqual(provider.page, 6)
        assert.strictEqual(provider.docs.length, 5)
        done()
      })
    })

    it('should go the first page', function (done) {
      FooModel.firstPage(function (err, provider) {
        assert.strictEqual(err, null)
        assert.strictEqual(provider.count, 55)
        assert.strictEqual(provider.pages, 6)
        assert.strictEqual(provider.page, 1)
        assert.strictEqual(provider.docs.length, 10)
        done()
      })
    })
  })

  describe('#custom()', function () {
    var FooSchema = new Schema({ 
      count: Number
    , name: String
    , foo: { type: Schema.Types.ObjectId, ref: 'paginateFoo' }
    })
    FooSchema.plugin(pagination, {
      defaultLimit: 20
    , defaultQuery: { count: { $gt: 10 } }
    , defaultFields: { count : 1, foo: 1 }
    , defaultSort: { count: 1 }
    , defaultPopulate: 'foo'
    , remember: true
    })
    var BarModel = db.model('paginateBar', FooSchema)
    
    before(function () {
      BarModel.remove(function (err) {
        assert.strictEqual(err, null)
      })
    })

    it('should populate the db', function (done) {
      for (var x = 1; x <= 55; x++) {
        var instance = new BarModel({ 
          count: x
        , name: 'foobar'
        , foo: idOfLastFooDoc
        })
        instance.save(function(err, doc) {
          assert.strictEqual(err, null)
          if (doc.count == 55) done()
        })
      }
    })
    
    it('should have custom properties', function (done) {
      assert.strictEqual(typeof FooSchema.statics.paginate, 'function')
      assert.strictEqual(typeof FooSchema.statics.firstPage, 'function')
      assert.strictEqual(typeof FooSchema.statics.lastPage, 'function')
      done()
    })

    it('should paginate', function (done) {
      BarModel.paginate(function (err, provider) {
        assert.strictEqual(err, null)
        assert.strictEqual(provider.count, 45)
        assert.strictEqual(provider.pages, 3)
        assert.strictEqual(provider.page, 1)
        assert.strictEqual(provider.docs.length, 20)
        assert.equal(provider.docs[0].count, 11)
        assert.strictEqual(provider.docs[0].name, undefined)
        done()
      })
    })

    it('should paginate again', function (done) {
      BarModel.paginate({ 
        page: 2
      , limit: 5
      }, function (err, provider) {
        assert.strictEqual(err, null)
        assert.strictEqual(provider.count, 45)
        assert.strictEqual(provider.pages, 9)
        assert.strictEqual(provider.page, 2)
        assert.strictEqual(provider.docs.length, 5)
        done()
      })
    })

    it('should remember the last options', function (done) {
      BarModel.paginate({ 
        page: 7
      }, function (err, provider) {
        assert.strictEqual(err, null)
        assert.strictEqual(provider.count, 45)
        assert.strictEqual(provider.pages, 9)
        assert.strictEqual(provider.page, 7)
        assert.strictEqual(provider.docs.length, 5)
        assert.strictEqual(provider.docs[0].foo.count, 55)
        done()
      })
    })

    it('should paginate with ascending sort and population', function (done) {
      BarModel.paginate({
        page: 2
      , limit: 5
      , sort: { count: 1 }
      }, function (err, provider) {
        assert.strictEqual(err, null)
        assert.strictEqual(provider.count, 45)
        assert.strictEqual(provider.pages, 9)
        assert.strictEqual(provider.page, 2)
        assert.strictEqual(provider.docs.length, 5)
        assert.strictEqual(provider.docs[0].count, 16)
        assert.strictEqual(provider.docs[0].foo.count, 55)
        done()
      })
    })

    it('should paginate with descending sort and population', function (done) {
      BarModel.paginate({ 
        page: 2
      , limit: 5
      , sort: { count: -1 }
      }, function (err, provider) {
        assert.strictEqual(err, null)
        assert.strictEqual(provider.count, 45)
        assert.strictEqual(provider.pages, 9)
        assert.strictEqual(provider.page, 2)
        assert.strictEqual(provider.docs.length, 5)
        assert.strictEqual(provider.docs[0].count, 50)
        assert.strictEqual(provider.docs[0].foo.count, 55)
        done()
      })
    })

  })
})
