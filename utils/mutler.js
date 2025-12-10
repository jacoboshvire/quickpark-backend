const multer = require("multer"),
    path = require("path");
    

// multer config
module.exports = multer({
    storage: multer.diskStorage({
    }),
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        if (ext !== ".jpg" && ext !== ".png" && ext !== ".jpeg" && ext !== ".webp") {
            return cb(new Error("this website doesn't support the file"), false);
        }
        cb(null, true)
    }
})