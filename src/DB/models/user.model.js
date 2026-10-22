import { get, model, Schema } from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "./user.types.js";
import { decryption, encryption } from "../../utils/security/encryption.js";

const otpSchema = new Schema({
    code:{
        type: String,
        require: true
    },expireIn: {
        type: Date,
        default: Date.now() + 2*60*1000
    }, _id: false
})


const userSchema = new Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: function () {
            this.provider == ProviderEnum.system ? true : false
        }
    },
    phone: {
        type: String,
        set(value){
            return encryption(value)
        },
        get(value){
            return decryption(value)
        }
    },
    age: Number,
    profileImage: {
        type: String,
    },
    gender: {
        type: Number,
        enum: Object.values(GenderEnum)
    },
    provider: {
        type: Number,
        enum: Object.values(ProviderEnum),
        default: ProviderEnum.system
    },
    role: {
        type: Number,
        enum: Object.values(RoleEnum),
        default: RoleEnum.user
    },
    bio: String,
    userName: {
        type: String,
        required: function () {
            this.provider == ProviderEnum.system ? true : false
        },
        unique : true
    },
    confirmedAt: Date,
    blockedAt :Date,
    otp: otpSchema
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
            delete ret.password
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
    virtuals:{
        fullName:{
            get(){
                return this.firstName + " " + this.lastName
            },
            set(value){
                const [firstName, lastName] = value.split(" ")
                if (!firstName  || !lastName) {
                    throw new Error("in valid fullname");
                }
                this.set("firstName",firstName),
                this.set("lastName", lastName)
            }
        }
    }
})

const userModel = model("User",userSchema)

export default userModel