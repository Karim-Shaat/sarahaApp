import nodemailer from "nodemailer"





export const sendEmail = async ({to, subject, html})=>{
    const transporter = nodemailer.createTransport({
        auth:{
            user: process.env.USER,
            pass: process.env.PASSWORD
        },
        service: "gmail"
    })
    

    const info = await transporter.sendMail({
        from:"Saraha App <sarahaApp@gmail.com>",
        to,
        subject,
        html
    })
    console.log(info.accepted);
    
}