module.exports = function(config){
  return [
    require('./getRecordController')(config),
    require('./getRecordsController')(config),
    require('./queryRecordController')(config),
    require('./queryRecordsController')(config),
    require('./queryPagedRecordsController')(config),
    require('./insertRecordController')(config),
    require('./updateRecordController')(config),
    require('./deleteRecordController')(config),
  ];
};
