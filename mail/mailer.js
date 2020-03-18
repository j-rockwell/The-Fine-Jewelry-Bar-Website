const nodemailer = require('nodemailer');
const mailerhbs = require('nodemailer-express-handlebars');
const mailer = require('../config/mail');

const sendEmail = function sendEmail(email, subject, template, context) {
    const transport = nodemailer.createTransport({
        host : mailer.host,
        secure : true,
        port : 465,
        auth : {
            user : mailer.user,
            pass : mailer.pass
        }
    });

    transport.verify((err, success) => {
        if (err) {
            console.log(err);
            return;
        }

        console.log('Connection to Amazon SES Transporter was successful');

        const hbsOptions = {
            viewEngine : {
                extname : '.handlebars',
                layoutsDir : 'mail/layouts/',
                defaultLayout : 'main',
                partialsDir : 'mail/partials/'
            },
    
            viewPath : 'mail/views/',
            extName : '.handlebars'
        }
        
        const options = {
            from : 'The Fine Jewelry Bar <info@thejewelrybar.com>',
            to : email,
            subject : subject,
            template : template,
            context : context,
            cc : 'business@thejewelrybar.com, john@thejewelrybar.com'
        }
    
        transport.use('compile', mailerhbs(hbsOptions));
        
        transport.sendMail(options, (err, res) => {
            if (err) {
                console.log('ERROR: ');
                console.log(err);
            }
            
            transport.close();
        });
    });
}

module.exports = {
    sendEmail : sendEmail
}