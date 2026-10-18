import { compare, hash } from "bcrypt";

export const createHash = async (password)=>{
    const generateHash = await hash(password, 10)
    return generateHash 
} 

export const compareHash = async (password, hashedPassword)=>{
    const isMatch = await compare(password, hashedPassword)
    return isMatch
}