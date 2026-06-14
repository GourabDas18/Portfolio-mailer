const express = require('express');
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
                            if (!process.env.RESEND_API_KEY) {
                                console.error("Error: RESEND_API_KEY is not defined.");
                                return res.status(500).send("Server configuration error.");
                            }

                            const response = await fetch('https://api.resend.com/emails', {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    from: 'Portfolio Contact <onboarding@resend.dev>',
                                    to: 'dasgrb18@gmail.com',
                                    subject: `Message from ${name} on portfolio website`,
                                    html: `
                                        <h2>Message from ${name}</h2><br>
                                        <p>Mail id: ${from}</p><br>
                                        <b>${message}</b>
                                    `
                                })
                            });

                            const resData = await response.json();

                            if (response.ok) {
                                console.log('Email sent successfully:', resData);
                                res.status(200).send('Mail sent succesfully');
                            } else {
                                console.error('Resend API error:', resData);
                                res.status(400).send('Error ! Try again');
                            }
                        }
                    } catch (error) {
                        console.error('Processing error:', error);
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

