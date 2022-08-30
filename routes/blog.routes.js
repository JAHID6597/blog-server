const path = require('path');
const express = require('express');
const router = express.Router();

const blogController = require(path.join(process.cwd(), '/controllers/blog.controllers'));
const commentController = require(path.join(process.cwd(), '/controllers/comment.controllers'));
const userAuth = require(path.join(process.cwd(), '/middlewares/userAuth'));
const validateFile = require(path.join(process.cwd(), '/middlewares/validate-file'));
const multer = require(path.join(process.cwd(), '/lib/multer'));


router.post('/api/blog', userAuth, validateFile(multer.fields([{ name: 'cardImage', maxCount: 1 }, { name: 'bannerImage', maxCount: 1 }])), blogController.createNewBlog);

router.get('/api/blogs', blogController.getBlogs);

router.get('/api/blog/:slug/read-next', blogController.getReadNextBlogs);

router.route('/api/blog/:slug')
    .get(blogController.getBlog)
    .put(userAuth, validateFile(multer.fields([{ name: 'cardImage', maxCount: 1 }, { name: 'bannerImage', maxCount: 1 }])), blogController.updateBlog)
    .delete(userAuth, blogController.deleteBlog);

router.post('/api/blog/:slug/like', userAuth, blogController.likeBlog);

router.post('/api/blog/:slug/bookmark', userAuth, blogController.bookmarkBlog);


router.route('/api/blog/:slug/comment/:id')
    .get(commentController.getComment)
    .put(userAuth, commentController.updateComment)
    .delete(userAuth, commentController.deleteComment)

router.get('/api/blog/:slug/comments', commentController.getComments);

router.post('/api/blog/:slug/comment', userAuth, commentController.createNewComment);


module.exports = router;