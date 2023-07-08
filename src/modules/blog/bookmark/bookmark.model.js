const mongoose = require("mongoose");

const bookmarkSchema = mongoose.Schema(
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
        },
    },
    {
        timestamps: true,
    },
);

const Bookmark = mongoose.model("bookmarks", bookmarkSchema);
module.exports = Bookmark;
