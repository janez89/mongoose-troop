
/*!
 * Analytics Machine - Plugins
 * Copyright(c) Thomas Blobaum
 * MIT Licensed
 */

require('fs').readdirSync(__dirname + '/lib/').forEach(function (file) {
	var name = file.substr(0, file.indexOf('.'));
	if (name.length)
		module.exports[name] = require(__dirname + '/lib/'+ name);
	else
		module.exports[file] = require(__dirname + '/lib/'+ file);
});
