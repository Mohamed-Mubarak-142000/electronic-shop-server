import nodemailer from 'nodemailer';
import Configuration from '../models/Configuration.js';

const sendEmail = async (options) => {
    // Fetch email configurations from database
    const configs = await Configuration.find({ group: 'email' });
    const configMap = configs.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {});

    const transporter = nodemailer.createTransport({
        host: configMap.emailHost || process.env.EMAIL_HOST,
        port: configMap.emailPort || process.env.EMAIL_PORT,
        auth: {
            user: configMap.emailUser || process.env.EMAIL_USER,
            pass: configMap.emailPassword || process.env.EMAIL_PASSWORD,
        },
    });

    const message = {
        from: `${configMap.fromName || process.env.FROM_NAME || 'Electro Shop'} <${configMap.fromEmail || process.env.FROM_EMAIL || 'noreply@electroshop.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    const info = await transporter.sendMail(message);

    console.log('Message sent: %s', info.messageId);
};

export default sendEmail;
