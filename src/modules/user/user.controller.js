import { Router } from "express";
import { successRes } from "../../utils/success.res.js";
import { StatusCodes } from "http-status-codes";
import { loginService, signupService } from "./user.services.js";
const router = Router()

export const routes ={
    base: "/users",
    signup: "/signup", //post
    login: "/login" //post
}


router.post(routes.signup, async (req, res) => {
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







export default router