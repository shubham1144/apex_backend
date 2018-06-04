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
    util = require('./../helpers/util.js'),
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
    securityFile :  __dirname + config[environment].db.proxy.security_file_path
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
    //Close the store only for certain Error Conditions@todo : Determine the Conditions of error when to close the store
});

//Open The Connection to be associated with the NOSQL database
store.open();


exports.TABLE_RECORD = {
    'PLAN' : 'Plans',
    'SUBSCRIPTION': 'Plans.Subscriptions',
    'DOMAIN' : 'Plans.Subscriptions.Domains',
    'FORM' : 'Plans.Subscriptions.Domains.Forms',
    'ENQUIRY' : 'Plans.Subscriptions.Domains.Forms.Enquiry',
    'CALL_LOG' : 'Plans.Subscriptions.Domains.Forms.Enquiry.CallLogs',

    'USER' : 'Users',
    'USER_ATTRIBUTE' : 'Users.UserAttributes'
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

function tableIterator(table, primary_key, conditions, child_tables, customization, callback){
//            return console.log("Testing the working of the dao layer")
            //Create a common function to handle Table Iterator for listing
            store.tableIterator(table, primary_key,conditions, function(err, iterator){

                        if(err) return callback(err);
                        var result = [],
                            child_tables_to_process = {},
                            parent_table_details = {},
                            main_table_encountered = false;

                        iterator.forEach(function(err, returnedRow){

                            if(err) return console.log("Error occured due to : ", err);
                            switch(returnedRow.table){

                                case table: main_table_encountered = true;
                                            if(customization.search_keyword && customization.search_keyword.value){
                                                main_table_encountered = false;
                                                customization.search_keyword.filter_keys.forEach(function(key){
                                                    if(returnedRow.row[key].toLowerCase().indexOf(customization.search_keyword.value.toLowerCase()) !== -1){
                                                        main_table_encountered = true;
                                                    }
                                                })
                                            }

                                            for( var key in customization.condition){
                                                main_table_encountered = false;
                                                if(returnedRow.row[key]!= null && returnedRow.row[key] !== undefined){
                                                    conditionValidator(customization.condition[key], returnedRow.row[key], function(check_passed){
                                                        if(check_passed) main_table_encountered = true;

                                                    })
                                                }
                                            }

                                            if(!main_table_encountered) return;
                                            if(customization && customization.values){
                                                var formatted_result = {};
                                                customization.values.forEach(function(key){
                                                    if(typeof key === 'object' && key[2] && typeof key[2]==='function'){
                                                        formatted_result[key[1]] = key[2](returnedRow.row[key[0]]);
                                                    }else if(typeof key === 'object') formatted_result[key[1]] = (key[2] && key[2]!== undefined)? key[2][returnedRow.row[key[0]]] : returnedRow.row[key[0]] || ((customization.default_values!==undefined && (customization.default_values[key[1]] !== undefined || customization.default_values[key[1]] == 0))? customization.default_values[key[1]] : null);
                                                    else  formatted_result[key] = returnedRow.row[key] || ((customization.default_values!==undefined && (customization.default_values[key] !== undefined || customization.default_values[key] == 0))? customization.default_values[key] : null);

                                                });
                                                result.push(Object.assign(formatted_result, parent_table_details));
                                            }else result.push(Object.assign(returnedRow.row, parent_table_details));
                                            if(customization.custom_function) customization.custom_function(result[result.length - 1], returnedRow.row);
                                            break;
                                default:    /*
                                                If the table involved is not a child table, then it can be parent table
                                                Check 1 : If parent Table has not been encountered, then return from child tables
                                                The Below Check Makes sure that The parent table Condition Executes only Once, Till the Result is being fetched
                                            */
                                            if(!main_table_encountered && result.length < 1){

                                                var parent_table = _.filter(child_tables, { table_name : returnedRow.table })[0];
                                                if(parent_table === undefined) return;
                                                parent_table.values.forEach(function(key){

                                                    if(typeof key === 'object') parent_table_details[key[1]] = returnedRow.row[key[0]] || 0;
                                                    else parent_table_details[key] = returnedRow.row[key] || 0;

                                                })

                                            }else{

                                                //Process The Data associated with Child Tables
                                                var child_table = _.filter(child_tables, {
                                                    table_name : returnedRow.table
                                                })[0], formatted_child_result={};
                                                var allow_fetch = true;
                                                /*  Logic for Conditional Fetching of Results starts here
                                                    Check 2 : Check for any condition that has been received in the Request
                                                */
                                                if(child_table === undefined) return;

                                                for( var key in child_table.condition){
                                                    if(returnedRow.row[key] && returnedRow.row[key] !== undefined){
                                                         conditionValidator(child_table.condition[key], returnedRow.row[key], function(check_passed){

                                                            if(!check_passed){
                                                                if(child_table.join_fetch) {
                                                                    result.pop();
                                                                    /*If the condition is join_fetch i.e will fetch Parent only if Child meets a condition then
                                                                    We need to Ignore all other child tables obtained in sequence to prevent data of other valid Parent Rows from being overridden*/
                                                                    main_table_encountered = false;
                                                                    allow_fetch = false;
                                                                }
                                                            }
                                                         })
                                                    }
                                                }

                                                if(!allow_fetch) return;
                                                /*Function for Custom Statistics starts here*/

                                                if(child_table.custom_function) child_table.custom_function(result[result.length - 1], returnedRow.row);

                                                /*Functiont for Custom Statistics ends here*/
                                                if(child_table.count_fetch){

                                                    var result_length = result.length - 1;
                                                    if(result[result_length][child_table && child_table.alias || returnedRow.table]){
                                                        result[result_length][child_table && child_table.alias || returnedRow.table]++;
                                                    }else{
                                                        result[result_length][child_table.alias || returnedRow.table] = 1;

                                                    }
                                                    for(var key in child_table.parent_counter){
                                                        for(var sub_key in child_table.parent_counter[key]['condition']){

                                                            var index = _.findIndex(result[result_length][key], [child_table.parent_counter[key]['bind_key'][1], returnedRow.row[child_table.parent_counter[key]['bind_key'][0]]]);
                                                            if(index !==-1 &&  child_table.parent_counter[key]['condition'][sub_key] == returnedRow.row[sub_key]){
                                                                if(result[result_length][key][index][child_table.parent_counter[key]['alias']])
                                                                    result[result_length][key][index][child_table.parent_counter[key]['alias']]++;
                                                                else result[result_length][key][index][child_table.parent_counter[key]['alias']] = 1;
                                                            }

                                                        }
                                                    }
                                                    return;

                                                }
                                                /*Logic for Conditional Fetching of Results ends here*/

                                                if(child_table && child_table.values){
                                                    formatted_child_result = {};
                                                    child_table.values.forEach(function(key){
                                                    if(typeof key === 'object' && key[2] && typeof key[2]==='function'){
                                                         formatted_child_result[key[1]] = key[2](returnedRow.row[key[0]]);
                                                    }
                                                    else if(typeof key === 'object') formatted_child_result[key[1]] = (key[2] && key[2]!== undefined)? key[2][returnedRow.row[key[0]]] : returnedRow.row[key[0]] || null;
                                                    else formatted_child_result[key] = returnedRow.row[key] || ((child_table.default_values[key] == 0 || !child_table.default_values[key] !== undefined)? child_table.default_values[key] : null);
                                                    })
                                                }else {
                                                    formatted_child_result = returnedRow.row;
                                                }
                                                if(result[result.length -1][child_table && child_table.alias || returnedRow.table]){
                                                    result[result.length-1][child_table && child_table.alias || returnedRow.table].push(formatted_child_result)
                                                }else{
                                                    result[result.length -1][child_table.alias || returnedRow.table] = [formatted_child_result];
                                                }

                                            }

                                            break;
                            }

                        })

                        //Paginate Here With Customized Counts being Fetched
                        fetchPagination(result, customization.page || 1, customization.custom_count_fetch || null, customization.sort_by || null, function(err, paginated_result, requested_count_details){
                            callback(null, paginated_result, requested_count_details);
                        })


                    })
}

/**
    * Function to Validate Conditions associated with the Query being Executed
*/
function conditionValidator(conditions, value, callback){

    var validated = true;
    for(var condition in conditions){
        switch(condition){
            case '$contains' :  if(value.indexOf(conditions[condition]) === -1){
                                    validated = false;
                                }
                                break;
            case '$equals' :   if(value != conditions[condition]){
                                                validated = false;
                                }
                                break;
            case '$equalsAny' : if(conditions[condition].indexOf(value) === -1){
                                    validated = false;
                                }
                                break;

        }
    }
    callback(validated);

}

/**
    * Function to Paginate the Result set being Obtained
    * Also Appends any counts requested to be appended.
*/
function fetchPagination(result, page, custom_count_fetch, sort_by, callback){

    var offset = page > 0?(page -1) * 10 : 0;
    var custom_count = {};

    if(custom_count_fetch){
      custom_count_fetch.forEach(function(custom_counter){
            custom_count = Object.assign(custom_count, {
                [custom_counter.alias] : (_.filter(result, { [custom_counter.key] : custom_counter.criteria})).length
            })
        });
    }

    //Sort by Condition Passed.
    if(sort_by && sort_by !== undefined){
        result = util.sortBySequence(sort_by.order, sort_by.key, result || []);
    }

    callback(null, _.take(_.slice(result, offset, result.length), 10), custom_count);

}

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
* Function to insert data in the nosql database linked to the kvstore
*/
exports.putData = function(primary_key, table, data, callback){

    store.put(table, Object.assign(data, primary_key), function(err){
        if(err) return callback(err)
        callback(null);
    })

};

/**
* Custom function to fetch data associated with a table, along with child tables
*/
exports.getOneTableIterator = function(table, primary_key, child_tables, customization, callback){

        var child_tables_to_fetch = [];
        child_tables.forEach(function(child_table_details){
            child_tables_to_fetch.push(child_table_details.table_name)
        });
        store.tableIterator(table, primary_key, {
            includedTables: child_tables_to_fetch
        }, function(err, iterator){

            if(err) return callback(err);
            var result = {}, main_table_encountered= false;
            iterator.forEach(function(err, returnedRow){
                if(err) return console.log("Error occured due to : ", err);
                switch(returnedRow.table){
                    case table:     main_table_encountered = true;
                                    if(customization && customization.values){
                                    var formatted_result = {};
                                    customization.values.forEach(function(key){
                                        if(typeof key === 'object' && key[2] && typeof key[2]==='function'){
                                            formatted_result[key[1]] = key[2](returnedRow.row[key[0]]);
                                        }
                                        else if(typeof key === 'object') formatted_result[key[1]] = (key[2] && key[2]!== undefined)? key[2][returnedRow.row[key[0]]] : returnedRow.row[key[0]] || 0;
                                        else formatted_result[key] = returnedRow.row[key] || ((customization.default_values[key] == 0 || !customization.default_values[key] !== undefined)? customization.default_values[key] : null);

                                    })
                                    result = Object.assign(result, formatted_result);
                                }else result =  Object.assign(result, returnedRow.row);
                         if(customization && customization.custom_function) customization.custom_function(result, returnedRow.row);
                                break;
                    default :
                            if(!main_table_encountered){

                                var parent_table = _.filter(child_tables, { table_name : returnedRow.table })[0];
                                if(parent_table === undefined) return;
                                parent_table.values.forEach(function(key){
                                    if(typeof key === 'object') result[key[1]] = returnedRow.row[key[0]] || 0;
                                    else result[key] = returnedRow.row[key] || 0;
                                })

                            }else{
                                var child_table = _.filter(child_tables, {
                                        table_name : returnedRow.table
                                    })[0],
                                    formatted_child_result={},
                                    allow_fetch = true;
                                /*  Logic for Conditional Fetching of Results starts here
                                    Check 2 : Check for any condition that has been received in the Request
                                */
                                if(child_table === undefined) return;
                                for( var key in child_table.condition){

                                    if(returnedRow.row[key] && returnedRow.row[key] !== undefined){
                                         conditionValidator(child_table.condition[key], returnedRow.row[key], function(check_passed){
                                            if(!check_passed) allow_fetch = false;
                                         })
                                    }

                                }

                                if(!allow_fetch)
                                {
                                    if(result[child_table.alias || returnedRow.table] === undefined) return result[child_table.alias || returnedRow.table] = null;
                                    return;
                                }

                                if(child_table && child_table.values){
                                    formatted_child_result = {};
                                    child_table.values.forEach(function(key){
                                        if(typeof key === 'object' && key[2] && typeof key[2]==='function'){
                                            formatted_child_result[key[1]] = key[2](returnedRow.row[key[0]]);
                                        }
                                        else if(typeof key === 'object') formatted_child_result[key[1]] = (key[2] && key[2]!== undefined)? key[2][returnedRow.row[key[0]]] : returnedRow.row[key[0]] || 0;
                                        else formatted_child_result[key] = returnedRow.row[key] || ((child_table.default_values[key] == 0 || !child_table.default_values[key] !== undefined)? child_table.default_values[key] : null);
                                    })
                                }else {
                                    formatted_child_result = returnedRow.row;
                                }

                                if(result[child_table && child_table.alias || returnedRow.table]){
                                    result[child_table && child_table.alias || returnedRow.table].push(formatted_child_result)
                                }else{
                                    result[child_table.alias || returnedRow.table] = [formatted_child_result];
                                }
                            }
                            break;
                }
            });
            callback(null, result);

        })

};

/**
 * Function to fetch Results from Database Using a index Search Criteria
 * To search Based on a single index only(Limitation of the NOSQL Oracle Database)
 * If need to search based on multiple keys, need to set them as primary keys
 * If there is a Index Iterator Involved, Child/Parent Tables cannot be be fetched, as a result we fetch the details using TableIterator inside the function if its required to fetch Related Tables in the Result Set
*/
exports.getOneIndexIterator = function(table, index, condition, child_tables, customization, callback){

        if(child_tables && child_tables.length > 0){
            store.indexIterator(table, index, {
                            fieldRange: new nosqldb.Types.FieldRange(index, condition, true, condition, true)
                       }, function(err, iterator){

                            if(err) return callback(err);
                            var result = {};
                            var to_filter_result = [];

                            iterator.on('done', function(){
                                //The call Inside will be asyncronous as a result cannot use a iterator.
                                //Currently, in function used to find iterator length and then proceed
                                if(!to_filter_result[0]) return callback({
                                    code : 401,
                                    message : "Not Found"
                                })
                                exports.getOneTableIterator(table, to_filter_result[0].row, child_tables, customization, function(err, data){
                                result = data;
                                return callback(null, data);
                                })

                            })
                            iterator.forEach(function(err, returnedRow){
                                if(err) return console.log("Error occured due to : ", err);
                                to_filter_result.push(returnedRow);

                            })


                        })

        }else{
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
                                                    if(typeof key === 'object') formatted_result[key[1]] = (key[2] && key[2]!== undefined)? key[2][returnedRow.row[key[0]]] : returnedRow.row[key[0]] || 0;
                                                            else formatted_result[key] = returnedRow.row[key] || 0;
                                                        })
                                                        result = formatted_result;
                                                    }else result = returnedRow.row;
                                                    if(customization && customization.custom_function) customization.custom_function(result, returnedRow.row);
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
        }


};

