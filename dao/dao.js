/*
    Database Connector File That consists of logic associated with connections to the database
    @author Shubham Chodankar
*/
var nosqldb = require('nosqldb-oraclejs'),
    environment = process.env.NODE_ENV && process.env.NODE_ENV!== undefined? process.env.NODE_ENV :  'local',
    config = require('./../config/config.js'),
    message = require('./../helpers/message.json'),
    configuration = new nosqldb.Configuration();

nosqldb.Logger.logLevel = nosqldb.LOG_LEVELS.DEBUG;
nosqldb.Logger.logToConsole = true;
nosqldb.Logger.logToFile = false;

configuration.proxy = Object.assign(configuration.proxy, {
    startProxy : config[environment].db.proxy.start,
    host : config[environment].db.proxy.host,
    KVCLIENT_JAR : 'node_modules/nosqldb-oraclejs/kvproxy/kvclient.jar',
    KVPROXY_JAR : 'node_modules/nosqldb-oraclejs/kvproxy/kvproxy.jar',
    securityFile : config[environment].db.proxy.security_file_path
});

configuration.storeHelperHosts = config[environment].db.store_helper_hosts;
configuration.storeName = config[environment].db.store_name;
configuration.username = config[environment].db.username;

var store = nosqldb.createStore(configuration);

store.on('open', function () {

  console.log("Local Database Connection has been established successfully");
  console.log('Store opened.');
  //runAllMigrations();

}).on('close', function() {

  console.log('Store closed.');
  store.shutdownProxy();

}).on('error', function(error) {

  console.log('Error in the store.');
  console.log(error);
  store.close();

});

//Open The Connection to be associated with the NOSQL database
store.open();

/**
* Function to fetch details associated with a row in table using a primary key object
*/
exports.getData = function(table, primary_key, callback){

    if(store){
        store.get(table, primary_key, function(err, result){
            if(err) return callback(err)
            callback(null, result.currentRow);
        })
    }else{
        callback(message.error.database.connection_error)
    }

}

/**
* Over time need to make sure that we do not repeatedly run the same migration files
* @todo Create Migration files Independently and Run them one by one
*/
function runAllMigrations(){
    //nosql_store.executeFuture('<PLEASE SPECIFY QUERY HERE>', handleError);
}