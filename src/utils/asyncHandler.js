//method and export it

//Promise
const asyncHandler= (requestHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).
        catch((error)=>next(error))
    }
}

export { asyncHandler }

//function ko paramet me lenge "fn means"       try catch me wrap krdenge
// const asyncHandler= (fn)=> async(req,res,next)=>{
//     try{
//      await fn(req,res,next)
//     }
//     catch(error){
//         res.status(error.code || 500).json({
//             success:false,
//             message:error.message
//         })

//     }
// }

