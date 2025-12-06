const { default: axios } = require("axios");
const { time } = require("console");
const express = require("express"),
    cloudinarys = require("../utils/cloudinary.js"),
    upload = require("../utils/mutler.js"),
    path = require("path"),
    Seller = require("../models/seller.js"),
    Joi = require("joi"),
    startWatch = require("../utils/watcher.js");

    //to auto delete the image from cloudinary after 
    // the post auto delete it self after the expired time
    startWatch();

// setting router to router
const router = express.Router()

//get routes
router.get("/", async (req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const sellers = await Seller.find()
            .skip(skip)
            .limit(limit)
            .lean();

        res.status(200).json({
            Seller: sellers,
            page,
            limit
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
})

//post routes
router.post("/",
    upload.single("image"),
    (req, res) => {

        // 1️⃣ Upload to Cloudinary
        cloudinarys.uploader.upload(req.file.path)
            .then((fileresult) => {

                // 2️⃣ Geocode the location
                let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${req.body.locations}&key=${process.env.GOOGLEAPI}`;

                return axios.get(url)
                    .then((response) => ({ fileresult, response }));
            })
            .then(({ fileresult, response }) => {
                // Duration (in hours) provided by user
                const lifetimeMs = 60 * 60 * req.body.duration * 1000;
                // Extract coordinates
                let newLng = response.data.results[0].geometry.location.lng;
                let newLat = response.data.results[0].geometry.location.lat;

                // 3️⃣ Validate input BEFORE creating a Seller
                const schema = Joi.object({
                    locations: Joi.string().min(2).required(),
                    phonenumber: Joi.number().integer().required().min(11),
                    postalcode: Joi.string().required(),
                    price: Joi.number().required(),
                    accountnumber: Joi.number().required().min(10),
                    accountname: Joi.string().required(),
                    sortcode: Joi.number().required().min(6),
                    timeNeeded: Joi.string().required(),
                    duration: Joi.number().required()   // ADD duration validation
                });

                const result = schema.validate(req.body);
                if (result.error) {
                    return res.status(400).json(result.error.details[0].message);
                }

                // 4️⃣ Create seller object
                const seller = new Seller({
                    locations: req.body.locations,
                    sortcode: req.body.sortcode,
                    postalcode: req.body.postalcode,
                    phonenumber: req.body.phonenumber,
                    price: req.body.price,
                    image: fileresult.secure_url,
                    imagewidth: fileresult.width,
                    imageheight: fileresult.height,
                    accountnumber: req.body.accountnumber,
                    accountname: req.body.accountname,
                    duration: req.body.duration,
                    timeNeeded: req.body.timeNeeded,
                    long: newLng,
                    lat: newLat,

                    // TTL auto delete
                    expiresAt: new Date(Date.now() + lifetimeMs)
                });

                // 5️⃣ Save seller
                return seller.save()
                    .then((savedSeller) => {
                        return res.status(200).json({ seller: savedSeller });
                    })
            })
            .catch((error) => {
                console.error(error);
                return res.status(500).json({ error: error.message });
            });
    }
);
//delete routes
router.delete("/:_id", async (req, res)=>{
    try {
        const id = req.params.id;

        // Find the document
        const item = await Item.findById(id);
        if (!item) {
        return res.status(404).json({ message: "Item not found" });
        }

        // Delete image from Cloudinary (if exists)
        if (item.cloudinaryPublicId) {
        await cloudinary.uploader.destroy(item.cloudinaryPublicId);
        }

        // Delete document from DB
        await Item.findByIdAndDelete(id);

        res.json({ message: "Item deleted successfully" });

    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ message: "Server error" });
    }
})
//put routes

//get post with id
router.get("/:id", async (req, res)=>{
    try{
        const seller = await Seller.findById(req.params.id)
        console.log('B')
        //if the seller post has expired or deleted
        if(!seller){
            res.status(404).send("this parking space has expired")
        }

        console.log('A')
        return res.status(200).json(seller)
    }catch(e){
        console.error("Error fetching seller by ID:", e);
        return res.status(500).json({error: "Server error"});
    }

})

//make express know i'm using router
router.use(express.json());

// exporting router
module.exports = router