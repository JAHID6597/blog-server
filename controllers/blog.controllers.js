const path = require("path");
const Category = require(path.join(process.cwd(), "/models/category.model"));
const Tag = require(path.join(process.cwd(), "/models/tag.model"));
const Blog = require(path.join(process.cwd(), "/models/blog.model"));
const Like = require(path.join(process.cwd(), "/models/like.model"));
const Bookmark = require(path.join(process.cwd(), "/models/bookmark.model"));
const cloudinary = require(path.join(process.cwd(), "/lib/cloudinary"));
const randomColor = require('randomcolor');
const { makeCustomSlug } = require(path.join(process.cwd(), "/utils/slug"));


const populateUser = { path: 'user', select: '_id userName profilePicture' };
const populateComment = { path: 'comments', select: '_id user' };
const populateLike = { path: 'likes', select: '_id user' };
const populateBookmark = { path: 'bookmarks', select: '_id user' };


async function getBlog(req, res) {
    try {
        const { slug } = req.params;
        
        const blog = await Blog
                            .findOne({ slug })
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

async function getBlogs(req, res) {
    try {
        const limit = +req.query.limit || 10;
        const page = +req.query.page || 1;
        const search = new RegExp(req.query.search, 'i');

        let query = {};
        if (search) query = { ...query, $or: [{ title: search }, { searchContent: search }] };
        if (req.query.category) query = { ...query, categories: { $in: req.query.category.toLowerCase() } };
        if (req.query.tag) query = { ...query, tags: { $in: req.query.tag.toLowerCase() } };

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

async function getReadNextBlogs(req, res) {
    try {
        const { slug } = req.params;
        
        const blog = await Blog.findOne({ slug });
        if (!blog) return res.status(404).send('Not found any blog.');
        
        const limit = +req.query.limit || 5;
        const page = +req.query.page || 1;

        let query = {
            slug: { $nin: slug },
            $or: [
                { categories: { $in: blog.categories } },
                { tags: { $in: blog.tags } }
            ]
        };

        const blogs = await Blog
                            .find(query)
                            .skip(limit * (page - 1))
                            .limit(limit)
                            .sort({ createdAt: 'DESC' })
                            .populate({ path: 'user', select: '_id userName profilePicture' });
        
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

async function createNewBlog(req, res) {
    try {
        const { title, tags, categories, content, searchContent, cardImage, bannerImage } = req.body;

        const newTags = tags.map(tag => tag.toLowerCase());

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
            bannerImage: bannerImageUrl.secure_url
        };

        const blog = new Blog(newBlogData);
        const newBlog = await blog.save();

        await User.findByIdAndUpdate(newBlog.user, { $push: { blogs: newBlog._id } }, { new: true });

        for (let i = 0; i < newTags.length; i++) {
            const tagExits = await Tag.findOne({ name: newTags[i] });

            if (!tagExits) {
                const tag = new Tag(
                    {
                        name: newTags[i],
                        createdBy: req.id,
                        blogs: [newBlog._id],
                        color: randomColor({ luminosity: 'dark', format: 'rgb' })
                    }
                );
                await tag.save();
            } else {
                await Tag.findOneAndUpdate({ name: newTags[i] }, { $push: { blogs: newBlog._id } }, { new: true });
            }
        }

        for (let i = 0; i < categories.length; i++) { 
            await Category.findOneAndUpdate({ name: categories[i] }, { $push: { blogs: newBlog._id } }, { new: true });
        }

        res.status(200).send(newBlog);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function updateBlog(req, res) {
    try {
        const { slug } = req.params;

        const { title, tags, categories, content, searchContent, cardImage, bannerImage, isActive } = req.body;

        const oldBlog = await Blog.findOne({ slug });
        if (!oldBlog) return res.status(404).send('Blog not found.');

        const updatedBlogData = {
            title,
            slug: !title || oldBlog.title === title ? oldBlog.slug : await makeCustomSlug(title),
            tags,
            categories,
            content,
            searchContent,
            cardImage: !cardImage || cardImage.indexOf('http') === 0 ? oldBlog.cardImage : (await cloudinary.uploader.upload(cardImage)).secure_url,
            bannerImage: !bannerImage || bannerImage.indexOf('http') === 0 ? oldBlog.bannerImage : (await cloudinary.uploader.upload(bannerImage)).secure_url,
            isActive,
        };

        const blog = await Blog
                            .findOneAndUpdate({ slug }, updatedBlogData, { new: true })
                            .populate(populateUser)
                            .populate(populateComment)
                            .populate(populateLike)
                            .populate(populateBookmark);

        res.status(200).send(blog);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function deleteBlog(req, res) {
    try {
        const { slug } = req.params;

        const isBlogExists = await Blog.findOne({ slug });
        if (!isBlogExists) return res.status(404).send('Blog not found.');
        
        const blog = await Blog.findOneAndDelete({ slug });

        await User.findByIdAndUpdate(blog.user, { $pull: { blogs: blog._id } }, { new: true });

        res.status(200).send(blog);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}


async function likeBlog(req, res) {
    try {
        const { slug } = req.params;

        const blog = await Blog.findOne({ slug });
        if(!blog) return res.status(404).send('Not found any blog.');

        const liked = await Like.findOne({ user: req.id, blog: blog._id });
        if (liked) {
            const deleteLiked = await liked.delete();

            const updatedBlog = await Blog
                                    .findOneAndUpdate({ slug }, { $pull: { likes: deleteLiked._id } }, { new: true })
                                    .populate(populateUser)
                                    .populate(populateComment)
                                    .populate(populateLike)
                                    .populate(populateBookmark);
            return res.status(200).send(updatedBlog);
        }

        const newLike = new Like({ user: req.id, blog: blog._id });
        const newLiked = await newLike.save();

        const updatedBlog = await Blog
                                .findOneAndUpdate({ slug }, { $push: { likes: newLiked._id } }, { new: true })
                                .populate(populateUser)
                                .populate(populateComment)
                                .populate(populateLike)
                                .populate(populateBookmark);
        return res.status(200).send(updatedBlog);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function bookmarkBlog(req, res) {
    try {
        const { slug } = req.params;

        const blog = await Blog.findOne({ slug });
        if(!blog) return res.status(404).send('Not found any blog.');

        const bookmarked = await Bookmark.findOne({ user: req.id, blog: blog._id });
        if (bookmarked) {
            const deleteBookmarked = await bookmarked.delete();

            const updatedBlog = await Blog
                                    .findOneAndUpdate({ slug }, { $pull: { bookmarks: deleteBookmarked._id } }, { new: true })
                                    .populate(populateUser)
                                    .populate(populateComment)
                                    .populate(populateLike)
                                    .populate(populateBookmark);
            return res.status(200).send(updatedBlog);
        }

        const newBookmark = new Bookmark({ user: req.id, blog: blog._id });
        const newBookmarked = await newBookmark.save();

        const updatedBlog = await Blog
                                .findOneAndUpdate({ slug }, { $push: { bookmarks: newBookmarked._id } }, { new: true })
                                .populate(populateUser)
                                .populate(populateComment)
                                .populate(populateLike)
                                .populate(populateBookmark);
        return res.status(200).send(updatedBlog);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}


module.exports.getBlog = getBlog;
module.exports.getBlogs = getBlogs;
module.exports.getReadNextBlogs = getReadNextBlogs;
module.exports.createNewBlog = createNewBlog;
module.exports.updateBlog = updateBlog;
module.exports.deleteBlog = deleteBlog;
module.exports.likeBlog = likeBlog;
module.exports.bookmarkBlog = bookmarkBlog;