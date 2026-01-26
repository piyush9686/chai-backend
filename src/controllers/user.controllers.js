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
            $unset:{
                refreshToken: 1
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

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}= req.body

   const user= await User.findById(req.user?._id)
const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

if(!isPasswordCorrect){
    throw new ApiErrror(400,"invalid old password")
}

user.password= newPassword
await user.save({validateBeforeSave:false})

return res.status(200)
.json(new ApiResponse(200,{},"Password changed successfully"))



})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(200,req.user, "current user fetched successfully")
})


const updateAccountDetails=asyncHandler(async(req,res)=>{
    const{fullname,email} = req.body

    if(!fullname || !email){
        throw new ApiErrror(400,"All fields are required")
    }

   const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname:fullname,
                email:email
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"account detalis updated successful"))

})


//file update
const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath) throw new ApiErrror(400,"avatar file is missing")

     const avatar=await uploadOnCloudinary(avatarLocalPath)   
     
     if(!avatar.url) throw new ApiErrror(400,"error while uploading avatar")

        //update 
        const user= await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    avatar: avatar.url
                }
            },
            {new:true}



        
        ).select("-password")

         return res.status(200)
    .json(new ApiResponse(200,user,"Avatar updated successful"))
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path

    if(!coverImageLocalPath) throw new ApiErrror(400,"CI file is missing")

    const coverImage=await uploadOnCloudinary(coverImageLocalPath)   
     
     if(!coverImage.url) throw new ApiErrror(400,"error while uploading CI")

        //update 
       const user=  await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    coverImage: coverImage.url
                }
            },
            {new:true}



        
        ).select("-password")

         return res.status(200)
    .json(new ApiResponse(200,user,"Cover Image updated successful"))


})


const getUSerChannelProfile= asyncHandler(async(req,res)=>{
   const {username} = req.params          //params -  url se milega user 

   if(!username?.trim()) throw new ApiErrror(400,"username is missing")

   //username se document find karte haim   using pip
   const channel =await User.aggregate([
    {
        $match:{
            username: username?.toLowerCase()
        }
    },
    {
        $lookup:{  // join data as left outer join         maireko koi subc kiya hai
            from:"subscriptions",
            localField:_id,
            foreignField:"channel",
            as:"subscribers"
        }

    },
    {
      $lookup:{  //mai jisko subc kiya hun
            from:"subscriptions",
            localField:_id,
            foreignField:"subscriber",
            as:"subscribedTo"
        }
   
    },

    {//we count 
        $addFields:{
            subscrbersCount:{
                $size:"$subscribers"
            },
            channelsSubscribedToCount:{
                $size:"$subscribedTo"
            },
            isSubscribed:{
                $cond:{
                    if:{$in:[req.user?._id,$subscribers.subscriber]},
                    then:true,
                    else:false
                }
            }
        }
    },

    {    //jo jo value hamko dikhana hai tu we write 1
        $project:{ 
            fullname:1,
            username:1,
            subscrbersCount:1,
            channelsSubscribedToCount:1,
            isSubscribed:1
            ,avatar:1,
            coverImage:1,
            email:1

            


        }
    }
   ])  

   if(!channel?.length)
    throw new ApiErrror(404,"channel does not exit")


   return res
   .status(200)
   .json(
      new ApiResponse(200,channel[0],"user channel fetched successfully")
   )
})



const getWatchHistory=asyncHandler(async(req,res)=>{
   const user=await User.aggregate([

    {
        $match:{
            _id:new mongoose.Types.ObjectId(req.user._id)
        }
    },

    {
        $lookup:{
            from:"videos",
            localField:"watchHistory",
            foreignField:"_id",
            as:"watchHistory",
            
            pipeline:[     //sub pipeline we use fro owner
                {
                    $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        
                        pipeline:{
                            $project:{
                                fullname:1,
                                username:1,
                                avatar:1
                            }
                        }
                    }
                },
                {  //owner ka filed mai array aya hai so we use sub pipeli so array ko sudar rehehain
                   $addFields:{
                       owner:{
                           $first:"$owner"       //object miljayega so he can do by using .
                        }
                    }
                }

            ]

        }
    }
   ]) 

  
    return res
   .status(200)
   .json(
      new ApiResponse(200,user[0].watchHistory,"watchhistory fetched successful")
   )



})

export {registerUser , loginUser, logoutUser,
     refreshAccessToken,
    changeCurrentPassword,getCurrentUser,
    updateAccountDetails,updateUserAvatar,
    updateUserCoverImage,
    getUSerChannelProfile,
    getWatchHistory
} 