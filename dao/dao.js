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
    _ = require('lodash');
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
* Function to fetch Details associated With a table along with chilld tables associated
* @Note The below Function should be Used Ideally to fetch Children Elements along with Parent by using only Parent Primary Key
* @ Equivalent to findOne Query being Fired in a SQL Relational Database
*/
exports.getDataWithChildByIteration = function(table, primary_key, child_tables, callback){

        store.tableIterator(table, primary_key, {
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
* Custom function to fetch data associated with a table, along with child tables
*/
exports.getOneByIteration = function(table, primary_key, child_tables, customization, callback){

        var child_tables_to_fetch = [];
        child_tables.forEach(function(child_table_details){
            child_tables_to_fetch.push(child_table_details.table_name)
        })

        store.tableIterator(table, primary_key, {
            includedTables: child_tables_to_fetch
        }, function(err, iterator){

            if(err) return callback(err);
            var result = {};
            iterator.forEach(function(err, returnedRow){
                if(err) return console.log("Error occured due to : ", err);
                switch(returnedRow.table){
                                    case table: if(customization && customization.values){
                                                    var formatted_result = {};
                                                    customization.values.forEach(function(key){
                                                        if(typeof key === 'object') formatted_result[key[1]] = returnedRow.row[key[0]] || 0;
                                                        else formatted_result[key] = returnedRow.row[key] || 0;
                                                    })
                                                    result = formatted_result;
                                                }else result = returnedRow.row;
                                                break;
                                    default :
                                                var child_table = _.filter(child_tables, {
                                                    table_name : returnedRow.table
                                                })[0], formatted_child_result={};
                                                if(child_table && child_table.values){
                                                    var formatted_child_result = {};
                                                    child_table.values.forEach(function(key){
                                                        if(typeof key === 'object') formatted_child_result[key[1]] = returnedRow.row[key[0]] || 0;
                                                        else formatted_child_result[key] = returnedRow.row[key] || 0;
                                                    })
                                                }else {
                                                    formatted_child_result = returnedRow.row;
                                                }

                                                if(result[child_table && child_table.alias || returnedRow.table]){
                                                    result[child_table && child_table.alias || returnedRow.table].push(formatted_child_result)
                                                }else{
                                                    result[child_table.alias || returnedRow.table] = [formatted_child_result];
                                                }
                                                break;
                                }
            })
            callback(null, result);

        })

};

/**
* To be used when Fetching Data with Formatting Associated with the Data being fetched
* @Note We can use the function below when fetching list of data with child tables and formatting of values for both the parent and the child tables
*/
exports.getMultipleDataWithChildByIteration = function(table, primary_key, customization, child_tables, callback){

        var child_tables_to_fetch = [];
        child_tables.forEach(function(child_table_details){
            child_tables_to_fetch.push(child_table_details.table_name)
        })

        store.tableIterator(table, primary_key, {
            includedTables: child_tables_to_fetch
        }, function(err, iterator){

            if(err) return callback(err);
            var result = [], child_tables_to_process = {};
            var parent_table_encountered = false;
            iterator.forEach(function(err, returnedRow){

                if(err) return console.log("Error occured due to : ", err);

                switch(returnedRow.table){
                    case table:     parent_table_encountered = true;
                                    if(customization && customization.values){
                                    var formatted_result = {};
                                    customization.values.forEach(function(key){
                                        if(typeof key === 'object') formatted_result[key[1]] = returnedRow.row[key[0]] || 0;
                                        else formatted_result[key] = returnedRow.row[key] || 0;
                                    })
                                    //Testing with Mock Being Sent out to the application
                                    //result.push(formatted_result);
                                    result.push(Object.assign(formatted_result, {
                                                                                                                        "enq_count_stats": {
                                                                                                                                                                     "month": "05",
                                                                                                                                                                     "days": [
                                                                                                                                                                         "2018-05-13",
                                                                                                                                                                         "2018-05-14",
                                                                                                                                                                         "2018-05-15",
                                                                                                                                                                         "2018-05-16",
                                                                                                                                                                         "2018-05-17",
                                                                                                                                                                         "2018-05-18",
                                                                                                                                                                         "2018-05-19",
                                                                                                                                                                         "2018-05-20"
                                                                                                                                                                     ],
                                                                                                                                                                     "enquiries": {
                                                                                                                                                                         "2018-05-13": "0",
                                                                                                                                                                         "2018-05-14": "0",
                                                                                                                                                                         "2018-05-15": "0",
                                                                                                                                                                         "2018-05-16": "0",
                                                                                                                                                                         "2018-05-17": "0",
                                                                                                                                                                         "2018-05-18": "0",
                                                                                                                                                                         "2018-05-19": "0",
                                                                                                                                                                         "2018-05-20": "0"
                                                                                                                                                                     },
                                                                                                                                                                     "curr_week_total": "0",
                                                                                                                                                                     "last_week_total": "0"
                                                                                                                                                                 },
                                                                                                                         "enq_res_time_stats": {
                                                                                                                                                                     "month": "05",
                                                                                                                                                                     "days": [
                                                                                                                                                                         "2018-05-13",
                                                                                                                                                                         "2018-05-14",
                                                                                                                                                                         "2018-05-15",
                                                                                                                                                                         "2018-05-16",
                                                                                                                                                                         "2018-05-17",
                                                                                                                                                                         "2018-05-18",
                                                                                                                                                                         "2018-05-19",
                                                                                                                                                                         "2018-05-20"
                                                                                                                                                                     ],
                                                                                                                                                                     "response_times": {
                                                                                                                                                                         "2018-05-13": "0",
                                                                                                                                                                         "2018-05-14": "0",
                                                                                                                                                                         "2018-05-15": "0",
                                                                                                                                                                         "2018-05-16": "0",
                                                                                                                                                                         "2018-05-17": "0",
                                                                                                                                                                         "2018-05-18": "0",
                                                                                                                                                                         "2018-05-19": "0",
                                                                                                                                                                         "2018-05-20": "0"
                                                                                                                                                                     },
                                                                                                                                                                     "curr_week_avg": "0",
                                                                                                                                                                     "last_week_avg": "0"
                                                                                                                                                                 }
                                                                                                                        }))
                                }else result.push(returnedRow.row);
                                break;
                    default:
                                /*Check 1 : If parent Table has not been encountered, then return from child tables*/
                                if(!parent_table_encountered) return;
                                var child_table = _.filter(child_tables, {
                                    table_name : returnedRow.table
                                })[0], formatted_child_result={};
                                var allow_fetch = true;
                                /*Logic for Conditional Fetching of Results starts here*/

                                    //When Checking the Keys associated with the Child Values, If there is a condition received, then check the condition
                                /*Check 1 : Check for any condition that has been received in the Request*/
                                for( var key in child_table.condition){
                                    if(returnedRow.row[key] && returnedRow.row[key] !== undefined){
                                         conditionValidator(child_table.condition[key], returnedRow.row[key], function(check_passed){

                                            if(!check_passed){
                                                if(child_table.join_fetch) {
                                                    result.pop();
                                                    /*If the condition is join_fetch i.e will fetch Parent only if Child meets a condition then
                                                    We need to Ignore all other child tables obtained in sequence to prevent data of other valid Parent Rows from being overridden*/
                                                    parent_table_encountered = false;
                                                    allow_fetch = false;
                                                }
                                            }
                                         })
                                    }
                                }

                                if(!allow_fetch) return;
                                /*Logic for Conditional Fetching of Results ends here*/

                                if(child_table && child_table.values){
                                    var formatted_child_result = {};
                                    child_table.values.forEach(function(key){
                                        if(typeof key === 'object') formatted_child_result[key[1]] = returnedRow.row[key[0]] || 0;
                                        else formatted_child_result[key] = returnedRow.row[key] || 0;
                                    })
                                }else {
                                    formatted_child_result = returnedRow.row;
                                }
                                if(result[result.length -1][child_table && child_table.alias || returnedRow.table]){
                                    result[result.length-1][child_table && child_table.alias || returnedRow.table].push(formatted_child_result)
                                }else{
                                    result[result.length -1][child_table.alias || returnedRow.table] = [formatted_child_result];
                                }
                                break;
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
exports.getOneIndexIterator = function(table, index, condition, child_tables, customization, callback){

       store.indexIterator(table, index, {
            fieldRange: new nosqldb.Types.FieldRange(index, condition, true, condition, true)
       }, function(err, iterator){
            if(err) return callback(err);
            var result = {};
            iterator.forEach(function(err, returnedRow){
            if(err) return console.log("Error occured due to : ", err);
            switch(returnedRow.table){
                                case table: if(customization && customization.values){
                                                var formatted_result = {};
                                                customization.values.forEach(function(key){
                                                    if(typeof key === 'object') formatted_result[key[1]] = returnedRow.row[key[0]] || 0;
                                                    else formatted_result[key] = returnedRow.row[key] || 0;
                                                })
                                                result = formatted_result;
                                            }else result = returnedRow.row;
                                            break;
                                default :
                                            var child_table = _.filter(child_tables, {
                                                table_name : returnedRow.table
                                            })[0], formatted_child_result={};
                                            if(child_table && child_table.values){
                                                var formatted_child_result = {};
                                                child_table.values.forEach(function(key){
                                                    if(typeof key === 'object') formatted_child_result[key[1]] = returnedRow.row[key[0]] || 0;
                                                    else formatted_child_result[key] = returnedRow.row[key] || 0;
                                                })
                                            }else {
                                                formatted_child_result = returnedRow.row;
                                            }

                                            if(result[child_table && child_table.alias || returnedRow.table]){
                                                result[child_table && child_table.alias || returnedRow.table].push(formatted_child_result)
                                            }else{
                                                result[child_table.alias || returnedRow.table] = [formatted_child_result];
                                            }
                                            break;
                            }
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
exports.createDataWithChild = function(table, primary_key, data, child_tables, callback){


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
* Function to Perform Update Operations associated with the Database
*/
exports.updateDataWithChild = function(table, primary_key, data, child_tables, callback){

    var child_tables_to_fetch = [];
            child_tables.forEach(function(child_table_details){
                child_tables_to_fetch.push(child_table_details.table_name)
            })
    exports.getDataWithChildByIteration(table, {
        primary_key : data[primary_key]
    }, child_tables_to_fetch, function(err, result){

            store.put(table, Object.assign(result, data), function(err){
                if(err) return callback(err)
                async.each(child_tables, function(table_details, callback){
                    var parent_details = {};
                    primary_key.forEach(function(single_primary_key){
                    console.log("Setting the Primary key as : ", single_primary_key);
                         parent_details[single_primary_key] = data[single_primary_key]
                    })
                    exports.putData(parent_details, table_details.table_name, Object.assign(result[table_details.table_name], table_details.data), callback)
                }, function(err){
                    callback(err);
                })
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


function conditionValidator(conditions, value, callback){

    console.log("The check received associated with the key is : ", conditions, value);
    var validated = true;
    for(var condition in conditions){
        switch(condition){
            case '$contains' :  console.log("The associated Value Involved is : ", value, value.indexOf(conditions[condition]));
                                if(value.indexOf(conditions[condition]) === -1){
                                    validated = false;
                                }
                                break;
        }
    }
    callback(validated);

}

