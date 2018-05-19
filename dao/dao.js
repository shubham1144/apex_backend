/*
    Database Connector File That consists of logic associated with connections to the database
    @author Shubham Chodankar
*/
var nosqldb = require('nosqldb-oraclejs'),
    fs = require('fs'),
    async = require('async'),
    environment = process.env.NODE_ENV && process.env.NODE_ENV!== undefined? process.env.NODE_ENV :  'local',
    config = require('./../config/config.js'),
    message = require('./../helpers/message.json'),
    configuration = new nosqldb.Configuration();

//nosqldb.Logger.logLevel = nosqldb.LOG_LEVELS.DEBUG;
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

};

/**
* Function to fetch Details Along with Child tables associated
* Need to pass the child table Primary key aswell in the table
*/
exports.getDataWithChild = function(table, primary_key, child_tables, callback){

      store.get(table, primary_key, function(err, result){
            if(err) return callback(err);
            async.each(child_tables, function(child_table_name, callback){
                exports.getData(child_table_name,
                primary_key, function(err, result){
                    console.log("The data received from child table is : ", result);
                    callback(null);
                })
            }, function(err){
                callback(err, result.currentRow);
            })
        })
};

/**
* Function to fetch Details associated With a table along with chilld tables associated
* @Note The below Function should be Used Ideally to fetch Children Elements along with Parent by using only Parent Primary Key
*/
exports.getDataWithChildByIteration = function(table, primary_key, child_tables, callback){

        store.tableIterator('Users', primary_key, {
            includedTables: child_tables
        }, function(err, iterator){

            if(err) return callback(err);
            var result = {};
            iterator.forEach(function(err, returnedRow){
                if(err) return console.log("Error occured due to : ", err);
                //console.log("The data retrieved is : ", returnedRow)
                if(returnedRow.table === table){
                    result = returnedRow.row;
                    //console.log("The User Details Obtained are : ", JSON.stringify(returnedRow));
                }
                else if(Object.keys(result).length){
                    result[returnedRow.table] = returnedRow.row;
                }
            })
            callback(null, result);

        })

};

/**
 *Function to fetch Data By Iteration and Specifying primary key(There can be more than one primary key) condition
 * @Note Only one fieldRange Can be used with Oracle Node.js Driver For now
*/
exports.getDataByIterationKeyCondition = function(table, key_condition, index, callback){

       store.tableIterator(table, key_condition, {
            //Currently, Just testing the Working with FieldRange as not yet used
            fieldRange: new nosqldb.Types.FieldRange(index, 'test', true)
       }, function(err, iterator){

                if(err) return callback(err);
                var result = {};
                iterator.forEach(function(err, returnedRow){
                    if(err) return console.log("Error occured due to : ", err);
                    if(returnedRow.table === table){
                        result = returnedRow.row;
                        //console.log("The User Details Obtained are : ", JSON.stringify(returnedRow));
                    }
                })


                callback(null, result);


            })

};

/**
 * Function to fetch Results from Database Using a index Search Criteria
 * To search Based on a single index only(Limitation of the NOSQL Oracle Database)
 * If need to search based on multiple keys, need to set them as primary keys
*/
exports.getDataByIterationWithFieldRange = function(table, key, index, condition, callback){

       store.indexIterator(table, index, {
            fieldRange: new nosqldb.Types.FieldRange(index, condition, true)
       }, function(err, iterator){

                if(err) return callback(err);
                var result = [];
                iterator.forEach(function(err, returnedRow){
                    if(err) return console.log("Error occured due to : ", err);
                    result.push(returnedRow.row);

                })
                callback(null, result);

            })

};

/*
* Function to insert data in the nosql database linked to the kvstore
*/
exports.putData = function(primary_key, table, data, callback){

    store.put(table, Object.assign(data, primary_key), function(err){
        if(err) return callback(err)
        callback(null);
    })

};

/**
* Function to make database entries in tables along with populating child Tables
*/
exports.putDataWithChild = function(table, primary_key, data, child_tables, callback){

    store.put(table, data, function(err){
        if(err) return callback(err)
        async.each(child_tables, function(table_details, callback){
            var parent_details = {};
            primary_key.forEach(function(single_primary_key){
            console.log("Setting the Primary key as : ", single_primary_key);
                 parent_details[single_primary_key] = data[single_primary_key]
            })
            exports.putData(parent_details, table_details.table_name, table_details.data, callback)
        }, function(err){
            callback(err);
        })
    })

};

/**
* Over time need to make sure that we do not repeatedly run the same migration files
*/
function runAllMigrations(){

    fs.readdir(__dirname + '/migrations/', function(err, files){

        if(err) return console.error("Error Occured due to : ", err);
        files.sort(function(a, b){
            //Sorts in ascending TimeStamps
            return a.split("-")[0] - b.split("-")[0]
        })
        async.eachSeries(files, function(file, callback){

            var migration_data = require('./migrations/' + file)
            async.eachSeries(migration_data, function(query, callback){
                store.execute(query, function(err){
                    if(err) console.error("Error occured while executing : ", file);
                    callback(err)
                });
            }, function(err){
                callback(err);
            })

        }, function(err){
            if(err) return console.error("Error Cause : ", err);
            console.log("All Migration Files have been Executed successfully");
        })

    })

}

