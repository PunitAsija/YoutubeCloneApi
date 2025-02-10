const express = require('express')
const Router = express.Router()
const checkAuth = require('../middleware/checkAuth')
const jwt = require('jsonwebtoken')
const cloudinary = require('cloudinary').v2
const Video = require('../model/Video')
const mongoose = require('mongoose')

cloudinary.config({
    cloud_name: 'dbvqjcfuc',
    api_key: '996895651279547',
    api_secret: 'La5J4_JP4ETi0n8D0_hvPzU05Hk' // Click 'View API Keys' above to copy your API secret
});

Router.post('/upload', checkAuth, async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1]
        const user = await jwt.verify(token, 'created by admin',)
        console.log(user)
        console.log(req.body)
        console.log(req.files.video)
        console.log(req.files.thumbnail)
        const uploadedVideo = await cloudinary.uploader.upload(req.files.video.tempFilePath, {
            resource_type: 'video'
        })
        const uploadedThumbnail = await cloudinary.uploader.upload(req.files.thumbnail.tempFilePath)
        console.log(uploadedVideo)
        console.log(uploadedThumbnail)
        const newVideo = new Video({
            _id: new mongoose.Types.ObjectId,
            title: req.body.title,
            description: req.body.description,
            user_id: user._id,
            videoUrl: uploadedVideo.secure_url,
            videoId: uploadedVideo.public_id,
            thumbnailUrl: uploadedThumbnail.secure_url,
            thumbnailId: uploadedThumbnail.public_id,
            category: req.body.category,
            tags: req.body.tags.split(","),
        })

        const newUploadedVideo = await newVideo.save()
        res.status(200).json({
            newVideo: newUploadedVideo
        })

    }
    catch (err) {
        console.log(err)
        res.status(500).json({
            error: err
        })
    }
})


//update video detail

Router.put('/:videoId', checkAuth, async (req, res) => {
    try {

        const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1], 'created by admin')
        console.log(verifiedUser)
        const video = await Video.findById(req.params.videoId)
        console.log(video)
        if (video.user_id == verifiedUser._id) {
            //update video detail
            if (req.files) {
                //update thumbnail and text data for that first we have to delete old thumbnail
                await cloudinary.uploader.destroy(video.thumbnailId)
                const updatedThumbnail = await cloudinary.uploader.upload(req.files.thumbnail.tempFilePath)
                const updatedData = {
                    title: req.body.title,
                    description: req.body.description,
                    category: req.body.category,
                    tags: req.body.tags.split(","),
                    thumbnailUrl: updatedThumbnail.secure_url,
                    thumbnailId: updatedThumbnail.public_id,
                }
                const updatedVideoDetail = await Video.findByIdAndUpdate(req.params.videoId, updatedData, { new: true })
                res.status(200).json({
                    updatedVideo: updatedVideoDetail
                })
            }
            else {
                //update only text data
                const updatedData = {
                    title: req.body.title,
                    description: req.body.description,
                    category: req.body.category,
                    tags: req.body.tags.split(","),

                }
                const updatedVideoDetail = await Video.findByIdAndUpdate(req.params.videoId, updatedData, { new: true })
                res.status(200).json({
                    updatedVideo: updatedVideoDetail
                })

            }
        }
        else {
            return res.status(500).json({
                error: 'you have no permission'
            })
        }


    }
    catch (err) {
        console.log(err)
        res.status(500).json({
            error: err
        })
    }
})

//delete video

Router.delete('/:videoId', checkAuth, async (req, res) => {
    try {
        const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1], 'created by admin')
        const video = await Video.findById(req.params.videoId)
        if (video.user_id == verifiedUser._id) {
            //delete video,thumnail,data from database
            await cloudinary.uploader.destroy(video.videoId, { resource_type: 'video' })
            await cloudinary.uploader.destroy(video.thumbnailId)
            const deletedResponse = await Video.findByIdAndDelete(req.params.videoId)
            res.status(200).json({
                deletedResponse: deletedResponse
            })
        }
        else {
            return res.status(500).json({
                error: 'you are not allowed'
            })
        }


    }
    catch (err) {
        console.log(err)
        res.status(500).json({
            error: err
        })
    }
})

//like api
Router.put('/like/:videoId', checkAuth, async (req, res) => {
    try {
        const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1], 'created by admin')
        const video = await Video.findById(req.params.videoId)
        console.log(verifiedUser)
        if (video.likedBy.includes(verifiedUser._id)) {
            return res.status(500).json({
                error: 'already liked'
            })
        }
        if (video.dislikedBy.includes(verifiedUser._id)) {
            video.dislike -= 1;
            video.dislikedBy = video.dislikedBy.filter(userId => userId.toString() != verifiedUser._id)
        }
        video.likes += 1;
        video.likedBy.push(verifiedUser._id)
        await video.save();
        res.status(200).json({
            msg: 'liked'
        })

    } catch (err) {
        console.log(err)
        res.status(500).json({
            error: err
        })
    }
})

//disliked api
Router.put('/dislike/:videoId', checkAuth, async (req, res) => {
    try {
        const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1], 'created by admin')
        const video = await Video.findById(req.params.videoId)
        console.log(verifiedUser)
        if (video.dislikedBy.includes(verifiedUser._id)) {
            return res.status(500).json({
                error: 'already disliked'
            })
        }

        if (video.likedBy.includes(verifiedUser._id)) {
            video.likes -= 1;
            video.likedBy = video.likedBy.filter(userId => userId.toString() != verifiedUser._id)
        }

        video.dislike += 1;
        video.dislikedBy.push(verifiedUser._id)
        await video.save();
        res.status(200).json({
            msg: 'disliked'
        })

    } catch (err) {
        console.log(err)
        res.status(500).json({
            error: err
        })
    }
})

//view api

Router.put('/views/:videoId', async (req, res) => {
    try {
        const video = await Video.findById(req.params.videoId)
        console.log(video)
        video.views += 1;
        await video.save()
        res.status(200).json({
            msg: "video is viewed"
        })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({
            error: err
        })
    }
})

module.exports = Router