/* Configuration file associated with the project that will consist of all the configurations associated the project*/
module.exports = {
    local : {
        db : {
            store_name : 'notify.me',
            store_helper_hosts : ['localhost:5000'],
            username : 'admin',
            proxy : {
                start : true,
                host : 'localhost:7010',
                security_file_path : './../notify_me_database/security/client.security'
            }
        }
    },
    development : {

    },
    production : {

    }
};