
// Cleanup routine
// ---------------

var assert = require('assert')
  , db = require('./common').db
  , mongoose = require('./common').mongoose


describe('#cleanup()', function() {
  it('should drop the database and disconnect', function(done) {
  	mongoose.connection.on('open', function (){
		mongoose.connection.db.dropDatabase(function (err) {
	  		assert.strictEqual(err, null)
	      done()
	  	})
	})
  })
})
