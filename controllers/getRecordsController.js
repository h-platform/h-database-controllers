var bookshelf = require(appRoot + '/bookshelf');
var Models = require(appRoot + '/models');
var l = require(appRoot + '/logger');

var _ = require('lodash');
var Mapper = require('jsonapi-mapper');
var mapper = new Mapper.Bookshelf('https://hlab.dev/jsonapi');
var className = 'getRecordsController'


module.exports = function(config){
  return {
    pattern: { role: config.role, model: config.model, cmd:'getRecords' }, 
    action: function (args, callback) {

      var collection = Models[config.model].collection();
      
      collection.query(function(qb){
        //select config columns
        if (_.has(config, className +'.columns')) {
          qb.select(config[className].columns);
        }
        //select config columns
        if (args.columns) {
          qb.select(args.columns)
        }

        if(_.isFunction(config.getRecords)) {
          config.queryRecord(qb, args);
        }
      });

      if (config.relations) {
        collection.load(config.relations);
      }

      var withRelatedClause = _.union(config.relations, args.relations);
      
      collection.fetch({withRelated: withRelatedClause}).then(function(records) {
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
