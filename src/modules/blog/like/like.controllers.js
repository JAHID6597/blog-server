const path = require("path");
const User = require(path.join(process.cwd(), '/src/modules/user/user.model'));
const Blog = require(path.join(process.cwd(), "/src/modules/blog/blog.model"));
const Like = require(path.join(process.cwd(), "/src/modules/blog/like/like.model"));

const populateUser = { path: 'user', select: '_id userName profilePicture' };
const populateComment = { path: 'comments', select: '_id user' };
const populateLike = { path: 'likes', select: '_id user' };
const populateBookmark = { path: 'bookmarks', select: '_id user' };


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
            
            await User.findByIdAndUpdate(blog.user, { $pull: { likedBlogs: deleteLiked._id } }, { new: true });
            
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
        
        await User.findByIdAndUpdate(blog.user, { $push: { likedBlogs: newLiked._id } }, { new: true });
        
        return res.status(200).send(updatedBlog);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

module.exports.likeBlog = likeBlog;