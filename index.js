const express = require('express');
const nodemailer = require("nodemailer");
const cors = require('cors');
require('dotenv').config();
const app = express();
const jsonfile = require('jsonfile')
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cors({origin:'http://localhost:5173',preflightContinue:false}));
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: "gourab.das.oct@gmail.com",
      pass: process.env.MAIL_PASS,
    },
  });
app.post('/',async (req,res)=>{
    const {from,name,message}=req.body;
    if(from!== null && from.includes('@') && from.length>7){
        if(name!== null && name.length>2){
            if(message!==null && message.length>3){
              try {
               const checkIp= await ipChecker(req.socket.remoteAddress);
               if(!checkIp){
                res.status(400).send('Error ! Try Again Later')
               }else{
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
                  if(info.accepted){
                    res.status(200).send('Mail sent succesfully')
                  }else{
                    res.status(400).send('Error ! Try again')
                  }
               } 
               
                
              } catch (error) {
                res.status(400).send('Error! try again later');
              }
            }else{
                res.status(400).send('Error! Too short message.')
            }
        }else{
            res.status(400).send('Error! Give proper name')
        }
    }else{
        res.status(400).send('Error ! Give a proper mail')
    }
})
app.listen(process.env.PORT|5000,function(){
    console.log("SERVER RUNNING")
})

const ipChecker=(ip)=>{
    console.log(ip)
    return new Promise((res,rej)=>{
        if(!ip && !ip.length>2) res(false);
        jsonfile.readFile('./req.json',(err,obj)=>{
            if(err) res(false);
            const data = obj;
            const dataFound=[];
            data.list.forEach(element => {
                if(element.ip===ip){dataFound.push(element)}
            });
            const date=new Date().getTime();
            if(dataFound.length>0){
                if(dataFound[dataFound.length-1].time<date-15000){
                    data.list.push({
                        'ip':ip,
                        'time': date
                    })
                    jsonfile.writeFile('./req.json',data)
                    .then(()=>{
                        res(true);
                    })
                    .catch((err)=>{
                        res(false);
                    })
                }
            }else{
                data.list.push({
                    'ip':ip,
                    'time': date
                })
                jsonfile.writeFile('./req.json',data)
                .then(()=>{
                    res(true);
                })
                .catch(()=>{
                    res(false);
                })
            }
        })
    })
   
}

