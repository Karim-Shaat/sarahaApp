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
import { 
    attemptBlockCountKay, 
    attemptBlockKay, 
    attemptsKay, 
    confirmEmailKay, 
    resendOtpKay, 
    userPrefixKay,
    userSessionJwtIdKay,
    userSessionJwtIdPrefixKay
} from "../../utils/redis.servieces.js";
import { redisClient } from "../../DB/redis.connect.js";
import { nanoid } from "nanoid";

const googleClient = new OAuth2Client()

const calcBlockSecs = (count)=>{
    const BlockMinArr = [5, 15, 60, 300, 1440]
    const index = Math.min(count, BlockMinArr.length) 
    return BlockMinArr[index - 1] * 60
}


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
         userName    
   })

   const redisKay = confirmEmailKay(user._id)
   await redisClient.set(redisKay, await createHash(otp), {
    expiration:{
        type:"EX",
        value: 5 * 60
    }
   })
   await redisClient.set(resendOtpKay(user._id), 0, {
    expiration:{
        type:"EX",
        value: 1 * 60
    }
   })
   await redisClient.incr(attemptsKay(user._id))

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
    const jwtid = nanoid()
    const accessToken = jwt.sign({
        _id: user._id,
        email: user.email,
    },process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:"60S",
        jwtid
    })
    const refreshToken = jwt.sign({
        _id: user._id,
        email: user.email,
    },process.env.REFRESH_TOKEN_SECRET,{
        expiresIn: "7d",
        jwtid
    })
    await redisClient.set(userSessionJwtIdKay(user._id,jwtid), jwtid,{
        expiration:{
            type:"EX",
            value: 7 * 24 * 60 * 60
        }
    } )

    return{
        data:{
            accessToken,
            refreshToken
        }
    }
}


export const refreshToken = async (authorization)=>{
  const { user, jti } = await decodeToken({authorization , tokenType : tokenEnum.refresh})
  const accessToken = jwt.sign({
    _id: user._id,
    email : user.email
  },process.env.ACCESS_TOKEN_SECRET,{
    expiresIn:"60S",
    jwtid: jti
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

export const resendConfirmEmailOtp = async (email) =>{
    const user = await userModel.findOne({
        email, confirmedAt:{
            $exists: false
        }
    })
    if (!user) {
        errRes({
            msg:"user not found",
            statusCode: 404
        })
    }
    const userId = user._id
    const cannotResend = (await redisClient.get(resendOtpKay(userId)) 
    || await redisClient.get(attemptBlockKay(userId)))
    if (cannotResend) {
        errRes({msg:"wait",statusCode:400})
    }
    const attempts = await redisClient.incr(attemptsKay(userId))
    if (attempts >= 5) {
        const blockCount = await redisClient.incr(attemptBlockCountKay(user._id))
        await redisClient.set(attemptBlockKay(user._id),0,{
            expiration:{
                type:"EX",
                value: calcBlockSecs(blockCount)
            }
        })
        await redisClient.set(attemptsKay(user._id), 0)
    }else{
        await redisClient.set(resendOtpKay(user._id), 0, {
        expiration:{
            type:"EX",
            value: 1 * 60
        }
       })
    }
    const otp = random(6)
    await sendEmail({
        to: email,
        subject: "confirm email",
        html: emailTemplate({otp, subject:"confirm email"})
    })
   const redisKay = confirmEmailKay(user._id)
   await redisClient.set(redisKay, await createHash(otp), {
    expiration:{
        type:"EX",
        value: 5 * 60
    }
   })

   return {
    data:{

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

    // await checkOtp(user, otp)

    const hashedOtp = await redisClient.get(confirmEmailKay(user._id))
    if (!hashedOtp) {
        errRes({msg: "invalid or expire otp"})
    }
    const isBlocked = await redisClient.get(attemptBlockKay(user._id))
    if (isBlocked) {
        const blockedTtl = await redisClient.ttl(attemptBlockKay(user._id))
        errRes({msg:`try again after ${Math.round(blockedTtl / 60)}min` , statusCode:400})
    }
    const isOtoCorrect = await compareHash(otp, hashedOtp)
    if (!isOtoCorrect) {
        const attempts = await redisClient.incr(attemptsKay(user._id))
        if (attempts >= 5) {
            const blockCount = await redisClient.incr(attemptBlockCountKay(user._id))
            await redisClient.set(attemptBlockKay(user._id),0,{
                expiration:{
                    type:"EX",
                    value: calcBlockSecs(blockCount)
                }
            })
            await redisClient.set(attemptsKay(user._id), 0)

            errRes({
                msg:`try again after ${Math.round(calcBlockSecs(blockCount) / 60)}min`, 
                statusCode:400
            })
        }
    }else{
        user.confirmedAt = Date.now()
        await user.save()
        const userKeys = await redisClient.keys(`${userPrefixKay(user._id)}*`)
        await redisClient.del(userKeys)
    }






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
    user.otp.code = await createHash(otp)
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
        
        // await checkOtp(user, otp)





        user.password = await createHash(password)
        await user.save()
        return {
            data:{}
        }

}

export const logOut = async (userId, jti) => {
    const user = await userModel.findById(userId)
    if(!user){
        errRes({msg:"user not found",statusCode:404})
    }
    const deleteCount = await redisClient.del(userSessionJwtIdKay(userId, jti))
    if (deleteCount < 1) {
        errRes({
            msg:"logged out already",

        })
    }

    return {
        data:{

        }
    }
}

export const logOutFromAllDevices = async (userId) => {
    const user = await userModel.findById(userId)
    if(!user){
        errRes({msg:"user not found",statusCode:404})
    }
    const kays = await redisClient.keys(`${userSessionJwtIdPrefixKay(userId)}:*`) 
    console.log(kays);
    
    const deleteCount = await redisClient.del(kays)
    if (deleteCount < 1) {
        errRes({
            msg:"logged out already",

        })
    }

    return {
        data:{
            
        }
    }
}