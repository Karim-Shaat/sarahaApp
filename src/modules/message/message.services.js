import messageModel from "../../DB/models/massage.model.js"
import userModel from "../../DB/models/user.model.js"
import { errRes } from "../../utils/error,handle.js"


export const sendMessage = async(content ,images, to)=>{
    const user = await userModel.findById(to)
    if (!user) {
        errRes({
            msg:"user not found",
            statusCode:404
        })
    }
    const message = await messageModel.create({
        content,
        images,
        to
    })



    return {
        data:{
            message
        }
    }
}