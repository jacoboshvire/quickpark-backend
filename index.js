const express = require("express"),
    app = express(),
    mongoose = require("mongoose"),
    cors = require("cors"),
    dotenv = require("dotenv");
    


//setting dotenv file
dotenv.config();

app.use(express.json());
app.use(cors())

/**
 * ======================================
 * connecting mongoose to mongodb
 * ======================================
 */
mongoose.connect(`mongodb+srv://${process.env.MONGODBUSER}:${process.env.PASSWORD}@${process.env.DATABASE}.bp0equu.mongodb.net/`);
mongoose.Promise = Promise;



//creating the routes
app.use("/api/sellerpost", require("./Routes/seller"))
app.use("/api/user", require("./Routes/user"))
app.use("/api/notification", require("./Routes/notification"))
app.use("/api/booking", require("./Routes/booking"))


//home welcome note and direction on how to use the api
app.get("/", (req,res)=>{
    res.send(
        "Hi welcome to my restapi (to use this api add /api/sellerpost)"
    )
})


//create a port
const port = process.env.PORT || 8080
app.listen(port, ()=>{
    console.log(port, "we are up and running")
})