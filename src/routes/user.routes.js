import { Router } from "express";
import { loginUser,logoutUser,registerUser,
    refreshAccessToken, changeCurrentPassword, getCurrentUser,
     updateAccountDetails, updateUserAvatar, updateUserCoverImage,
      getUSerChannelProfile, getWatchHistory } 
      from "../controllers/user.controllers.js";

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

router.route("/change-password").post(verifyJWT,changeCurrentPassword)

router.route("/current-user").get(verifyJWT,getCurrentUser)

router.route("/update_account").patch(verifyJWT,updateAccountDetails)

router.route("/avatar").patch(verifyJWT,upload.single ("avatar"),updateUserAvatar)

router.route("/cover-Image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)

//we are geeting from params username
router.route("/c/:username").get(verifyJWT,getUSerChannelProfile)

router.route("/history").get(verifyJWT,getWatchHistory)




export default router