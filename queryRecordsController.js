/*

  A typical config:
  config: {
    role: database, 
    model: post
  }
  
  A typical senica pattern for config:
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

*/
var bookshelf = require(appRoot + '/bookshelf');
var Models = require(appRoot + '/models');
var l = require(appRoot + '/logger');

var _ = require('lodash');
var global_config = require('config');

var Mapper = require('jsonapi-mapper');
var mapper = new Mapper.Bookshelf('https://hlab.dev/jsonapi');

module.exports = function(config){
  return {
    pattern: { role: config.role, model: config.model, cmd:'queryRecords' }, 
    action: function (args, callback) {
      var globalPageSize = global_config.has('application.pageSize') ? global_config.get('application.pageSize') : null;
      var pageSize = args.pageSize || config.pageSize || globalPageSize || 50;
      var page = args.page || 1;
      var model = Models[config.model];
      
      var queryBuilder = model.query(function(qb){
        //select columns
        if (config.select_query_keys) {
          qb.select(config.select_query_keys);
        } else if (config.select_keys) {
          qb.select(config.select_keys);
        }

        //order by clause
        if (config.orderBy) {
          qb.orderBy(config.orderBy);
        }

        //where clause
        if(_.isObject(args.where)){
          var groupedWhereClauses = _.groupBy(args.where, 'group');
          // console.log(groupedWhereClauses);
          _.each(groupedWhereClauses, function(whereGroup){
            // console.log('     ----- processing group', whereGroup);
            qb.where(function() {
              var qb2 = this;
              _.each(whereGroup, function(clause){
                // console.log('             ----- processing clause', clause);
                if(clause.groupOp == 'or') {
                  qb2.orWhere(clause.col, clause.op , clause.val);
                } else {
                  qb2.andWhere(clause.col, clause.op , clause.val);
                }
              });
            })
          })
        }

        if(_.isFunction(config.queryRecords)) {
          config.queryRecords(qb, args);
        }
        
      });

      queryBuilder.fetchPage({
          pageSize: pageSize,
          page: page,
          withRelated: config.relations
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
