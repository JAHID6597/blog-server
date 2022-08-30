const mongoose = require("mongoose");


const commentSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true,
        },
        comment: {
            type: String,
            required: true,
        },
        blog: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "blogs",
            required: true,
        },
        isActive: {
            type: Boolean,
            required: true,
            default: true
        }
    },
    {
        timestamps: true,
    }
);


const Comment = mongoose.model("comments", commentSchema);
module.exports = Comment;
