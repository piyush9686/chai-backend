import { asyncHandler } from "../utils/asyncHandler.js";

import {ApiErrror} from "../utils/ApiError.js"

import {User} from "../models/user.models.js"

import{uploadOnCloudinary} from "../utils/cloudinary.js"

import {ApiResponse} from "../utils/ApiResponse.js";

import jwt from "jsonwebtoken";
import mongoose from "mongoose";



// generate access and refresh tokens bec we will use this  many times so we creat it in a method
const generateAccessAndRefreshTokens= async(userId)=>
{
    try{
         const user=await User.findById(userId)
         const accessToken=user.generateAccessToken()
         const refreshToken= user.generateRefreshToken()  //db mai bi save karte hai kuki bar bar password na karna pade

         user.refreshToken= refreshToken           //db mai save karna hai
            await user.save({ validateBeforeSave:false })  //password hash na ho save karte time;


            return { accessToken, refreshToken }
    }
    catch{
        throw new ApiErrror (500,"something went wrong while generating  R&A tokens")
    }
}
   


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
    console.log("email",email);

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
   const createdUser= await User.findById(user._id)
    .select("-password -refreshToken ")          //ky ky nahi chaiye  so we remove password and refresh token as per step 7 

    if(!createdUser){ //check for user creation step 8
        throw new ApiErrror(500,"something went wrong while registering  the user")
    }
   

    //step 9
    return res.status(201).json(
        new ApiResponse(201,createdUser,"user registered successfully")
    )


})

const loginUser=asyncHandler(async(req,res)=>{
    //dats from frontend
    //usename and password
    //find user by 
    //password match
    // access token and refresh token
    //send cookie in response
    

    const {email, username, password }= req.body;
    
    if(!(username || email)){
        throw new ApiErrror (400,"username and email are required");
    }
    
    const user= await User.findOne({    //findone used for single entry jo pehele milega husko swnd kar dega
        $or:[ { username },{ email }]
    })

    if(!user){
        throw new ApiErrror(404,"user not found with this username or email")
    }  
    
    const isPasswordValid= await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiErrror(401,"invalid password")
    }

    //generate tokens 
    const { accessToken, refreshToken }= await generateAccessAndRefreshTokens (user._id);

    //send cookie in response  ()
    
    const loggedInUser=await User.findById(user._id).      //loggedinuser ke pass sara fields honge except password and refresh token
    select("-password -refreshToken");


    const options={
        httpOnly:true,          //only server can access it
        secure:true,
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "user logged in successfully"
        )
    )




});

const logoutUser=asyncHandler(async(req,res)=>{
    
   await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },

        {
            new:true
        }
   )
//cookie clear
   const options={
        httpOnly:true,          //only server can access it
        secure:true,
    }
 

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200,{},"user logged out successfully")
    )


    
    
  
   

     
    



})



 //end point ho jahan pe user token refrsh kar sake
 const refreshAccessToken=asyncHandler(async(req,res)=>{
        const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken;

        if(!incomingRefreshToken){
            throw new ApiErrror(401,"unauthenticated request")
        }
        //verify refresh token
     try {
          const decodedToken= jwt.verify(
               incomingRefreshToken,
               process.env.REFRESH_TOKEN_SECRET,
           )
   
           const user= await User.findById(decodedToken?._id)
   
           if(!user){
               throw new ApiErrror(401,"invalid refresh token - user not found")
           }
   
           if(user.refreshToken !== incomingRefreshToken){
               throw new ApiErrror(401,"refresh token is expired or used")
           }
   
     //pehle cookies mai vejna hai
     const options={
           httpOnly:true,          //only server can access it
           secure:true,
       }
       
        const {accessToken, newrefreshToken} =   await generateAccessAndRefreshTokens(user._id);
        
   
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newrefreshToken, options)
        .json(
           new ApiResponse(200,
               {
                   accessToken,
                  refreshToken: newrefreshToken
               },
               "access token refreshed successfully"
           )
       )
     } catch (error) {
        throw new ApiErrror(401,error?.message|| "invalid refresh token")
        
     }
 })



export {registerUser , loginUser, logoutUser,refreshAccessToken} 