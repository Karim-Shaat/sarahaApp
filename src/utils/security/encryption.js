import crypto from "node:crypto";
import { errRes } from "../error,handle.js";


const secretKey = Buffer.from("f,f,f,f,f,f,f,f,f,f,f,f,f,f,f,f,")
export const encryption = (data)=>{
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv("aes-256-cbc", secretKey, iv)
    let cipherText = cipher.update(data, "utf-8", "hex")
    cipherText += cipher.final("hex")

    return `${iv.toString("hex")}:${cipherText}`
    
}


export const decryption = (encryptedValue)=>{
    const [ iv , cipherText ] = encryptedValue.split(":")
    if (!iv || !cipherText) {
        errRes({msg:"in-valid encrypted value"})
    }
    const binaryIv = Buffer.from(iv,"hex")
    const decipher = crypto.createDecipheriv("aes-256-cbc", secretKey, binaryIv)
    let plainText = decipher.update(cipherText, "hex", "utf-8")
    plainText += decipher.final("utf-8")

    return plainText
}