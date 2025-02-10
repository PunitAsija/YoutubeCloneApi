const express = require('express');
const userRoute=require('./routes/user');
const videoRoute=require('./routes/video');
const commentRoute =require('./routes/comment');
const bodyParser=require('body-parser');
const fileUpload=require('express-fileupload');
const app = express();
app.use(express.json());

app.use(bodyParser.json());

app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : '/tmp/'
}));

app.use('/user',userRoute)
app.use('/video',videoRoute)
app.use('/comment',commentRoute)

module.exports = app;