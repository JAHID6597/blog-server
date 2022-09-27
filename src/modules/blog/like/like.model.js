const mongoose = require("mongoose");

const likeSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true,
        },
        blog: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "blogs",
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

const Like = mongoose.model("likes", likeSchema);
module.exports = Like;
