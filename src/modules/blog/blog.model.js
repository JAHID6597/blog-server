const mongoose = require("mongoose");

const blogSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
        },
        content: { type: String, required: true },
        searchContent: { type: String, required: true },
        cardImage: { type: String, required: true },
        bannerImage: { type: String, required: true },
        tags: [
            {
                type: String,
                required: true,
            },
        ],
        categories: [
            {
                type: String,
                required: true,
            },
        ],
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "likes",
            },
        ],
        comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "comments",
            },
        ],
        bookmarks: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "bookmarks",
            },
        ],
        isActive: {
            type: Boolean,
            required: true,
            default: true,
        },
    },
    {
        timestamps: true,
    },
);

const Blog = mongoose.model("blogs", blogSchema);
module.exports = Blog;
