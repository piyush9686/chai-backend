import { asyncHandler } from "../utils/asyncHandler.js";

import {ApiErrror} from "../utils/ApiError.js"

import {User} from "../models/user.models.js"

import{uploadOnCloudinary} from "../utils/cloudinary.js"

import {ApiResponse} from "../utils/ApiResponse.js";

import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const registerUser=asyncHandler(async(req,res)=>{
    //get user detais from frontend
    //validation (correcet fromat ,not empty)
    //check if users alredy exists:  username or bt email
    //check fir image ,check for avatar
    //upload them to cloudinary,,  cheakin avatar
    //creat user object- creafe entry in db
    //remove password and refersh token field from response
    //check fro user creation
    //return res


    const {fullname,email,username,password}=req.body
    //console.log("email",email);

    if(
       [fullname,email,username, password].some((field)=>   //some true return krdega
        field?.trim() ==="")
      
     ) {
        throw new ApiErrror(400,"all fields are required")
     }


 
 const existedUser=  await User.findOne({          //step 3 
    $or:[ { username },{ email }]
})     
   if(existedUser){
    throw new ApiErrror (409,"User already exists with this username or email")
   }
   
   

 //step 4
 const avatarLocalPath= req.files?.avatar[0]?.path;
 //const coverImageLocalPath= req.files?.coverImage[0]?.path;

 let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath= req.files.coverImage[0].path;
    }


 
 //console.log("avatarLocalPath",avatarLocalPath);

 if(!avatarLocalPath){ 
    throw new ApiErrror(400, "avatar files is required") 
 }
 
 //step 5
    const avatar= await uploadOnCloudinary(avatarLocalPath);
   const coverImage= await uploadOnCloudinary(coverImageLocalPath);

    
    if(!avatar){     //avatar is required so we are checking its gone or not
        throw new ApiErrror(400, "avatar files is required")
    }



  //step 6   user talk with db
  
    const user= await User.create({
        fullname,
        email,
        username: username.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password
    })
   const createdUser= await user.findById(user._id)
    .select("-password -refreshToken ")          //ky ky nahi chaiye  so we remove password and refresh token as per step 7 

    if(!createdUser){ //check for user creation step 8
        throw new ApiErrror(500,"something went wrong while registering  the user")
    }
   

    //step 9
    return res.status(201).json(
        new ApiResponse(201,createdUser,"user registered successfully")
    )


})


export {registerUser} 