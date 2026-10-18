import z from "zod";
import { GenderEnum } from "../../DB/models/user.types.js";




export const signUpSchema ={ 
    body: z.strictObject({
        fullName: z.string(),
        email: z.email(),
        phone: z.string().min(10).max(14),
        password: z.string(),
        age: z.number().optional(),
        gender: z.enum(GenderEnum),
        userName: z.string(),
        bio: z.string().optional()
    }),
    query: z.strictObject({
        id: z.string()
    })
}


