import { Router } from "express";
import { loginUser,logoutUser,registerUser,refreshAccessToken } from "../controllers/user.controllers.js";

import {upload} from "../middlewares/multer.middleware.js"

import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router=Router()

router.route("/register").post(
    upload.fields([                           //we use middleeare for file upload    juat befoe posmethod
        {name:'avatar',maxCount:1},
        {name:'coverImage',maxCount:1}
    ]),
    registerUser)    //method post we use   


router.route("/login").post(loginUser)  

//secured   route
router.route("/logout").post(verifyJWT ,logoutUser)


//refresh token ka end point
router.route("/refresh-token").post(refreshAccessToken)  




export default router