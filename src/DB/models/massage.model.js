import { model, Schema, Types } from "mongoose";


const messageSchema = new Schema(
    {
        content:{
            type: String,
            require: function () {
                return this.images?.length? false : true
            }
        },
        images:{
            type: [String]
        },
        to:{
            type: Types.ObjectId,
            require: true,
            red: "User"
        }
    },
    {
        timestamps: true,
        strict: true,
        strictQuery: true,
        optimisticConcurrency: true,
        toJSON:{
            virtuals: true,
            getters: true,
            transform(doc,ret){
                delete ret.id
                return ret
            }
        },
        toObject:{
            virtuals: true,
            getters: true,
            transform(doc,ret){
                delete ret.id
                return ret
            }
        },
    }
)

export const messageModel = model("message",messageSchema)

export default messageModel