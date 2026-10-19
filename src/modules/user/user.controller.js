import { Router } from "express";
import { successRes } from "../../utils/success.res.js";
import { StatusCodes } from "http-status-codes";
import { confirmEmail, googleLogin, loginService, refreshToken, signupService } from "./user.services.js";
import { auth, authorization } from "../../middlewares/auth.middleware.js";
import { RoleEnum } from "../../DB/models/user.types.js";
import { signUpSchema } from "./user.validation.js";
import { errRes } from "../../utils/error,handle.js";
import { validation } from "../../middlewares/validation.middleware.js";
const router = Router()

export const routes ={
    base: "/users",
    signup: "/signup",              //post
    login: "/login",                //post
    me: "/me" ,                     //get
    refreshToken: "/refresh-token", //post
    googleSignUp: "/signup/gmail",  //post
    confirmEmail: "/confirm-email"  //patch
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



export default router