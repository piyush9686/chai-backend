import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';



const app= express();

//middleware  configuration
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:'16kb'}));   //form bhara to data liya

//url se data lena ho to
app.use(express.urlencoded({extended:true,limit:'16kb'}));

app.use(express.static('public'));  //static files folder like images css js

//server se cookie read krne k liye and access krne k liye
app.use(cookieParser()); 





export { app }