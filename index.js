var mainController = require('./controller');
var _ = require('lodash');
var fs = require('fs');
var glob = require('glob');

var configs = [];
var controllers = [];
var root = "";

module.exports = function(seneca, l, global_config){

    var models_path = global_config.has("seneca.models_path") ? global_config.get("seneca.models_path") : "models";
    var models_glob_pattern = appRoot + '/' + models_path + '/*.js';

    var pods_path = global_config.has("seneca.pods_path") ? global_config.get("seneca.pods_path") : "pods";
    var pods_glob_pattern = appRoot + '/' + pods_path + '/*/controller.js';

    glob(models_glob_pattern, {}, function (er, files) {
      // files is an array of filenames.
      _.each(files, function(file){
        model_name = file;
        model_name = _.replace(model_name, appRoot + '/' + models_path + '/', "");
        model_name = _.replace(model_name, ".js", "");
        model_name = _.camelCase(model_name);
        model_name = _.snakeCase(model_name);
        l.info("Generating controllers for model:", model_name, " from:", file);
        
        //try loading configuration file
        var config;
        var config_path = appRoot + '/' + pods_path + '/' + model_name + '/config.js';
        
        try {
          config = require(config_path);
          l.info(" - Loaded config from", config_path);

          //check if model value exsists, if not set to default one
          if(!config.role) {
            config.role = global_config.has('seneca.role') ? global_config.get('seneca.role') : "database";
          }
          if(!config.model) {
            config.model = model_name;
          }
          if(!config.limit) {
            config.limit = global_config.has('seneca.role') ? global_config.get('seneca.limit') : "50";
          }
        } catch (e) {
          l.info(" - Generating auto config for model:", model_name);
          config = {
            role: global_config.has('seneca.role') ? global_config.get('seneca.role') : "database",
            model: model_name,
            limit: global_config.has('seneca.role') ? global_config.get('seneca.limit') : "50"
          };
        }
        
        var controllers = mainController(config);
        _.each(controllers, function(controller){
          seneca.add(controller.pattern, controller.action);
          l.info(' - Injecting Seneca action with pattern', controller.pattern, 'for model:', model_name);
        });

      });
    });

    glob(pods_glob_pattern, {}, function (er, files) {
      //each file exports array of controllers
      _.each(files, function(file){
        var controllers = require(file);
        l.info("Loaded", controllers.length, "controllers from file:", file);
        _.each(controllers, function(controller){
          seneca.add(controller.pattern, controller.action);
          l.info(' - Added Seneca Pattern', controller.pattern);
        });
      });
    });
};