/**
    * To be used when Fetching Data with Formatting Associated with the Data being fetched
    * @Note We can use the function below when fetching list of data with child tables and formatting of values for both the parent and the child tables
    * the implementation can be used For Fetching Tables along with their Parent and Child Table Related Information
    * First we check if a Parent Primary key has been passed to fetch the Data,
        If the Parent Primary Key has been passed, then we First fetch the Necessary Details Associated with the Important Primary key (In a sequence)
        and then we use Table Iterator to fetch Data in bulk Associate with the Implementation.
    * What Attributes does the Customization Object Accept and what purpose does Each of the Involved Attribute Serve?
        //@todo : Write a Detailed Description as to which parameters are accept by the Customization Object
*/
exports.getMultipleTableIterator = function(table, primary_key, customization, child_tables, callback){

        var child_tables_to_fetch = [];
        child_tables.forEach(function(child_table_details){
            child_tables_to_fetch.push(child_table_details.table_name)
        });
        var conditions = {
            includedTables: child_tables_to_fetch
        };

        //If a request is made to fetch the child table count OR Child table condition key count, then we need to iterate the child table with the primary key and fetch the count..
        if(customization.parent_index_filter){

            exports.getOneIndexIterator(customization.parent_index_filter.table_name, customization.parent_index_filter.index, customization.parent_index_filter.value, [], null, function(err, important_primary_result){
                if(err) return callback(err);
                if(Object.keys(important_primary_result).length < 1){
                    return callback({
                        code : 0,
                        message : customization.parent_index_filter.message
                    });
                }
                tableIterator(table, important_primary_result, conditions, child_tables, customization, callback);
            })

        }else{

            tableIterator(table, primary_key, conditions, child_tables, customization, callback);

        }

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
        if(table_details.data && table_details.data.constructor === Array){

            async.each(table_details.data, function(row, callback){
                exports.putData(parent_details, table_details.table_name, row, callback)
            }, function(err){
                callback(err);
            })

        }else{
            exports.putData(parent_details, table_details.table_name, table_details.data, callback)
        }

    }, function(err){
        callback(err);
    })
    })

};

