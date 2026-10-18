export const errRes = ({ msg = "error", statusCode = 500 , options }) =>{
   
    throw new Error(msg,{
        cause:{
            statusCode,
            options
        }
    });
}