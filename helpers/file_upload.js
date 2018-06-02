var multer = require('multer');

/*Function to be used to upload a single File Using Multer*/
exports.uploadSingleFile = function(req, res, details, callback){

        var storage = multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, details.destination)
            },
            filename: function (req, file, cb) {
                cb(null, details.file_name)
            }
        }), upload = multer({ storage: storage })

        upload.single(details.key)(req, res, callback);

};