const express = require('express');
const Router = express.Router();
const bcrypt = require('bcrypt');
const cloudinary = require('cloudinary').v2;
const User = require('../model/User');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const checkAuth = require('../middleware/checkAuth');

// Configuration
cloudinary.config({
    cloud_name: 'dbvqjcfuc',
    api_key: '996895651279547',
    api_secret: 'La5J4_JP4ETi0n8D0_hvPzU05Hk' // Click 'View API Keys' above to copy your API secret
});

Router.post('/signup', async (req, res) => {
    try {

        // Check if the required fields are provided
        const { channelName, email, phone, password } = req.body;

        if (!channelName || !email || !phone || !password) {
            return res.status(400).json({
                error: 'All fields (channelName, email, phone, password) are required.'
            });
        }


        const users = await User.find({ email: req.body.email })

        if (users.length > 0) {
            return res.status(500).json({
                error: 'email already registered'
            })
        }
        const hashCode = await bcrypt.hash(req.body.password, 10)
        const uploadedImage = await cloudinary.uploader.upload(req.files.logo.tempFilePath)
        const newUser = new User({
            _id: new mongoose.Types.ObjectId,
            channelName: req.body.channelName,
            email: req.body.email,
            phone: req.body.phone,
            password: hashCode,
            logoURL: uploadedImage.secure_url,
            logoId: uploadedImage.public_id,
        })

        const user = await newUser.save()

        res.status(200).json({
            newUser: user
        })
    }
    catch (err) {
        console.log(err)

        res.status(500).json({
            error: err
        })
    }
})


Router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    //check for required email and password
    if (!email || !password) {
        return res.status(400).json({
            error: "email and password is required"
        });
    }
    try {
        //check email is present or not
        const users = await User.find({ email: req.body.email })
        console.log(users)
        if (users.length == 0) {
            return res.status(500).json({
                error: 'email is not registered'
            })
        }
        //if email present check password is correct or not
        const isValid = await bcrypt.compare(req.body.password, users[0].password)
        console.log(isValid)
        if (!isValid) {
            return res.status(500).json({
                error: 'invalid password'
            })
        }
        //if both are correct and present create token use jwt tokens
        const token = jwt.sign({
            _id: users[0]._id,
            channelName: users[0].channelName,
            email: users[0].email,
            phone: users[0].phone,
            logoId: users[0].logoId
        }, 'created by admin',
            { expiresIn: '5d' }
        )

        res.status(200).json({
            _id: users[0]._id,
            channelName: users[0].channelName,
            email: users[0].email,
            phone: users[0].phone,
            logoId: users[0].logoId,
            logoURL: users[0].logoURL,
            token: token,
            subscribers: users[0].subscribers,
            subscribedChannels: users[0].subscribedChannels
        })
    }


    catch (err) {
        console.log(err)
        res.status(500).json({
            error: 'something is wrong'
        })
    }
})


//subscribed api  let userA want to subscribe userB 
Router.put('/subscribe/:userId', checkAuth, async (req, res) => {
    try {
        const userA = await jwt.verify(req.headers.authorization.split(" ")[1], 'created by admin')
        console.log(userA)
        const userB = await User.findById(req.params.userId)
        console.log(userB)
        if (userB.subscribedBy.includes(userA._id)) {
            return res.status(500).json({
                error: 'already subscribed..'
            })
        }

        console.log("not subscribed")

        userB.subscribers += 1;
        userB.subscribedBy.push(userA._id);
        await userB.save()
        const userAFullInformation = await User.findById(userA._id)
        userAFullInformation.subscribedChannels.push(userB._id)
        await userAFullInformation.save()
        res.status(200).json({
            msg: 'Subscribed successfully ...'
        })
    }
    catch (err) {
        console.log(err)

        return res.status(500).json({
            error: err
        })
    }
})

//unsubscribe api
Router.put('/unsubscribe/:userId', checkAuth, async (req, res) => {
    try {
        const userA = await jwt.verify(req.headers.authorization.split(" ")[1], 'created by admin')
        console.log(userA)
        const userB = await User.findById(req.params.userId)
        console.log(userB)
        if (userB.subscribedBy.includes(userA._id)) {
            userB.subscribers -= 1
            userB.subscribedBy = userB.subscribedBy.filter(usersId => usersId.toString() != userA._id)
            await userB.save()
            const userAFullInformation = await User.findById(userA._id)
            userAFullInformation.subscribedChannels = userAFullInformation.subscribedChannels.filter(usersId => usersId.toString() != userB._id)
            await userAFullInformation.save()
            res.status(200).json({
                msg: 'unsubscribed successfully'
            })
        }
        else {
            return res.status(500).json({
                error: 'not subs'
            })
        }
    }
    catch (err) {
        console.log(err)

        return res.status(500).json({
            error: err
        })
    }
})



module.exports = Router