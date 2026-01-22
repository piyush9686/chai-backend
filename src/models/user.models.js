import mongoose,{Schema} from 'mongoose';

import bcrypt from 'bcrypt';     //use for password hashing
import jwt from 'jsonwebtoken';

const userSchema = new Schema(
{
    username: {
        type: String,
        required: true,
         unique: true,
         lowecase:true ,
         trim: true,
         index: true,   //searceable field optimi
        },
    email: {
        type: String,
        required: true, 
        unique: true,
        lowercase: true,
        trim: true
    },
    fullname:{
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    avatar:{
        type: String,   //cloudinary url 
        required: true
    },
    coverImage:{
        type: String,   //cloudinary url 
       
    },
    

    watchHistory:[
        {
            type: Schema.Types.ObjectId,
            ref:"Video"
        }
    ],

    password: {
        type: String,
        required:[true, 'Password is required'],
    },
    refreshToken:{
        type: String,
    },

}, 

    {
        timestamps: true
    }



)
//passs encrypp
userSchema.pre("save", async function (next) {         //()=>{} callback function not use here because of 'this' keyword
    if(!this.isModified('password')) return next();  //if password is not modified then skip hashing
     this.password=await bcrypt.hash(this.password,10);  //hash the password before saving
     next();
})

userSchema.methods.isPasswordMatch=async function(plainPassword){
   return await bcrypt.compare(plainPassword,this.password);
}

//jwt is bearing token
//acess token GENERATE
userSchema.methods.generateAccessToken=function(){      //sing method generat access token
   return jwt.sign({
        _id: this._id,
        username: this.username,
        email: this.email,
        fullname: this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {expiresIn: process.env.ACCESS_TOKEN_EXPIRES}
)
}
userSchema.methods.generateRefreshToken=function(){
     return jwt.sign({
        _id: this._id,
    
    },
    process.env.REFRESS_TOKEN_SECRET,
    {expiresIn: process.env.REFRESH_TOKEN_EXPIRES}
)
}


export const User=mongoose.model('User', userSchema);
