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
        static_file_path : "http://192.168.1.3/notify.me/files/avatars/"
    },
    local_1020 : {
        db : {
                    store_name : 'notify.me',
                    store_helper_hosts : ['192.168.1.20:5000'],
                    username : 'admin',
                    proxy : {
                        start : true,
                        host : 'localhost:7011',
                        security_file_path : '/security/local_1020/client.security'
                    }
                },
                static_file_path : "http://192.168.1.3/notify.me/files/avatars/"
    },
    development : {

    },
    production : {

    }
};