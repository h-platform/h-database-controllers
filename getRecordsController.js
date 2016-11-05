var bookshelf = require(appRoot + '/bookshelf');
var Models = require(appRoot + '/models');
var l = require(appRoot + '/logger');

var _ = require('lodash');
var Mapper = require('jsonapi-mapper');
var mapper = new Mapper.Bookshelf('https://hlab.dev/jsonapi');


module.exports = function(config){
  return {
    pattern: { role: config.role, model: config.model, cmd:'getRecords' }, 
    action: function (args, callback) {

      var collection = Models[config.model].collection();
      
      collection.query(function(qb){
        if (config.select_query_keys) {
          qb.select(config.select_query_keys);
        } else if (config.select_keys) {
          qb.select(config.select_keys);
        }

        if(_.isFunction(config.getRecords)) {
          config.queryRecord(qb, args);
        }
      });

      if (config.relations) {
        collection.load(config.relations);
      }

      collection.fetch().then(function(records) {
        if(args.serialize == 'jsonapi') {
          callback(null, mapper.map(records, config.model));
        } else {
          callback(null, { records: records});
        }
      }).catch(function(error){
        callback(error, null);
      });

    }
  };
};
