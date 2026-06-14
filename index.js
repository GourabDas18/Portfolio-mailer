const express = require('express');
const nodemailer = require("nodemailer");
const cors = require('cors');
require('dotenv').config();
const app = express();
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 5 * 1000, // 15 sec
    max: 1
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://gourab.dev',
        'https://www.gourab.dev'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));
app.use('/', limiter);
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use `true` for port 465, `false` for all other ports
    auth: {
        user: "gourab.das.oct@gmail.com",
        pass: process.env.MAIL_PASS,
    },
});
app.post('/', async (req, res) => {
    try {
        const { from, name, message } = req.body;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (from !== null && emailRegex.test(from)) {
            if (name !== null && name.length > 2) {
                if (message !== null && message.length > 3) {
                    try {
                        const checkIp = await ipChecker(req.headers['x-forwarded-for']?.split(',')[0] ||
                            req.socket.remoteAddress);
                        console.log({
                            ip: req.ip,
                            remote: req.socket.remoteAddress,
                            forwarded: req.headers['x-forwarded-for']
                        });
                        if (!checkIp) {
                            return res.status(400).send('Error ! Try Again Later')
                        } else {
                            await transporter.verify();
                            console.log('SMTP Ready');
                            const info = await transporter.sendMail({
                                from: 'gourab.das.oct@gmail.com', // sender address
                                to: "dasgrb18@gmail.com", // list of receivers
                                subject: `Message from ${name} on portfolio website`, // plain text body
                                html: `
                                        <h2>Message from ${name} </h2><br>
                                        <p>Mail id: ${from} </p><br>
                                        <b>${message}</b>`, // html body
                            });
                            console.log('message sent')
                            if (info.accepted && info.accepted.length > 0) {
                                res.status(200).send('Mail sent succesfully')
                            } else {
                                res.status(400).send('Error ! Try again')
                            }
                        }


                    } catch (error) {
                        console.error('Nodemailer verification/sending error:', error);
                        res.status(400).send(`Error! try again later, ${error.message}`);
                    }
                } else {
                    res.status(400).send('Error! Too short message.')
                }
            } else {
                res.status(400).send('Error! Give proper name')
            }
        } else {
            res.status(400).send('Error ! Give a proper mail')
        }
    } catch (e) {
        res.status(400).send(e.message ?? "Error in sending mail!");
    }
})
app.listen(process.env.PORT || 5000, function () {
    console.log("SERVER RUNNING")
})

// In-memory cache for IP rate limiting
const ipCache = new Map();

const ipChecker = (ip) => {
    return new Promise((resolve) => {
        if (!ip || ip.length <= 2) {
            return resolve(false);
        }
        const now = Date.now();
        const lastTime = ipCache.get(ip);
        if (lastTime && (now - lastTime < 5000)) {
            return resolve(false);
        }
        ipCache.set(ip, now);
        return resolve(true);
    });
}

