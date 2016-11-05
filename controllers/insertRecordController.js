var bookshelf = require(appRoot + '/bookshelf');
var Models = require(appRoot + '/models');
var l = require(appRoot + '/logger');

var _ = require('lodash');

module.exports = function(config){
  return {
    pattern: { role: config.role, model: config.model, cmd:'insertRecord' }, 
    action: function (args, callback) {
      var msg = ''; //msg used for error
      var incoming_record = args.record;

      //make sure model exists
      if(!_.isObject(Models[config.model])){
        msg = 'Error during insertRecordController for model:' + config.model + '. Could not find model specified in config file.';
        l.error(msg);
        l.error('config:', config);
        callback(msg, null);
      }

      //make sure record has no id field
      if(incoming_record.id){
        msg = 'Error during saveRecordController for model ' + config.model + ': payload cannot have id "' + record_id + '" for insert operation';
        l.error(msg);
        l.error('config:', config);
        callback(msg, null);
      }

      var fields = Models[config.model].fields;

      //filter allowed save_keys from the model if exsists
      if(_.isArray(fields)) {
        var incoming_keys = _.keys(incoming_record);
        var difference = _.difference(incoming_keys, fields);
        if(_.isArray(difference) && difference.length) {
          msg = 'Dropping incoming keys during saveRecord for model:' + config.model;
          l.warn(msg);
          l.warn('dropped keys:', difference);
          incoming_record = _.omit(incoming_record, difference);
        }
      }

      //check if there are some key / value left in the incoming record
      if(_.keys(incoming_record).length === 0){
        msg = 'Error during insertRecordController for model ' + config.model + ': No attribute values to be saved in incoming record. Maybe they are all dropped by configured filter.';
        l.error(msg);
        callback(new Error(msg), null);
      }


      //try save the record
      var model = Models[config.model]
      .forge(incoming_record);

      //some other default keys
      if(_.indexOf(fields,'flag') >= 0) model.set('flag', model.get('flag') || 0);
      if(_.indexOf(fields,'created_at') >= 0) model.set('created_at', new Date());
      if(_.indexOf(fields,'created_by') >= 0 && _.has(args, 'auth.credentials.id')) {
        model.set('created_by', args.auth.credentials.id);
      }

      //inserting record ...
      model.save().then(function(savedRecord) {
        //reload the saved record
        return Models[config.model]
        .forge({id: savedRecord.id})
        .fetch();
      }).then(function(loadedRecord){
        callback(null, { record: loadedRecord.toJSON()});
      }).catch(function(err){
        l.error('Error during saveRecord operation for model:', config.model);
        console.log(err);
        callback(err, null);
      });

    }
  };
};
