/*Formats the Error Response Being Sent Out to the Client to a specific Standard being Followed in the platform*/
exports.formatErrorResponse = function(code, err_message, callback){

    callback({
        success : false,
        errorCode : code,
        errors : [err_message]
    })

};

exports.formatSuccessResponse = function(data, callback){
    callback({
        success : true,
        data : Object.assign(data, {
            success : 1
        })
    })
};

exports.formatSuccessResponseStandard = function(res_locals, data, callback){

     callback(Object.assign({
            success : true,
            data : Object.assign(data, {
                success : 1
            })
        }, res_locals.token && {
            token : res_locals.token
        }))

};


exports.jsonParse = function(data, callback){

    if(data) {
        try {
            content = JSON.parse(data);
            callback(null, content);
        } catch(e) {
            callback("Provide JSON In String Format");
            //alert(e); // error in the above string (in this case, yes)!
        }
    }else callback(null, {});

}

exports.jsonParseSync = function(data){

    if(data) {
            try {
                content = JSON.parse(data);
               return content;
            } catch(e) {
                return false;
            }
        }else return({});

}

/**
* Function to be used to sort Result Set in a sequence
*/
exports.sortBySequence = function(sort_sequence, key, data){

            /*Less than 0: Sort "a" to be a lower index than "b"
               Zero: "a" and "b" should be considered equal, and no sorting performed.
               Greater than 0: Sort "b" to be a lower index than "a".
            */

            return data && data.sort(function(a, b){

                if(sort_sequence.indexOf(b[key]) === -1) return -1;
                if(sort_sequence.indexOf(a[key]) === -1) return 1;
                return sort_sequence.indexOf(a[key]) - sort_sequence.indexOf(b[key])

            });

}