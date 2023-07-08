const path = require("path");
const Category = require(path.join(
    process.cwd(),
    "/src/modules/blog/category/category.model",
));
const Tag = require(path.join(
    process.cwd(),
    "/src/modules/blog/tag/tag.model",
));
const User = require(path.join(process.cwd(), "/src/modules/user/user.model"));
const Blog = require(path.join(process.cwd(), "/src/modules/blog/blog.model"));
const Comment = require(path.join(
    process.cwd(),
    "/src/modules/blog/comment/comment.model",
));
const cloudinary = require(path.join(process.cwd(), "/src/libs/cloudinary"));
const randomColor = require("randomcolor");
const { makeCustomSlug } = require(path.join(process.cwd(), "/src/utils/slug"));

const populateUser = { path: "user", select: "_id userName profilePicture" };
const populateComment = { path: "comments", select: "_id user" };
const populateLike = { path: "likes", select: "_id user" };
const populateBookmark = { path: "bookmarks", select: "_id user" };

async function getBlog(req, res) {
    try {
        const { slug } = req.params;

        const blog = await Blog.findOne({ slug })
            .populate(populateUser)
            .populate(populateComment)
            .populate(populateLike)
            .populate(populateBookmark);
        if (!blog) return res.status(404).send("Not found any blog.");

        res.status(200).send(blog);
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error!");
    }
}

async function getBlogs(req, res) {
    try {
        const limit = +req.query.limit || 10;
        const page = +req.query.page || 1;
        const search = new RegExp(req.query.search, "i");

        let query = {};
        if (search)
            query = {
                ...query,
                $or: [{ title: search }, { searchContent: search }],
            };
        if (req.query.category)
            query = {
                ...query,
                categories: { $in: req.query.category.toLowerCase() },
            };
        if (req.query.tag)
            query = { ...query, tags: { $in: req.query.tag.toLowerCase() } };

        const blogs = await Blog.find(query)
            .skip(limit * (page - 1))
            .limit(limit)
            .sort({ createdAt: "DESC" })
            .populate(populateUser)
            .populate(populateComment)
            .populate(populateLike)
            .populate(populateBookmark);

        const totalBlogs = await Blog.count(query);

        const data = {
            blogs,
            metaData: {
                start: limit * (page - 1) + 1,
                end: limit * page,
                total: totalBlogs,
                page,
                limit,
            },
        };

        res.status(200).send(data);
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error!");
    }
}

async function getReadNextBlogs(req, res) {
    try {
        const { slug } = req.params;

        const blog = await Blog.findOne({ slug });
        if (!blog) return res.status(404).send("Not found any blog.");

        const limit = +req.query.limit || 5;
        const page = +req.query.page || 1;

        let query = {
            slug: { $nin: slug },
            $or: [
                { categories: { $in: blog.categories } },
                { tags: { $in: blog.tags } },
            ],
        };

        const blogs = await Blog.find(query)
            .skip(limit * (page - 1))
            .limit(limit)
            .sort({ createdAt: "DESC" })
            .populate({ path: "user", select: "_id userName profilePicture" });

        const totalBlogs = await Blog.count(query);

        const data = {
            blogs,
            metaData: {
                start: limit * (page - 1) + 1,
                end: limit * page,
                total: totalBlogs,
                page,
                limit,
            },
        };

        res.status(200).send(data);
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error!");
    }
}

async function createNewBlog(req, res) {
    try {
        const {
            title,
            tags,
            categories,
            content,
            searchContent,
            cardImage,
            bannerImage,
        } = req.body;

        const newTags = tags.map((tag) => tag.toLowerCase());

        const cardImageUrl = await cloudinary.uploader.upload(cardImage);
        const bannerImageUrl = await cloudinary.uploader.upload(bannerImage);

        const newBlogData = {
            user: req.id,
            title,
            slug: await makeCustomSlug(title),
            tags: newTags,
            categories,
            content,
            searchContent,
            cardImage: cardImageUrl.secure_url,
            bannerImage: bannerImageUrl.secure_url,
        };

        const blog = new Blog(newBlogData);
        const newBlog = await blog.save();

        await User.findByIdAndUpdate(
            newBlog.user,
            { $push: { blogs: newBlog._id } },
            { new: true },
        );

        for (let i = 0; i < newTags.length; i++) {
            const tagExits = await Tag.findOne({ name: newTags[i] });

            let tagData = {};

            if (!tagExits) {
                const tagBody = {
                    name: newTags[i],
                    createdBy: req.id,
                    blogs: [newBlog._id],
                    color: randomColor({ luminosity: "dark", format: "rgb" }),
                };
                const tag = new Tag(tagBody);
                tagData = await tag.save();
            } else {
                tagData = await Tag.findOneAndUpdate(
                    { name: newTags[i] },
                    { $push: { blogs: newBlog._id } },
                    { new: true },
                );
            }
            const updateTag = await User.findOneAndUpdate(
                { _id: newBlog.user, "usedTags.tagId": tagData._id },
                { $inc: { "usedTags.$.count": 1 } },
                { new: true },
            );
            if (!updateTag) {
                await User.findByIdAndUpdate(
                    newBlog.user,
                    {
                        $push: {
                            usedTags: {
                                tagId: tagData._id,
                                name: tagData.name,
                            },
                        },
                    },
                    { new: true },
                );
            }
        }

        for (let i = 0; i < categories.length; i++) {
            const categoryData = await Category.findOneAndUpdate(
                { name: categories[i] },
                { $push: { blogs: newBlog._id } },
                { new: true },
            );

            const updateCategory = await User.findOneAndUpdate(
                {
                    _id: newBlog.user,
                    "usedCategories.categoryId": categoryData._id,
                },
                { $inc: { "usedCategories.$.count": 1 } },
                { new: true },
            );
            if (!updateCategory) {
                await User.findByIdAndUpdate(
                    newBlog.user,
                    {
                        $push: {
                            usedCategories: {
                                categoryId: categoryData._id,
                                name: categoryData.name,
                            },
                        },
                    },
                    { new: true },
                );
            }
        }

        res.status(200).send(newBlog);
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error!");
    }
}

