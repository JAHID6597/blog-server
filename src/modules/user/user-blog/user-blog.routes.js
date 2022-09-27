const express = require('express');
const router = express.Router();
const controller = require('./user-blog.controllers');



router.get('/api/user/:userName/blogs', controller.getBlogsByPublicUser);
router.get('/api/user/:userName/blog/:slug', controller.getBlogByPublicUser);

router.get('/api/user/:userName/blogs/liked', controller.getLikedBlogsByPublicUser);
router.get('/api/user/blogs/liked', controller.getLikedBlogsByPrivateUser);

router.get('/api/user/:userName/blogs/bookmarked', controller.getBookmarkedBlogsByPublicUser);
router.get('/api/user/blogs/bookmarked', controller.getBookmarkedBlogsByPrivateUser);
    


module.exports = router;