const express = require("express"),
    cloudinary = require("../utils/cloudinary.js"),
    upload = require("../utils/mutler.js"),
    path = require("path"),
    Seller = require("../models/seller.js")

// setting router to router
const router = express.Router()

//post routes
router.post(("/", upload.single("image")), async (req,res)=>{
    //connecting to cloudinary
    const fileresult = await cloudinary.uploader.upload(req.file.path)

    //paramsing the data to create new one
    const seller = {
        location: req.body.location,
        sortcode: req.body.sortcode,
        postalcode: req.body.postalcode,
        phonenumber: req.body.phonenumber,
        price: req.body.price,
        image: fileresult.secure_url, //image = file secure url at cloudinary
        imagewidth: fileresult.width,
        imageheight: fileresult.height,
        accountnumber: req.body.accountnumber,
        accountname: req.body.accountname
    };

    // variable for error
    let result

    //creating new seller
    const sellers = new Seller(seller)

    // error validation
    // const schema = Joi.object({
    //     name: Joi.string().min(2).required(),
    //     description: Joi.string().min(200).max(3000).required(),
    //     image: Joi.string(),
    //     tools: Joi.string(),
    // });

    //setting result to the schema for the error validation above
    result = schema.validate(req.body);
    if (result.error) {
        return res.status(400).json(result.error.details[0].message);
    };

    if (!seller.image.match(/\.(jpg|jpeg|png|gif|dmp|webp|ico|tiff|xbm|tif|pjp|pjpeg|jfif)$/i)) {    //checking for error in the newing created post
        // error message
        return res.status(400).json({
            "error": "file type don't match"
        })
    }

    sellers.save().then((seller) => {
        return res.status(200).json({ seller })
    })    //if no error save the post to monogodb
    .catch((e) => {
        return res.status(400).json(e.message)
    })

})
//get routes
//delete routes
//put routes

router.use(express.json());

// exporting router
module.exports = router