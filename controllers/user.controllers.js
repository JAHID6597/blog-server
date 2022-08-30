const path = require("path");
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const User = require(path.join(process.cwd(), '/models/user.model'));
const Blog = require(path.join(process.cwd(), "/models/blog.model"));
const Like = require(path.join(process.cwd(), "/models/like.model"));
const Comment = require(path.join(process.cwd(), "/models/comment.model"));
const Bookmark = require(path.join(process.cwd(), "/models/bookmark.model"));
const Follow = require(path.join(process.cwd(), "/models/follow.model"));
const cloudinary = require(path.join(process.cwd(), "/lib/cloudinary"));
const mongoose = require('mongoose');


const populateUser = { path: 'user', select: '_id userName profilePicture' };
const populateComment = { path: 'comments', select: '_id user' };
const populateLike = { path: 'likes', select: '_id user' };
const populateBookmark = { path: 'bookmarks', select: '_id user' };


const populateUserWithAggregate = [
    {
        $lookup: {
            from: "users",
            localField: "user",
            pipeline: [
                {
                    $project: {
                        _id: 1,
                        userName: 1,
                        profilePicture: 1
                    }
                }
            ],
            foreignField: "_id",
            as: 'user'
        }
    },
    {
        $unwind: '$user'
    }
];

const populateCommentWithAggregate = [
    {
        $lookup: {
            from: "comments",
            localField: "comments",
            pipeline: [
                {
                    $project: {
                        _id: 1,
                        user: 1
                    }
                }
            ],
            foreignField: "_id",
            as: 'comments'
        }
    }
];

const populateLikeWithAggregate = [
    {
        $lookup: {
            from: "likes",
            localField: "likes",
            pipeline: [
                {
                    $project: {
                        _id: 1,
                        user: 1
                    }
                }
            ],
            foreignField: "_id",
            as: 'likes'
        }
    }
];

const populateBookmarkWithAggregate = [
    {
        $lookup: {
            from: "bookmarks",
            localField: "bookmarks",
            pipeline: [
                {
                    $project: {
                        _id: 1,
                        user: 1
                    }
                }
            ],
            foreignField: "_id",
            as: 'bookmarks'
        }
    }
];

const populateBlogWithAggregate = [
    {
        $lookup: {
            from: "blogs",
            localField: "blog",
            foreignField: "_id",
            as: 'blog'
        }
    },
    {
        $unwind: '$blog'
    },
    {
        $lookup: {
            from: "users",
            localField: "blog.user",
            pipeline: [
                {
                    $project: {
                        _id: 1,
                        userName: 1,
                        profilePicture: 1
                    }
                }
            ],
            foreignField: "_id",
            as: "blog.user",
        }
    },
    {
        $unwind: '$blog.user'
    },
    {
        $lookup: {
            from: "likes",
            localField: "blog.likes",
            pipeline: [
                {
                    $project: {
                        _id: 1,
                        user: 1
                    }
                }
            ],
            foreignField: "_id",
            as: "blog.likes",
        }
    },
    {
        $lookup: {
            from: "bookmarks",
            localField: "blog.bookmarks",
            pipeline: [
                {
                    $project: {
                        _id: 1,
                        user: 1
                    }
                }
            ],
            foreignField: "_id",
            as: "blog.bookmarks",
        }
    },
    {
        $lookup: {
            from: "comments",
            localField: "blog.comments",
            pipeline: [
                {
                    $project: {
                        _id: 1,
                        user: 1
                    }
                }
            ],
            foreignField: "_id",
            as: "blog.comments",
        }
    }
];

const populateSelectedFieldBlogWithAggregate = [
    {
        $lookup: {
            from: "blogs",
            localField: "blog",
            pipeline: [
                {
                    $project: {
                        _id: 1,
                        slug: 1,
                        title: 1
                    }
                }
            ],
            foreignField: "_id",
            as: 'blog'
        }
    },
    {
        $unwind: '$blog'
    }
];


