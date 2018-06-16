/**
    *@Description This module is to be used to send out emails
    *@module Email
*/
const nodemailer = require('nodemailer');

var smtpConfig = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: 'PROVIDE USERNAME HERE',
        pass: 'PROVIDE PASSWORD HERE'

    }
};

exports.sendEmail = function(mailOptions, callback){

// setup email data with unicode symbols
    let transporter = nodemailer.createTransport(smtpConfig);
    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(err, result){
        if(err) console.error("Error Occued While Sending Email due to : ", err);
        console.log("Email Sent Out Successfully")
    });
    callback(null);
};
