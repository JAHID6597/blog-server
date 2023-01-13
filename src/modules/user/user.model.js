const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema(
	{
		firstName: String,
		lastName: String,
		userName: {
			type: String,
            required: true,
            unique: true
		},
		email: {
			type: String,
			required: true
		},
		password: {
			type: String,
			required: true
        },
        profilePicture: String,
		bio: String,
		address: String,
		dob: String,
        favouriteColor: {
            type: String,
            default: "#000000"
        },
		work: {
			organization: String,
			position: String
		},
		education: {
			institution: String,
			degree: String
		},
		socialUrl: Object,
		skills: Array,
		languages: Array,
		learning: Array,
		hacking: Array,
        availability: String,
        isActive: {
            type: Boolean,
            required: true,
            default: true
        },
        usedTags: [{
            tagId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "tags",
            },
            name: String,
            count: { type: Number, default: 1 }
        }],
        usedCategories: [{
            categoryId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "categories",
            },
            name: String,
            count: { type: Number, default: 1 }
        }],
        followers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
        }],
        followings: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
        }],
        blogs: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "blogs",
        }],
        comments: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "comments",
        }],
        likedBlogs: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "likes",
        }],
        bookmarkedBlogs: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "bookmarks",
        }],
	},
	{
		timestamps: true
	}
);

userSchema.methods.comparePassword = async function (password) {
	const result = await bcrypt.compare(password, this.password);
	return result;
}

const User = mongoose.model("users", userSchema);
module.exports = User;
