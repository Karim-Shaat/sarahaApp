export const errRes = ({ msg = "error", statusCode = 500 }) =>{
   
    throw new Error(msg,{
        cause:{
            statusCode
        }
    });
}