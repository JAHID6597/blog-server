const mongoose = require("mongoose");
const path = require("path");
const { makeCustomSlug } = require(path.join(process.cwd(), "/src/utils/slug"));

const tagSchema = mongoose.Schema(
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
        color: {
            type: String,
            required: true,
            default: "#000000"
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true,
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

tagSchema.pre('validate', async function (next) {
    if (this.isModified('name'))
        this.slug = await makeCustomSlug(this.name);
    
    next();
})

const Tag = mongoose.model("tags", tagSchema);
module.exports = Tag;