async function updateBlog(req, res) {
    try {
        const { slug } = req.params;

        const {
            title,
            tags,
            categories,
            content,
            searchContent,
            cardImage,
            bannerImage,
            isActive,
        } = req.body;

        const oldBlog = await Blog.findOne({ slug });
        if (!oldBlog) return res.status(404).send("Blog not found.");

        const removedTags = [];
        oldBlog.tags.forEach((tag) => {
            if (!tags.includes(tag)) removedTags.push(tag);
        });

        const newTags = [];
        tags.forEach((tag) => {
            if (!oldBlog.tags.includes(tag)) newTags.push(tag);
        });

        const removedCategories = [];
        oldBlog.categories.forEach((category) => {
            if (!categories.includes(category))
                removedCategories.push(category);
        });

        const newCategories = [];
        categories.forEach((category) => {
            if (!oldBlog.categories.includes(category))
                newCategories.push(category);
        });

        const updatedBlogData = {
            title,
            slug:
                !title || oldBlog.title === title
                    ? oldBlog.slug
                    : await makeCustomSlug(title),
            tags,
            categories,
            content,
            searchContent,
            cardImage:
                !cardImage || cardImage.indexOf("http") === 0
                    ? oldBlog.cardImage
                    : (await cloudinary.uploader.upload(cardImage)).secure_url,
            bannerImage:
                !bannerImage || bannerImage.indexOf("http") === 0
                    ? oldBlog.bannerImage
                    : (await cloudinary.uploader.upload(bannerImage))
                          .secure_url,
            isActive,
        };

        const blog = await Blog.findOneAndUpdate({ slug }, updatedBlogData, {
            new: true,
        })
            .populate(populateUser)
            .populate(populateComment)
            .populate(populateLike)
            .populate(populateBookmark);

        for (let i = 0; i < removedTags.length; i++) {
            await User.findOneAndUpdate(
                { _id: blog.user, "usedTags.name": removedTags[i] },
                { $inc: { "usedTags.$.count": -1 } },
                { new: true },
            );
        }

        for (let i = 0; i < newTags.length; i++) {
            const tagBody = {
                name: newTags[i],
                createdBy: req.id,
                blogs: [blog._id],
                color: randomColor({ luminosity: "dark", format: "rgb" }),
            };
            const tag = new Tag(tagBody);
            tagData = await tag.save();

            await User.findByIdAndUpdate(
                blog.user,
                {
                    $push: {
                        usedTags: { tagId: tagData._id, name: tagData.name },
                    },
                },
                { new: true },
            );
        }

        for (let i = 0; i < removedCategories.length; i++) {
            await User.findOneAndUpdate(
                { _id: blog.user, "usedCategories.name": removedCategories[i] },
                { $inc: { "usedCategories.$.count": -1 } },
                { new: true },
            );
        }

        for (let i = 0; i < newCategories.length; i++) {
            const categoryData = await Category.findOne(
                { name: newCategories[i] },
                { $push: { blogs: blog._id } },
                { new: true },
            );

            await User.findByIdAndUpdate(
                blog.user,
                {
                    $push: {
                        usedCategories: {
                            categoryId: categoryData._id,
                            name: categoryData.name,
                        },
                    },
                },
                { new: true },
            );
        }

        res.status(200).send(blog);
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error!");
    }
}

async function deleteBlog(req, res) {
    try {
        const { slug } = req.params;

        const isBlogExists = await Blog.findOne({ slug });
        if (!isBlogExists) return res.status(404).send("Blog not found.");

        const blog = await Blog.findOneAndDelete({ slug });

        await User.findByIdAndUpdate(
            blog.user,
            { $pull: { blogs: blog._id } },
            { new: true },
        );

        for (let i = 0; i < blog.tags.length; i++) {
            await User.findOneAndUpdate(
                { _id: blog.user, "usedTags.name": blog.tags[i] },
                { $inc: { "usedTags.$.count": -1 } },
                { new: true },
            );
        }

        for (let i = 0; i < blog.categories.length; i++) {
            await User.findOneAndUpdate(
                { _id: blog.user, "usedCategories.name": blog.categories[i] },
                { $inc: { "usedCategories.$.count": -1 } },
                { new: true },
            );
        }

        for (let i = 0; i < blog.comments.length; i++) {
            await User.findByIdAndUpdate(
                blog.user,
                { $pull: { comments: blog.comments[i] } },
                { new: true },
            );
            await Comment.findByIdAndDelete(blog.comments[i]);
        }

        res.status(200).send(blog);
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error!");
    }
}

module.exports.getBlog = getBlog;
module.exports.getBlogs = getBlogs;
module.exports.getReadNextBlogs = getReadNextBlogs;
module.exports.createNewBlog = createNewBlog;
module.exports.updateBlog = updateBlog;
module.exports.deleteBlog = deleteBlog;
