const mongoose = require("mongoose");
// Keep this in .env file
const URL = "mongodb+srv://webide:webide123@webide.tcr8a.mongodb.net/ide?retryWrites=true&w=majority&appName=webide";

const connectDB = async ()=>{
    try{
        await mongoose.connect(URL);
        console.log("Database connected");
    }catch(error){
        console.log("Error in connecting database",error);
    }
}

module.exports = connectDB;