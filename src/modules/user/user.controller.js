import { Router } from "express";
import { successRes } from "../../utils/success.res.js";
import { StatusCodes } from "http-status-codes";
import { confirmEmail, forgetPassSendOtp, googleLogin, loginService, logOut, logOutFromAllDevices, refreshToken, resendConfirmEmailOtp, resetPassword, signupService } from "./user.services.js";
import { auth, authorization } from "../../middlewares/auth.middleware.js";
import { RoleEnum } from "../../DB/models/user.types.js";
import { resetPasswordSchema, signUpSchema } from "./user.validation.js";
import { validation } from "../../middlewares/validation.middleware.js";
import multer from "multer";
import { uploadFile } from "../../utils/multer.js";
const router = Router()

export const routes ={
    base: "/users",
    signup: "/signup",              //post
    login: "/login",                //post
    me: "/me" ,                     //get
    refreshToken: "/refresh-token", //post
    googleSignUp: "/signup/gmail",  //post
    confirmEmail: "/confirm-email", //patch
    forgetPassword:"/forget-password",//patch
    resetPassword:"/reset-password",//patch
    uploadFile: "/upload-file",     //get
    resendConfirmEmailOtp : "/resend-confirm-otp", //post
    logOutFromAllDevices:"/logout-from-all-devices",//post
    logOutFromOneDevice:"/logout-from-one-device",//post

}


router.post(routes.signup, validation(signUpSchema), async (req, res) => {
   const {data} = await signupService(req.body)
   return successRes({
    res,
    status: StatusCodes.CREATED,
    data,
    msg: "created"
   })
})

router.post(routes.login, async (req, res)=>{
    const {identifier, password} = req.body
    const { data } = await loginService({identifier,password})
    return successRes({res,data})
})

router.get(routes.me, auth, authorization(RoleEnum.user) ,async (req, res)=>{
    
    const user = req.user
    successRes({res,data: {user}})    
})

router.post(routes.refreshToken, async (req, res)=>{
    const authorization = req.headers.authorization
    const {data} = await refreshToken(authorization)

    successRes({res,data})
})

router.post(routes.googleSignUp, async (req, res)=>{
    const {data} = await googleLogin(req.body.idToken)
    successRes({res, data})
})

router.patch(routes.confirmEmail, async (req, res)=>{
    const {email, otp} = req.body
    const {data} = await confirmEmail(email, otp)

    successRes({
        res,
        data
    })
})

router.patch(routes.forgetPassword , async ( req , res ) => {
    const {email} = req.body

    await forgetPassSendOtp(email)

    return successRes({
        res,
        msg:"otp sent to email if exist"
    })
})

router.patch(routes.resetPassword,validation(resetPasswordSchema), async (req, res) => {
    const {email, otp, password} = req.body

    await resetPassword(email, otp, password)

    successRes({res})
})


router.get(routes.uploadFile, auth, uploadFile("users").single("image"), async (req, res) => {
    console.log({
        body: req.body,
        files: req.file
    });
    req.user.profileImage = req.file.path
    await req.user.save()
    

    successRes({res})
})

router.post(routes.resendConfirmEmailOtp, async (req, res) => {
    const {email} = req.body
    const {data} = await resendConfirmEmailOtp(email)

    successRes({res, data})
})

router.post(routes.logOutFromAllDevices, auth, async(req, res) => {
    const userId = req.user._id
    await logOutFromAllDevices(userId)

    return successRes({res})
})

router.post(routes.logOutFromOneDevice, auth, async(req, res) => {
    const userId = req.user._id
    const jti = req.jti 
    await logOut(userId,jti)

    return successRes({res})
})



export default router