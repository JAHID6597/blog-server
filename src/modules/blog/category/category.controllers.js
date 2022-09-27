const path = require("path");
const Category = require(path.join(process.cwd(), "/src/modules/blog/category/category.model"));
const Blog = require(path.join(process.cwd(), "/src/modules/blog/blog.model"));


const populateUser = { path: 'user', select: '_id userName profilePicture' };
const populateComment = { path: 'comments', select: '_id user' };
const populateLike = { path: 'likes', select: '_id user' };
const populateBookmark = { path: 'bookmarks', select: '_id user' };


async function getCategory(req, res) {
    try {
        const { slug } = req.params;
        
        const category = await Category.findOne({ slug });
        if (!category) return res.status(400).send('Not found any category.');

        res.status(200).send(category);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function getCategories(req, res) {
    try {
        const limit = +req.query.limit || 25;
        const page = +req.query.page || 1;
        const search = new RegExp(req.query.search, 'i');
        
        const categories = await Category
                                .aggregate([
                                    {
                                        $match:
                                        {
                                            $or: [ { name: search } ]
                                        }
                                    },
                                    {
                                        $addFields : { blogsCount: {$size: { "$ifNull": [ "$blogs", [] ] } } }
                                    }, 
                                    {   
                                        $sort: { "blogsCount": -1 } 
                                    },
                                    {
                                        $lookup: {
                                            from: "blogs",
                                            localField: "blogs",
                                            pipeline: [ { $limit: limit } ],
                                            foreignField: "_id",
                                            as: 'blogs'
                                        }
                                    }
                                ])
                                .skip(limit * (page - 1))
                                .limit(limit);

        const totalCategories = await Category.count({ $or: [ { name: search } ] });
        
        const data = {
            categories,
            metaData: {
                start: (limit * (page - 1)) + 1,
                end: limit * page,
                total: totalCategories,
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

async function getBlogsByCategory(req, res) {
    try {
        const slug = req.params.slug;

        const category = await Category.findOne({ slug });
        if (!category) return res.status(400).send('Not found any category.');

        const limit = +req.query.limit || 10;
        const page = +req.query.page || 1;

        const query = { categories: { $in: category.name } };

        const blogs = await Blog
                            .find(query)
                            .skip(limit * (page - 1))
                            .limit(limit)
                            .sort({ createdAt: 'DESC' })
                            .populate(populateUser)
                            .populate(populateComment)
                            .populate(populateLike)
                            .populate(populateBookmark);
        
        const totalBlogs = await Blog.count(query);

        const data = {
            blogs,
            metaData: {
                start: (limit * (page - 1)) + 1,
                end: limit * page,
                total: totalBlogs,
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


module.exports.getCategory = getCategory;
module.exports.getCategories = getCategories;
module.exports.getBlogsByCategory = getBlogsByCategory;