/**
* Function to create a Entry if Not Record Found Based on Index
*/
exports.findOrCreateIndexIterator = function(table, index, condition, primary_key, data, child_tables, callback){

       exports.getOneIndexIterator(table, index, condition, [], null, function(err, result){

        if(err) return callback(err);
        console.log("The Result Received is : ", result)
        if(result && Object.keys(result).length > 0) return callback(null, false);
        store.put(table, data, function(err){
            if(err) return callback(err)
            async.each(child_tables, function(table_details, callback){
                var parent_details = {};
                primary_key.forEach(function(single_primary_key){
                console.log("Setting the Primary key as : ", single_primary_key);
                     parent_details[single_primary_key] = data[single_primary_key]
                })
                if(table_details.data && table_details.data.constructor === Array){

                    async.each(table_details.data, function(row, callback){
                        exports.putData(parent_details, table_details.table_name, row, callback)
                    }, function(err){
                        callback(err);
                    })

                }else{
                    exports.putData(parent_details, table_details.table_name, table_details.data, callback)
                }

            }, function(err){
                callback(err, true);
            })
            })
       })

};

/**
* Function to Perform Update Operations associated with the Database
*/
exports.updateDataWithChild = function(table, primary_key, data, child_tables, callback){

    exports.getOneTableIterator(table, {
        [primary_key] : data[primary_key]
    }, child_tables, null, function(err, result){
            if(err) return callback(err);
            store.put(table, Object.assign(result, data), function(err){

                if(err) return callback(err)
                async.each(child_tables, function(table_details, callback){

                    var parent_details = {};
                    primary_key.forEach(function(single_primary_key){
                         parent_details[single_primary_key] = data[single_primary_key]
                    })

                    if(table_details.data && table_details.data.constructor === Array){

                        async.each(table_details.data, function(entry, callback){
                            exports.putData(parent_details, table_details.table_name, entry, callback)
                        }, function(err){
                            if(err) return callback(err);
                            callback(null);
                        })
                    }else if(result[table_details.table_name] && result[table_details.table_name][0]!== undefined && !table_details.create){
                        exports.putData(parent_details, table_details.table_name, Object.assign(result[table_details.table_name][0], table_details.data), callback)
                    }
                    else if(table_details.create_if_absent || table_details.create){
                        exports.putData(parent_details, table_details.table_name, table_details.data, callback);
                    }
                    else callback(null);

                }, function(err){
                    callback(err);
                })

            })
    })

};


