import { createClient } from "redis";

export const redisClient = createClient({
    url: "redis://127.0.0.1:6379",
    database: 1
})

redisClient.on("error", (err)=> console.log("redis client error",err))
.on("connect", ()=> console.log("redis client connect"))
.connect()
