const mongoose = require("mongoose");
const path = require("path");
const { makeCustomSlug } = require(path.join(process.cwd(), "/utils/slug"));

const categorySchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true
        },
        slug: {
            type: String,
            required: true,
            unique: true
        },
        description: {
            type: String,
            required: true,
        },
        image: {
            type: String
        },
        color: {
            type: String,
            required: true,
            default: "#000000"
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "admins",
            required: true,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "admins"
        },
        blogs: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "blogs"
        }],
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

categorySchema.pre('validate', async function (next) {
    if (this.isModified('name'))
        this.slug = await makeCustomSlug(this.name);
    
    next();
});

const Category = mongoose.model("categories", categorySchema);
module.exports = Category;