/*Currently The Function Below just supports updates one level done the Relationship heirchy*/
exports.updateDataIndexIterator = function(table, primary_key, index, condition, data, child_tables, callback){

    exports.getOneIndexIterator(table, index, condition, child_tables, null, function(err, result){

         if(err) return callback(err);
         if(Object.keys(result) < 1) return callback({
            code : 0,
            message : 'Not Found'
         });


         store.put(table, Object.assign(result, data), function(err){

             if(err) return callback(err);
             async.each(child_tables, function(table_details, callback){

                var parent_details = {};
                primary_key.forEach(function(single_primary_key){
                    parent_details[single_primary_key] = data[single_primary_key] || result[single_primary_key]
                })

                if(result[table_details.table_name] && result[table_details.table_name][0]!== undefined){
                    exports.putData(parent_details, table_details.table_name, Object.assign(result[table_details.table_name][0], table_details.data), callback)
                }
                else if(table_details.create_if_absent){
                    exports.putData(parent_details, table_details.table_name, table_details.data, callback);
                }
                else callback(null);

             }, function(err){
                 callback(err, Object.assign(result, data));
             })

         })

    })

};

/**
* Function to be used to only Update Child Tables Associated with a Parent Table
* The functionality is supported only one level down the chain of hierarchy
*/
exports.updateChildIndexIterator = function(table, primary_key, index, condition, child_tables, callback){

    exports.getOneIndexIterator(table, index, condition, child_tables, null, function(err, result){

         if(err) return callback(err);
         if(Object.keys(result) < 1) return callback({
            code : 401,
            message : 'Not Found'
         });

         async.each(child_tables, function(table_details, callback){

            var parent_details = {};
            primary_key.forEach(function(single_primary_key){
                parent_details[single_primary_key] = result[single_primary_key]
            });


                if(result[table_details.table_name] && result[table_details.table_name][0]!== undefined && !table_details.create){
                    exports.putData(parent_details, table_details.table_name, Object.assign(result[table_details.table_name][0], table_details.data), callback)
                }
                else if(table_details.create_if_absent || table_details.create){
                    exports.putData(parent_details, table_details.table_name, table_details.data, callback);
                }
                else callback(null);
         }, function(err){

             callback(err);
         })

    })

};