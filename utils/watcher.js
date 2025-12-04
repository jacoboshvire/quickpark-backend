const Seller = require("../models/seller");
const cloudinary = require("cloudinary").v2;

function startWatch() {
    Seller.watch().on("change", data => {

        // MongoDB TTL deletes show as operationType === "delete"
        if (data.operationType === "delete") {

            // data.documentKey._id ← id of deleted doc
            const id = data.documentKey._id;

            // fetch the old document (must use change stream "fullDocument" option)
            Seller.findById(id)
                .then(doc => {
                    if (doc && doc.public_id) {
                        cloudinary.uploader.destroy(doc.public_id)
                            .then(() => console.log("Cloudinary image deleted"))
                            .catch(err => console.error("Failed to delete Cloudinary:", err));
                    }
                })
                .catch(err => console.error(err));
        }
    });
}

module.exports = startWatch;
