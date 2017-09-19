var bookshelf = require(appRoot + '/bookshelf');
var Models = require(appRoot + '/models');
var l = require(appRoot + '/logger');
var _ = require('lodash');
var className = 'queryRecordController'

module.exports = function(config){
  return {
    pattern: { role: config.role, model: config.model, cmd:'queryRecord' }, 
    action: function (args, callback) {

      myModel = Models[config.model].forge();

      myModel.query(function(qb){
        //select config columns
        if (_.has(config, className +'.columns')) {
          qb.select(config[className].columns);
        }
        //select config columns
        if (args.columns) {
          qb.select(args.columns)
        }

        // support where: [{col:'' op:'' val:''}] in args
        if(_.isArray(args.where)){
          _.each(args.where, function(clause){
            qb.where(clause.col, clause.op , clause.val);
          });
        }

        //support loading by id
        if(args.id){
          qb.where('id', args.id);
        }

        if(_.isFunction(config.queryRecord)) {
          config.queryRecord(qb, args);
        }
        
      });

      if (config.relations) {
        myModel.load(config.relations);
      }

      var withRelatedClause = _.union(config.relations, args.relations);

      myModel.fetch({
        withRelated: withRelatedClause
      }).then(function(record) {
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
