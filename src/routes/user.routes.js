import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js";

import {upload} from "../middlewares/multer.middleware.js"
const router=Router()

router.route("/register").post(
    upload.fields([                           //we use middleeare for file upload    juat befoe posmethod
        {name:'avatar',maxCount:1},
        {name:'coverImage',maxCount:1}
    ]),
    registerUser)    //method post we use   






export default router