const nodemailer = require('nodemailer');
const htmlToText = require('html-to-text');

// module.exports = class EmailService {
//     constructor(user,url){
//         this.to = user.email;
//         this.firstName = user.firstName;
//         this.url = url;
//         this.from = `Food Ordering App <${process.env.EMAIL_FROM}>`;
//     }

//     newTransport(){
//         if(process.env.NODE_ENV === 'production'){
//             return 1;
//         }

//         return nodemailer.createTransport({
//         host :process.env.EMAIL_HOST,
//         port : process.env.EMAIL_PORT,
//         auth : {
//             user : process.env.EMAIL_USERNAME,
//             pass : process.env.EMAIL_PASSWORD
//         }
//     });
//     }

//     async send(template,subject){

//         const html = `<html>
//         <body>
//             <h1>${subject}</h1>
//             <p>Dear ${this.firstName},</p>
//             <p>Welcome to the Food Ordering App! Please click the link below to get started:</p>
//             <a href="${this.url}">Get Started</a>
//             <p>Best regards,<br/>Food Ordering App Team</p>
//         </body>
//         </html>`;


//         const mailOptions = {
//         from:this.from,
//         to: this.to,
//         subject: subject,
//         html: html,
//         text:htmlToText.fromString(html)
//     };

//     await this.newTransport().sendMail(mailOptions);

//     }

//     async sendWelcome(){
//        await this.send('welcome','Welcome to the food ordering app!');
//     } 
// }


const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host :process.env.EMAIL_HOST,
        port : process.env.EMAIL_PORT,
        auth : {
            user : process.env.EMAIL_USERNAME,
            pass : process.env.EMAIL_PASSWORD
        }
    });

    const mailOptions = {
        from:'food ordering app <noreply@foodordering.com>',
        to: options.email,
        subject: options.subject,
        text: options.message
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;