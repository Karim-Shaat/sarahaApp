import userModel from "../../DB/models/user.model.js";
import {decodeToken, tokenEnum} from "../../middlewares/auth.middleware.js";
import { errRes } from "../../utils/error,handle.js";
import jwt from "jsonwebtoken";
import { compareHash, createHash } from "../../utils/security/hash.js";
import { encryption } from "../../utils/security/encryption.js";

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
         fullName, email, password: await createHash(password), gender, phone : encryption(phone), bio, age, userName
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
    const isPasswordMatch = await compareHash(password, user.password) 
    if (!isPasswordMatch) {
        errRes({
            msg:"invalid credentials",
            statusCode:400
        })
    }
    const accessToken = jwt.sign({
        _id: user._id,
        email: user.email
    },process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:"10S"
    })
    const refreshToken = jwt.sign({
        _id: user._id,
        email: user.email
    },process.env.REFRESH_TOKEN_SECRET,{
        expiresIn: "7d"
    })

    return{
        data:{
            accessToken,
            refreshToken
        }
    }
}


export const refreshToken = async (authorization)=>{
  const { user } = await decodeToken({authorization , tokenType : tokenEnum.refresh})
  const accessToken = jwt.sign({
    _id: user._id,
    email : user.email
  },process.env.ACCESS_TOKEN_SECRET,{
    expiresIn:"10S"
  })

  return {
    data:{
        accessToken
    }
  }
}