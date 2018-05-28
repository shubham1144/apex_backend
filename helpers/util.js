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
}
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