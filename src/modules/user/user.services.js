import userModel from "../../DB/models/user.model.js";
import { errRes } from "../../utils/error,handle.js";
import jwt from "jsonwebtoken";

export const signupService = async ({fullName, email, password, gender, phone, bio, age, userName})=>{
   const isExist = await userModel.findOne({
        $or:[
            {email},
            {userName}
        ]
   })
   if (isExist) {
        errRes({
            msg : `${isExist.email == email ? "Email" : "UserName"} Already Exist`,
            statusCode: 400
        })
   }
   
   const user = await userModel.create({
         fullName, email, password, gender, phone, bio, age, userName
   })
   return {
        data : {
            user
        }
   }
   
   
    // const [isEmailExist, isUserNameExist] = await Promise.all([
    //     userModel.findOne({email}),
    //     userModel.findOne({userName})
    // ])
    // if (isEmailExist || isUserNameExist) {
    //     errRes({
    //         msg: `${isEmailExist ? "email" : "userName"} already exist`,
    //         statusCode: 400
    //     })
    // }
} 


export const loginService = async ({identifier, password})=>{
    const user = await userModel.findOne({
        $or:[
            {email : identifier},
            {userName : identifier},
        ]
    })
    if (!user) {
        errRes({
            msg:"invalid credentials",
            statusCode:400
        })
    }
    if (user.password != password) {
        errRes({
            msg:"invalid credentials",
            statusCode:400
        })
    }
    const accessToken = jwt.sign({
        _id: user._id,
        email: user.email
    },"accesstoken_;jvleflbf")

    return{
        data:{
            accessToken
        }
    }
}