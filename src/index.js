//require ('dotenv').config({path: './env'})
import dotenv  from "dotenv";


//import mongoose from "mongoose";  
//import { DB_NAME } from "./constants";
import connectDB from "./db/index.js";

 dotenv.config({
     path:'./env'
 })


connectDB()

//async mthod ek promise return krta h to usme .then .catch use kr skte h
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(` App is listening on port ${process.env.PORT || 8000}`);
    })
})
.catch((err)=>{console.error(" DB CONNECTION ERROR!!!",err)})















/*
import express from "express"
const app=express()

//ife
(async()=>{
    try{
      await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

      app.on("error",(error)=>{console.log("Error:",error);  throw error })           //express listen

      app.listen(process.env.PORT,()=>{
        console.log(`App is listening on port ${process.env.PORT}`);
      })
    }
    catch(error){
        console.error("Error",error)
        throw err
    }
})()

*/