async function signin(req, res) {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).send('Invalid credentials.');
        
        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) return res.status(400).send('Invalid credentials.');
        
        if (user.email === email && isPasswordCorrect) {
            const token = jwt.sign({ id: user._id }, process.env.USER_TOKEN_SECRET, { expiresIn: '1h' });

            return res.status(200).send({ accessToken: token });
        }
        else res.status(400).send('Invalid Credentials');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function signup(req, res) {
    try {
        const { userName, email, password, confirmPassword } = req.body;

        const existUser = await User.findOne({ userName });
        if(existUser) return res.status(400).send('User already exists.');

        if (password !== confirmPassword) return res.status('Password does not match.');
        
        const salt = await bcrypt.genSalt(10);
		const hashPassword = await bcrypt.hash(password, salt);

        const user = new User({ userName, email, password: hashPassword });

        const newUser = await user.save();

        const token = jwt.sign({ id: newUser._id }, process.env.USER_TOKEN_SECRET, { expiresIn: '1h' });

        res.status(201).send({ accessToken: token });
    }
    catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function logout(req, res) {
    try {
        res.status(200).send('Successfully logged out');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}


async function getUsers(req, res) {
    try {
        const limit = req.query.limit || 10;
        const page = req.query.page || 1;
        const search = new RegExp(req.query.search, 'i');

        const users = await User
                            .find(
                                {
                                    "$or": [
                                        { userName: search },
                                        { email: search }
                                    ]
                                }
                                )
                                    .select("-password")
                            .skip(limit * (page - 1))
                            .limit(limit);
        
        const totalUsers = await User.count();

        const data = {
            users,
            metaData: {
                start: (limit * (page - 1)) + 1,
                end: limit * page,
                total: totalUsers,
                page,
                limit
            }
        };

        res.status(200).send(data);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function getPublicProfile(req, res) {
    try {
        const { userName } = req.params;

        const user = await User
                            .findOne({ userName })
                            .select("-password");
        if (!user) return res.status(404).send('User does not exists.');

        res.status(200).json(user);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function getPrivateProfile(req, res) {
    try {
        const user = await User
                            .findById(req.id)
                            .select("-password");
        if (!user) return res.status(404).send('User does not exists.');

        res.status(200).send(user);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function updateProfile(req, res) {
    try {
        const { firstName, lastName, userName, email, profilePicture, bio, address, dob, favouriteColor, work, education, socialUrl, skills, languages, learning, hacking, availability, isActive } = req.body;

        const profilePictureUrl = await cloudinary.uploader.upload(profilePicture);

        const newUpdateUserData = {
            firstName, 
            lastName,
            userName, 
            email, 
            profilePicture: profilePictureUrl.secure_url, 
            bio, 
            address, 
            dob, 
            favouriteColor, 
            work, 
            education, 
            socialUrl, 
            skills, 
            languages, 
            learning, 
            hacking, 
            availability,
            isActive
        }

        const updatedUser = await User.findByIdAndUpdate(req.id, newUpdateUserData, { new: true }).select("-password");

        res.status(200).send(updatedUser);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function deleteProfile(req, res) {
    try {
        const deletedUser = await User.findByIdAndDelete(req.id).select("-password");

        res.status(200).send(deletedUser);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function changePassword(req, res) {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) return res.status(400).send('Password must match.');

        const user = await User.findById(req.id);
        if (!user) return res.status(404).send('User does not exists.');

        const isPasswordCorrect = await user.comparePassword(currentPassword);
        if (!isPasswordCorrect) return res.status(400).send('Invalid credentials.');

        const salt = await bcrypt.genSalt(10);
		const hashPassword = await bcrypt.hash(newPassword, salt);

        const updatedUser = await User.findByIdAndUpdate(req.id, { password: hashPassword }, { new: true }).select("-password");

        res.status(200).send(updatedUser);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}


async function followUser(req, res) {
    try {
        const { userName } = req.params;

        const user = await User.findOne({ userName }).select("-password").lean();
        if (!user) return res.status(404).send('User does not exists.');

        const followed = await Follow.findOne({ follower: req.id, following: user._id });
        if (followed) {
            await followed.delete();
            await User.findOneAndUpdate({ userName }, { $pull: { followers: req.id } }, { new: true });
            const updatedUser = await User.findByIdAndUpdate(req.id, { $pull: { followings: user._id } }, { new: true }).select("-password");
            return res.status(200).send(updatedUser);
        }

        const newFollow = new Follow({ follower: req.id, following: user._id });
        await newFollow.save();
        await User.findOneAndUpdate({ userName }, { $push: { followers: req.id } }, { new: true });

        const updatedUser = await User.findByIdAndUpdate(req.id, { $push: { followings: user._id } }, { new: true }).select("-password");
        return res.status(200).send(updatedUser);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function getFollowerUsers(req, res) {
    try {
        const { userName } = req.params;

        const user = await User.findOne({ userName });
        if (!user) return res.status(404).send('User does not exists.');

        const limit = req.query.limit || 10;
        const page = req.query.page || 1;
        const search = new RegExp(req.query.search, 'i');

        const query = {
            following: user._id,
            "$or": [
                { userName: search },
                { email: search }
            ]
        };

        const followers = await Follow
                                .find(query)
                                .populate({ path: 'follower', select: '-password' })
                                .skip(limit * (page - 1))
                                .limit(limit);
        
        const totalFollowers = await Follow.count(query);

        const data = {
            users: followers,
            metaData: {
                start: (limit * (page - 1)) + 1,
                end: limit * page,
                total: totalFollowers,
                page,
                limit
            }
        };

        res.status(200).send(data);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function getFollowingUsers(req, res) {
    try {
        const { userName } = req.params;

        const user = await User.findOne({ userName });
        if (!user) return res.status(404).send('User does not exists.');

        const limit = req.query.limit || 10;
        const page = req.query.page || 1;
        const search = new RegExp(req.query.search, 'i');

        const query = {
            follower: user._id,
            "$or": [
                { userName: search },
                { email: search }
            ]
        };

        const followings = await Follow
                            .find(query).populate({ path: 'following', select: '-password' })
                            .skip(limit * (page - 1))
                            .limit(limit);
        
        const totalFollowings = await Follow.count(query);

        const data = {
            users: followings,
            metaData: {
                start: (limit * (page - 1)) + 1,
                end: limit * page,
                total: totalFollowings,
                page,
                limit
            }
        };

        res.status(200).send(data);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}


async function getBlogsByPublicUser(req, res) {
    try {
        const { userName } = req.params;

        const user = await User.findOne({ userName });
        if (!user) return res.status(404).send('User does not exists.');

        const limit = +req.query.limit || 10;
        const page = +req.query.page || 1;
        const search = new RegExp(req.query.search, 'i');

        const query = [
            {
                $match: {
                    user: user._id,
                    $or: [
                        { title: search },
                        { searchContent: search }
                    ]
                }
            },
            {   
                $sort: { "createdAt": -1 } 
            }
        ];

        const blogs = await Blog
                            .aggregate([
                                ...query,
                                ...populateUserWithAggregate,
                                ...populateCommentWithAggregate,
                                ...populateLikeWithAggregate,
                                ...populateBookmarkWithAggregate
                            ])
                            .skip(limit * (page - 1))
                            .limit(limit);
        
        const totalBlogs = await Blog.aggregate([
                                                    ...query,
                                                    {
                                                        $group: {
                                                            _id: null,
                                                            count: { $sum: 1 }
                                                        }
                                                    }
                                                ]);

        const data = {
            blogs,
            metaData: {
                start: (limit * (page - 1)) + 1,
                end: limit * page,
                total: totalBlogs[0]?.count || 0,
                page,
                limit
            }
        };

        res.status(200).send(data);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function getBlogByPublicUser(req, res) {
    try {
        const { userName, slug } = req.params;

        const user = await User.findOne({ userName });
        if (!user) return res.status(404).send('User does not exists.');
        
        const blog = await Blog
                            .findOne({ user: user._id, slug })
                            .populate(populateUser)
                            .populate(populateComment)
                            .populate(populateLike)
                            .populate(populateBookmark);
        if(!blog) return res.status(404).send('Not found any blog.');

        res.status(200).send(blog);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}


async function getBlogsByPrivateUser(req, res) {
    try {
        const limit = +req.query.limit || 10;
        const page = +req.query.page || 1;
        const search = new RegExp(req.query.search, 'i');

        const userId = mongoose.Types.ObjectId(req.id);

        const query = [
            {
                $match: {
                    user: userId,
                    $or: [
                        { title: search },
                        { searchContent: search }
                    ]
                }
            },
            {   
                $sort: { "createdAt": -1 } 
            }
        ];

        const blogs = await Blog
                            .aggregate([
                                ...query,
                                ...populateUserWithAggregate,
                                ...populateCommentWithAggregate,
                                ...populateLikeWithAggregate,
                                ...populateBookmarkWithAggregate
                            ])
                            .skip(limit * (page - 1))
                            .limit(limit);
        
        const totalBlogs = await Blog.aggregate([
                                                    ...query,
                                                    {
                                                        $group: {
                                                            _id: null,
                                                            count: { $sum: 1 }
                                                        }
                                                    }
                                                ]);

        const data = {
            blogs,
            metaData: {
                start: (limit * (page - 1)) + 1,
                end: limit * page,
                total: totalBlogs[0]?.count || 0,
                page,
                limit
            }
        };

        res.status(200).send(data);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function getBlogByPrivateUser(req, res) {
    try {
        const { slug } = req.params;

        const userId = mongoose.Types.ObjectId(req.id);
        
        const blog = await Blog
                            .findOne({ user: userId, slug })
                            .populate(populateUser)
                            .populate(populateComment)
                            .populate(populateLike)
                            .populate(populateBookmark);
        if(!blog) return res.status(404).send('Not found any blog.');

        res.status(200).send(blog);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}


async function getLikedBlogsByPublicUser(req, res) {
    try {
        const { userName } = req.params;

        const user = await User.findOne({ userName });
        if (!user) return res.status(404).send('User does not exists.');

        const limit = +req.query.limit || 10;
        const page = +req.query.page || 1;
        const search = new RegExp(req.query.search, 'i');

        const query = [
            ...populateBlogWithAggregate,
            {
                $match: {
                    user: user._id,
                    $or: [
                        { 'blog.title': search },
                        { 'blog.searchContent': search }
                    ]
                }
            }
        ];

        const blogs = await Like
                            .aggregate(query)
                            .skip(limit * (page - 1))
                            .limit(limit);
        
        const totalBlogs = await Like.aggregate([
                                                    ...query,
                                                    {
                                                        $group: {
                                                            _id: null,
                                                            count: { $sum: 1 }
                                                        }
                                                    }
                                                ]);

        const data = {
            blogs,
            metaData: {
                start: (limit * (page - 1)) + 1,
                end: limit * page,
                total: totalBlogs[0]?.count || 0,
                page,
                limit
            }
        };

        res.status(200).send(data);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function getLikedBlogsByPrivateUser(req, res) {
    try {
        const limit = +req.query.limit || 10;
        const page = +req.query.page || 1;
        const search = new RegExp(req.query.search, 'i');

        const userId = mongoose.Types.ObjectId(req.id);

        const query = [
            ...populateBlogWithAggregate,
            {
                $match: {
                    user: userId,
                    $or: [
                        { 'blog.title': search },
                        { 'blog.searchContent': search }
                    ]
                }
            }
        ];

        const blogs = await Like
                            .aggregate(query)
                            .skip(limit * (page - 1))
                            .limit(limit);
        
        const totalBlogs = await Like.aggregate([
                                                    ...query,
                                                    {
                                                        $group: {
                                                            _id: null,
                                                            count: { $sum: 1 }
                                                        }
                                                    }
                                                ]);

        const data = {
            blogs,
            metaData: {
                start: (limit * (page - 1)) + 1,
                end: limit * page,
                total: totalBlogs[0]?.count || 0,
                page,
                limit
            }
        };

        res.status(200).send(data);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}


async function getBookmarkedBlogsByPublicUser(req, res) {
    try {
        const { userName } = req.params;

        const user = await User.findOne({ userName });
        if (!user) return res.status(404).send('User does not exists.');

        const limit = +req.query.limit || 10;
        const page = +req.query.page || 1;
        const search = new RegExp(req.query.search, 'i');

        const query = [
            ...populateBlogWithAggregate,
            {
                $match: {
                    user: user._id,
                    $or: [
                        { 'blog.title': search },
                        { 'blog.searchContent': search }
                    ]
                }
            }
        ];

        const blogs = await Bookmark
                            .aggregate(query)
                            .skip(limit * (page - 1))
                            .limit(limit);
        
        const totalBlogs = await Bookmark.aggregate([
                                                    ...query,
                                                    {
                                                        $group: {
                                                            _id: null,
                                                            count: { $sum: 1 }
                                                        }
                                                    }
                                                ]);

        const data = {
            blogs,
            metaData: {
                start: (limit * (page - 1)) + 1,
                end: limit * page,
                total: totalBlogs[0]?.count || 0,
                page,
                limit
            }
        };

        res.status(200).send(data);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function getBookmarkedBlogsByPrivateUser(req, res) {
    try {
        const limit = +req.query.limit || 10;
        const page = +req.query.page || 1;
        const search = new RegExp(req.query.search, 'i');

        const userId = mongoose.Types.ObjectId(req.id);

        const query = [
            ...populateBlogWithAggregate,
            {
                $match: {
                    user: userId,
                    $or: [
                        { 'blog.title': search },
                        { 'blog.searchContent': search }
                    ]
                }
            }
        ];

        const blogs = await Bookmark
                            .aggregate(query)
                            .skip(limit * (page - 1))
                            .limit(limit);
        
        const totalBlogs = await Bookmark.aggregate([
                                                    ...query,
                                                    {
                                                        $group: {
                                                            _id: null,
                                                            count: { $sum: 1 }
                                                        }
                                                    }
                                                ]);

        const data = {
            blogs,
            metaData: {
                start: (limit * (page - 1)) + 1,
                end: limit * page,
                total: totalBlogs[0]?.count || 0,
                page,
                limit
            }
        };

        res.status(200).send(data);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}


async function getCommentsByPublicUser(req, res) {
    try {
        const { userName } = req.params;

        const user = await User.findOne({ userName });
        if (!user) return res.status(404).send('User does not exists.');

        const limit = +req.query.limit || 10;
        const page = +req.query.page || 1;
        const search = new RegExp(req.query.search, 'i');

        const query = [
            {
                $match: {
                    user: user._id,
                    $or: [
                        { comment: search }
                    ]
                }
            }
        ];

        const comments = await Comment
                            .aggregate([
                                ...query,
                                ...populateSelectedFieldBlogWithAggregate,
                                ...populateUserWithAggregate
                            ])
                            .skip(limit * (page - 1))
                            .limit(limit);
        
        const totalComments = await Comment.count(query);

        const data = {
            comments,
            metaData: {
                start: (limit * (page - 1)) + 1,
                end: limit * page,
                total: totalComments,
                page,
                limit
            }
        };

        res.status(200).send(data);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function getCommentsByPrivateUser(req, res) {
    try {
        const limit = +req.query.limit || 10;
        const page = +req.query.page || 1;
        const search = new RegExp(req.query.search, 'i');

        const userId = mongoose.Types.ObjectId(req.id);

        const query = [
            {
                $match: {
                    user: userId,
                    $or: [
                        { comment: search }
                    ]
                }
            }
        ];
console.log(req.id)
        const comments = await Comment
                            .aggregate([
                                ...query,
                                ...populateSelectedFieldBlogWithAggregate,
                                ...populateUserWithAggregate
                            ])
                            .skip(limit * (page - 1))
                            .limit(limit);
        
        const totalComments = await Comment.count(query);

        const data = {
            comments,
            metaData: {
                start: (limit * (page - 1)) + 1,
                end: limit * page,
                total: totalComments,
                page,
                limit
            }
        };

        res.status(200).send(data);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}


module.exports.signin = signin;
module.exports.signup = signup;
module.exports.logout = logout;

module.exports.getUsers = getUsers;
module.exports.getPublicProfile = getPublicProfile;
module.exports.getPrivateProfile = getPrivateProfile;
module.exports.updateProfile = updateProfile;
module.exports.deleteProfile = deleteProfile;
module.exports.changePassword = changePassword;

module.exports.followUser = followUser;
module.exports.getFollowerUsers = getFollowerUsers;
module.exports.getFollowingUsers = getFollowingUsers;

module.exports.getBlogsByPublicUser = getBlogsByPublicUser;
module.exports.getBlogByPublicUser = getBlogByPublicUser;

module.exports.getBlogsByPrivateUser = getBlogsByPrivateUser;
module.exports.getBlogByPrivateUser = getBlogByPrivateUser;

module.exports.getLikedBlogsByPublicUser = getLikedBlogsByPublicUser;
module.exports.getLikedBlogsByPrivateUser = getLikedBlogsByPrivateUser;

module.exports.getBookmarkedBlogsByPublicUser = getBookmarkedBlogsByPublicUser;
module.exports.getBookmarkedBlogsByPrivateUser = getBookmarkedBlogsByPrivateUser;

module.exports.getCommentsByPublicUser = getCommentsByPublicUser;
module.exports.getCommentsByPrivateUser = getCommentsByPrivateUser;