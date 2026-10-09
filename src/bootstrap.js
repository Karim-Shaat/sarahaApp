import express from "express";
import chalk from "chalk";
import userRouter, { routes as userRoutes } from "./modules/user/user.controller.js";
import { DBconnection } from "./DB/DB.connection.js";
import userModel from "./DB/models/user.model.js";


const bootstrap = async ()=>{
    const app = express()
    app.use(express.json());
    await DBconnection()


    //app.use(userRoutes.base, userRouter)
    // await userModel.create({
    //     fullName: "karim2shaat",
    //     email:"karim2@gmail.com",
    //     password:"123",
    //     userName:"karim2_shaat",
    //     phone:"01020962371",
    //     // firstName:"karim",
    //     // lastName:"shaat",

    // }) 

    // app.get("/", async (req,res)=>{
    //     const user = await userModel.find()
    //     res.json(user)
    // })
    // const user = await userModel.find()
    // console.log(user);
    app.use(userRoutes.base, userRouter)
    

    app.use((err, req, res, next)=>{
        const statusCode = err.cause?.statusCode || 500

        res.status(statusCode).json({
            errMsg: err.message,
            status: statusCode
        })
    })

   
    

    app.listen(process.env.PORT,()=>{
        console.log(chalk.green("Server Is Running ...."));  
    })
    
}




export default bootstrap