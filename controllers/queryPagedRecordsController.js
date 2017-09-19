/******************************************
  A typical config:
  config: {
    role: database, 
    model: post
  }
  
  A typical processed senica pattern:
  {
    role: 'database',
    model: 'post',
    cmd: 'queryRecords',
    where: [
      { col: 'category_id', group: 'g1', op: '=', groupOp: 'or',  val: '1' },
      { col: 'category_id', group: 'g1', op: '=', groupOp: 'or',  val: '2' },
      { col: 'status_id',   group: 'g2', op: '=', groupOp: 'or',  val: '1' },
      { col: 'status_id',   group: 'g2', op: '=', groupOp: 'or',  val: '2' },
      { col: 'queue_id',    group: '',   op: '=', groupOp: 'and', val: '1' }
    ],
    pageSize: 25,
    page: 1
  }
*********************************************/

var bookshelf = require(appRoot + '/bookshelf');
var Models = require(appRoot + '/models');
var l = require(appRoot + '/logger');

var _ = require('lodash');
var global_config = require('config');

var Mapper = require('jsonapi-mapper');
var mapper = new Mapper.Bookshelf('https://hlab.dev/jsonapi');
var className = 'queryPagedRecordsController';

module.exports = function(config){
  return {
    pattern: { role: config.role, model: config.model, cmd:'queryPagedRecords' }, 
    action: function (args, callback) {
      var globalPageSize = global_config.has('application.pageSize') ? global_config.get('application.pageSize') : null;
      var pageSize = args.pageSize || config.pageSize || globalPageSize || 50;
      var page = args.page || 1;
      var model = Models[config.model];
      
      var queryBuilder = model.query(function(qb){
        //select config columns
        if (_.has(config, className +'.columns')) {
          qb.select(config[className].columns);
        }
        //select config columns
        if (args.columns) {
          qb.select(args.columns)
        }

        //order by clause
        if (_.has(config, className +'.orderBy')) {
          qb.orderBy(config[className].orderBy);
        }

        //where clause
        if(_.isObject(args.where)){
          var groupedWhereClauses = _.groupBy(args.where, 'group');
          _.each(groupedWhereClauses, function(whereGroup){
            qb.where(function() {
              var qb2 = this;
              _.each(whereGroup, function(clause){
                if(clause.groupOp == 'or') {
                  qb2.orWhere(clause.col, clause.op , clause.val);
                } else {
                  qb2.andWhere(clause.col, clause.op , clause.val);
                }
              });
            })
          })
        }

        //searchable 
        if(_.has(args, 'keyword') && _.has(config, className+'.searchable_columns') && _.isArray(config[className].searchable_columns)) {
          qb.where(function(){
            qb2=this;
            _.each(config[className].searchable_columns, function(columnName){
              qb2.orWhere(columnName, 'LIKE', '%' + args.keyword + '%'); //TODO: escape quates
            });
          });
        }

        //check if a queryRecordFunction was provided in the config file
        if(_.has(config, 'queryPagedRecordsController.query') && _.isFunction(config.queryPagedRecordsController.query)) {
          config.queryPagedRecordsController.query(qb, args);
        }
        
      });
      
      var withRelatedClause = _.union(config.relations, args.relations);

      queryBuilder.fetchPage({
          pageSize: pageSize,
          page: page,
          withRelated: withRelatedClause
      }).then(function(records) {
        if(args.serialize == 'jsonapi') {
          callback(null, mapper.map(records, config.model));
        } else {
          callback(null, {
            records: records.toJSON(),
            pagination: records.pagination
          });
        }
      }).catch(function(error){
        callback(error, null);
      });

    }
  };
};
