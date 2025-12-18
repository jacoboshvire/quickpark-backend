const { default: axios } = require("axios");
const sendNotification = require("../utils/sendNotifications.js");
const express = require("express"),
    cloudinarys = require("../utils/cloudinary.js"),
    upload = require("../utils/mutler.js"),
    path = require("path"),
    Seller = require("../models/seller.js"),
    auth = require("../middleware/auth.js"),
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

        const sellers = await Seller.find().populate("user", "fullname avatar email username")
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
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    /* 1️⃣ Validate file */
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    /* 2️⃣ Validate body */
    const schema = Joi.object({
      locations: Joi.string().min(2).required(),
      phonenumber: Joi.string().min(10).required(),
      postalcode: Joi.string().required(),
      price: Joi.number().required(),
      accountnumber: Joi.string().min(6).required(),
      accountname: Joi.string().required(),
      sortcode: Joi.string().min(6).required(),
      timeNeeded: Joi.string().required(),
      duration: Joi.number().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    /* 3️⃣ Upload image */
    const uploadedImage = await cloudinarys.uploader.upload(req.file.path);

    /* 4️⃣ Geocode address */
    const encodedAddress = encodeURIComponent(req.body.locations);
    const geoURL = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${process.env.GOOGLEAPI}`;
    const geo = await axios.get(geoURL);

    if (!geo.data.results.length) {
      return res.status(400).json({ message: "Invalid address" });
    }

    const { lat, lng } = geo.data.results[0].geometry.location;

    /* 5️⃣ Expiry time */
    const lifetimeMs = Number(req.body.duration) * 60 * 60 * 1000;

    /* 6️⃣ Create seller post */
    const seller = new Seller({
      locations: req.body.locations,
      postalcode: req.body.postalcode,
      phonenumber: req.body.phonenumber,
      price: req.body.price,
      sortcode: req.body.sortcode,
      accountnumber: req.body.accountnumber,
      accountname: req.body.accountname,
      timeNeeded: req.body.timeNeeded,
      duration: req.body.duration,

      lat,
      long: lng,

      image: uploadedImage.secure_url,
      imagewidth: uploadedImage.width,
      imageheight: uploadedImage.height,

      expiresAt: new Date(Date.now() + lifetimeMs),
      user: req.user.id,
    });

    const savedSeller = await seller.save();

    /* =========================
       🔔 PUSH NOTIFICATIONS
    ========================= */
    const users = await User.find({
      _id: { $ne: req.user.id }, // exclude creator
      fcmTokens: { $exists: true, $ne: [] },
    });

    const tokens = users.flatMap((u) => u.fcmTokens);

    await sendNotification(
      tokens,
      "New Parking Space Available 🚗",
      `${req.body.locations} · £${req.body.price}`,
      {
        sellerId: savedSeller._id.toString(),
      }
    );

    console.log(savedSeller)
    return res.status(201).json({
      message: "Seller post created successfully!",
      seller: savedSeller,
    });

  } catch (err) {
    console.error("SELLER POST ERROR:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});


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

//get post with id
router.get("/:id", async (req, res)=>{
    try{
        const seller = await Seller.findById(req.params.id)
        .populate("user", "fullname avatar email")
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

router.get("/my-posts", auth, async (req, res) => {
  const posts = await Seller.find({ user: req.user.id });
  res.json(posts);
});

//make express know i'm using router
router.use(express.json());

// exporting router
module.exports = router