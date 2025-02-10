const { Schema, model, default: mongoose } = require("mongoose");

const commentSchema = new Schema({

    _id: mongoose.Schema.Types.ObjectId,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref:'User'
    },
    videoId: {
        type: String,
        required: true
    },
    commentText: {
        type: String,
        required: true
    },

}, { timestamps: true });

module.exports = model('Comment', commentSchema, 'comment');