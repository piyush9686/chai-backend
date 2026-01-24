//verify karega user hai ki nhi

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrror } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";


export const verifyJWT=asyncHandler(async(req, _, next)=>{
 
    
   try {                                  
    const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
 
     if(!token){ 
         throw new ApiErrror(401,"unauthorized request, token not found")
     }
 
 
    const decodedToken= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
     
   const user= await User.findById(decodedToken?._id).select("-password -refreshToken")
 
   if(!user){
     //discuss about frontend in next video
     throw new ApiErrror(401,"invalid access token, user not found")
   }
   
     req.user=user;  //attach user to request object
     next();

   } 
   
   catch (error) {
        throw new ApiErrror(401,error?.message ||"invalid or expired access token")
   }
   
   
   
      

});