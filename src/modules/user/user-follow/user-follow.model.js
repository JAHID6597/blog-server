const mongoose = require("mongoose");

const followSchema = mongoose.Schema(
    {
        following: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true,
        },
        follower: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

const Follow = mongoose.model("follows", followSchema);
module.exports = Follow;
