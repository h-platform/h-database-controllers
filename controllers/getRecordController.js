var bookshelf = require(appRoot + '/bookshelf');
var Models = require(appRoot + '/models');
var l = require(appRoot + '/logger');

var _ = require('lodash');

var className = 'getRecordController'

module.exports = function(config){
  return {
    pattern: { role: config.role, model: config.model, cmd:'getRecord' }, 
    action: function (args, callback) {

      myModel = Models[config.model].forge({id: args.id});

      myModel.query(function(qb){
        //select config columns
        if (_.has(config, className +'.columns')) {
          qb.select(config[className].columns);
        }
        //select config columns
        if (args.columns) {
          qb.select(args.columns)
        }

        if(_.isFunction(config.getRecord)) {
          config.queryRecord(qb, args);
        }
      });

      var withRelatedClause = _.union(config.relations, args.relations);

      myModel.fetch({withRelated: withRelatedClause}).then(function(record) {
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
