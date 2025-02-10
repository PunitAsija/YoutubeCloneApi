const express =require('express')
const app =express();
const mongoose =require('mongoose')
require('dotenv').config()

const connectDB = async()=>{
    try{
        const res = await mongoose.connect(process.env.MONGODB_URI)
        console.log('connected with database')
    }
    catch(err){
        console.log(err)
    }
}


module.exports = connectDB
