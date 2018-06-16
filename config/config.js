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
                security_file_path : '/security/local/client.security'
            }
        },
        static_file_path : "http://192.168.1.3/apex/files/avatars/",
        host : "http://localhost:3000",
        web_host : "http://localhost:3001"
    }
};

