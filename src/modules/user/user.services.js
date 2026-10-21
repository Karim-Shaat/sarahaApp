import userModel from "../../DB/models/user.model.js";
import {decodeToken, tokenEnum} from "../../middlewares/auth.middleware.js";
import { errRes } from "../../utils/error,handle.js";
import jwt from "jsonwebtoken";
import { compareHash, createHash } from "../../utils/security/hash.js";
import { OAuth2Client } from "google-auth-library";
import { ProviderEnum } from "../../DB/models/user.types.js";
import { random } from "../../utils/email/createOTP.js";
import { sendEmail } from "../../utils/email/sendEmail.js";
import { emailTemplate } from "../../utils/email/emailTemplate.js";
import { email } from "zod";
const googleClient = new OAuth2Client()


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

   const otp = random(6)
   await sendEmail({
    to: email,
    subject: "confirm email",
    html: emailTemplate({
        otp,
        subject:"confirm email"
    })
   })
   
   const user = await userModel.create({
         fullName, 
         email, 
         password: await createHash(password), 
         gender, 
         phone, 
         bio, 
         age, 
         userName,
         otp :{
            otp
         }
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


export const googleLogin = async ( token ) => {
    const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.CLIENT_ID
    })

    const {email, name, picture} = ticket.getPayload()
    let user = await userModel.findOne({email})
    
    if (user) {
        if (user.provider != ProviderEnum.google) {
            errRes({msg:"use your provider"})
        }
    }else{
        user = await userModel.create({
            email,
            fullName: name,
            profileImage: picture,
            provider: ProviderEnum.google,
            confirmedAt: Date.now()
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
        data: {
            accessToken,
            refreshToken
        }
    }
}

export const confirmEmail = async(email ,otp )=>{
    const user = await userModel.findOne({
        email,confirmedAt:{
            $exists: false
        }
    })
    if (!user) {
        errRes({msg:"user not found",statusCode:404})
    }

    await checkOtp(user, otp)

    user.confirmedAt = Date.now()
    await user.save()

    return{
        data:{}
    }
}

export const forgetPassSendOtp = async (email) => {
    const user = await userModel.findOne({email})
    if (!user) {
        
        errRes({msg:"user not found",statusCode:404})
    }
    if (user.otp.expireIn > Date.now()) {
        errRes({msg:"wait 2 min to resend code"})
        
    }
    const otp = random(6)
    user.otp.otp = await createHash(otp)
    user.otp.expireIn = Date.now() + 2*60*1000
    await user.save()
    sendEmail({
        to : email,
        subject:"forget password",
        html: emailTemplate({
            otp,
            subject:"forget password"
        })
    })

    return {
        data:{}
    }

}

export const resetPassword = async (email, otp, password) =>{
    const user = await userModel.findOne({ email })
        if (!user) {
            errRes({msg:"user not found",statusCode:404})
        }
        
        await checkOtp(user, otp)

        user.password = await createHash(password)
        await user.save()
        return {
            data:{}
        }

}

export const checkOtp = async (user, otp) =>{
    if (!user.otp || user.otp.expireIn < Date.now()) {
        errRes({msg:"otp expired",statusCode:404})
    }
    if (!await compareHash(otp, user.otp.otp)) {
         errRes({msg:"in-valid otp",statusCode:400})
    }
}