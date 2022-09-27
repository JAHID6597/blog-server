const path = require("path");
const Blog = require(path.join(process.cwd(), "/src/modules/blog/blog.model"));
const Bookmark = require(path.join(process.cwd(), "/src/modules/blog/bookmark/bookmark.model"));

const populateUser = { path: 'user', select: '_id userName profilePicture' };
const populateComment = { path: 'comments', select: '_id user' };
const populateLike = { path: 'likes', select: '_id user' };
const populateBookmark = { path: 'bookmarks', select: '_id user' };



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



module.exports.bookmarkBlog = bookmarkBlog;