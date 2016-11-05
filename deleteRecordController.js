var bookshelf = require(appRoot + '/bookshelf');
var Models = require(appRoot + '/models');
var l = require(appRoot + '/logger');

var _ = require('lodash');

module.exports = function(config){
  return {
    pattern: { role: config.role, model: config.model, cmd:'deleteRecord' }, 
    action: function (args, callback) {
      Models[config.model]
      .forge({id: args.id})
      .destroy()
      .then(function(record) {
        callback(null, {success:true, msg: 'Record with id ' + args.id + ' deleted successfully'});
      }).catch(function(err){
        l.error(err);
        callback(err, null);
      });
    }
  };
};
