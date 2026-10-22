import z, { email } from "zod";
import { GenderEnum } from "../../DB/models/user.types.js";




export const signUpSchema ={ 
    body: z.strictObject({
        fullName: z.string(),
        email: z.email(),
        phone: z.string().min(10).max(14),
        password: z.string(),
        confirmPassword: z.string(),
        age: z.number().optional(),
        gender: z.enum(GenderEnum),
        userName: z.string(),
        bio: z.string().optional()
    }).refine((arg)=>arg.password == arg.confirmPassword,{
        error:"password mismatch",
        path: ["password","confirmPassword"]
    })
//     query: z.strictObject({
//        id: z.string()
//     })
}

export const resetPasswordSchema = {
    body: z.strictObject({
        email: z.email(),
        otp: z.string().min(6).max(6),
        password:z.string(),
        confirmPassword:z.string()
    }).refine((arg)=>arg.password == arg.confirmPassword,{
        error:"password mismatch",
        path: ["password","confirmPassword"]
    })
}


