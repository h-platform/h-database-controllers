This is a seneca plugin that adds premade controllers deals with common CRUD operations.
it depends on bookshelf and knex modules

Usage
-----
Make sure you define appRoot to point to root path of your application (your senica microservice application).
A typical usage in your application:
```
var path = require('path');
global.appRoot = path.resolve(__dirname);
var seneca = require('seneca')()
                .use('h-database-controllers')
                .listen();
```


Notes:
------
Controllers uses the rootPath and refers to these files in root directory:

```
var bookshelf = require(appRoot + '/bookshelf');  //winston logger instance
var Models = require(appRoot + '/models');        //collections of all defined models 
var l = require(appRoot + '/logger');             //configured bookshalf instance
```

You must also have config, seneca and bookshelf modules installed as peerDependancy in your main app
