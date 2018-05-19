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