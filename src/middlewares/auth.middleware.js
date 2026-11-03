import jwb from "jsonwebtoken";
import { errRes } from "../utils/error,handle.js";
import userModel from "../DB/models/user.model.js";
import { redisClient } from "../DB/redis.connect.js";
import { userSessionJwtIdKay } from "../utils/redis.servieces.js";

export const tokenEnum = {
    access: "access",
    refresh: "refresh"
}



export const auth = async(req, res, next)=>{

    const {user, jti} = await decodeToken({authorization : req.headers.authorization})
    req.user = user
    req.jti = jti
    next()
}


export const decodeToken = async ({authorization, tokenType = tokenEnum.access})=>{
     

    if (!authorization || !authorization.startsWith("Bearer")) {
        errRes({msg : "in-valid----token",statusCode:401})
    }

    const token = authorization.split(" ")[1]
    const payload = jwb.verify(token,
        tokenType == tokenEnum.access ?
        process.env.ACCESS_TOKEN_SECRET :
        process.env.REFRESH_TOKEN_SECRET 
    )
    const user = await userModel.findById(payload._id)
    if(!user){
        errRes({msg:"user mot found", statusCode: 404})
    }
    if(!user.confirmedAt){
        errRes({msg: "confirm first",statusCode: 401})
    }
    const { jti } = payload
    if(!jti){
        errRes({
            msg:"in-valid token",
            statusCode:400
        })
    }
    const redisJti = await redisClient.get(userSessionJwtIdKay(user._id, jti))
    if(!redisJti){
        errRes({msg:"logged out login again", statusCode: 400})
    }

    return {
        user,
        jti
    }
}


export const authorization = ( ... roles) =>{
    return (req, res, next)=>{
        if (!roles.includes(req.user.role)) {
            errRes({
                msg:"unAuthorized",
                statusCode:401
            })
        }

        next()
    }
}