import express from "express";
import chalk from "chalk";
import userRouter, { routes as userRoutes } from "./modules/user/user.controller.js";
import { DBconnection } from "./DB/DB.connection.js";
import cors from "cors";

const bootstrap = async ()=>{
    const app = express()
    app.use(cors({
        origin: "*",
    }))
    app.use(express.json());
    await DBconnection()

    app.use("/uploads",express.static("./uploads"))
    app.use(userRoutes.base, userRouter)
    

    app.use((err, req, res, next)=>{
        const statusCode = err.cause?.statusCode || 500

        res.status(statusCode).json({
            errMsg: err.message,
            status: statusCode,
            errOptions: err.cause?.options
        })
    })

    app.listen(process.env.PORT,()=>{
        console.log(chalk.green("Server Is Running ...."));  
    })
    
}




export default bootstrap