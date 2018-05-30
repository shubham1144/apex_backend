

/*
    *API Interface to Function that will be used to fetch details associated with a user
*/
exports.fetchUser = function(req, res){

    fetchUserDetails(req.user.user_id, res.locals, function(result){
        res.send(result)
    })

}