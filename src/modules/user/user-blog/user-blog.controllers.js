const path = require("path");
const User = require(path.join(process.cwd(), '/src/modules/user/user.model'));
const Blog = require(path.join(process.cwd(), "/src/modules/blog/blog.model"));
const Like = require(path.join(process.cwd(), "/src/modules/blog/like/like.model"));
const Comment = require(path.join(process.cwd(), "/src/modules/blog/comment/comment.model"));
const Bookmark = require(path.join(process.cwd(), "/src/modules/blog/bookmark/bookmark.model"));
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