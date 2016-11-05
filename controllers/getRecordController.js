var bookshelf = require(appRoot + '/bookshelf');
var Models = require(appRoot + '/models');
var l = require(appRoot + '/logger');

var _ = require('lodash');

module.exports = function(config){
  return {
    pattern: { role: config.role, model: config.model, cmd:'getRecord' }, 
    action: function (args, callback) {

      myModel = Models[config.model].forge({id: args.id});

      myModel.query(function(qb){
        if (config.select_record_keys) {
          qb.select(config.select_record_keys);
        } else if (config.select_keys) {
          qb.select(config.select_keys);
        }

        if(_.isFunction(config.getRecord)) {
          config.queryRecord(qb, args);
        }
      });

      myModel.fetch({withRelated: config.relations}).then(function(record) {
        if(args.serialize == 'jsonapi') {
          callback(null, mapper.map(record, config.model));
        } else {
          callback(null, { record: record});
        }
      }).catch(function(error){
        callback(error, null);
      });
    }
  };
};
