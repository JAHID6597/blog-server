const path = require("path");
const User = require(path.join(process.cwd(), "/src/modules/user/user.model"));
const Blog = require(path.join(process.cwd(), "/src/modules/blog/blog.model"));
const Comment = require(path.join(process.cwd(), "/src/modules/blog/comment/comment.model"));


async function getComment(req, res) {
    try {
        const { slug, id } = req.params;
        
        const blog = await Blog.findOne({ slug });
        if (!blog) return res.status(404).send('Not found any blog.');
        
        const comment = await Comment.findById(id);

        res.status(200).send(comment);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function getComments(req, res) {
    try {
        const { slug } = req.params;
        
        const blog = await Blog.findOne({ slug });
        if (!blog) return res.status(404).send('Not found any blog.');

        const limit = req.query.limit || 10;
        const page = req.query.page || 1;
        const search = new RegExp(req.query.search, 'i');

        let query = { blog: blog._id };
        if (search) query = { ...query, comment: search };

        const comments = await Comment
                            .find(query)
                            .skip(limit * (page - 1))
                            .limit(limit)
                            .sort({ createdAt: 'DESC' })
                            .populate({
                                path: 'user',
                                select: '_id userName profilePicture'
                            });
        
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

async function createNewComment(req, res) {
    try {
        const { slug } = req.params;
        
        const blog = await Blog.findOne({ slug });
        if (!blog) return res.status(404).send('Not found any blog.');

        const { comment } = req.body;

        const commentData = new Comment({ user: req.id, comment, blog: blog._id });
        const newComment = await commentData
                                .save()
                                .then(cmnt => cmnt.populate({
                                    path: 'user',
                                    select: '_id userName profilePicture'
                                }));

        await Blog.findOneAndUpdate({ slug }, { $push: { comments: newComment._id } }, { new: true });
        
        await User.findByIdAndUpdate(newComment.user, { $push: { comments: newComment._id } }, { new: true });

        res.status(200).send(newComment);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function updateComment(req, res) {
    try {
        const { slug, id } = req.params;
        
        const blog = await Blog.findOne({ slug });
        if (!blog) return res.status(404).send('Not found any blog.');

        const { comment, isActive } = req.body;
        const updateBody = { comment, isActive };

        const updatedComment = await Comment.findByIdAndUpdate(id, updateBody, { new: true });

        res.status(200).send(updatedComment);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function deleteComment(req, res) {
    try {
        const { slug, id } = req.params;
        
        const blog = await Blog.findOne({ slug });
        if (!blog) return res.status(404).send('Not found any blog.');
        
        const comment = await Comment.findByIdAndDelete(id);

        await Blog.findOneAndUpdate({ slug }, { $pull: { comments: comment._id } }, { new: true });
        
        await User.findByIdAndUpdate(comment.user, { $pull: { comments: comment._id } }, { new: true });

        res.status(200).send(comment);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}


module.exports.getComment = getComment;
module.exports.getComments = getComments;
module.exports.createNewComment = createNewComment;
module.exports.updateComment = updateComment;
module.exports.deleteComment = deleteComment;