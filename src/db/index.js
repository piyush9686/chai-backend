import mongoose from "mongoose";  
import { DB_NAME } from "../constants.js";


const connectDB= async ()=>{
    try{
        const CI= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST : ${CI.connection.host}`)

    }
    catch(error){
        console.error(" MONGOOSE CONN ERRoR",error);
        process.exit(1)

    }
}

export default connectDB