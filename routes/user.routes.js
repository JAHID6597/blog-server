const express = require('express');
const router = express.Router();
const path = require("path");
const userAuth = require(path.join(process.cwd(), '/middlewares/userAuth'));
const controller = require('../controllers/user.controllers');
const validateFile = require(path.join(process.cwd(), '/middlewares/validate-file'));
const multer = require(path.join(process.cwd(), '/lib/multer'));


router.post('/api/user/signin', controller.signin);

router.post('/api/user/signup', controller.signup);

router.get('/api/user/logout', userAuth, controller.logout);

router.get('/api/users', controller.getUsers);

router.get('/api/user/blogs', userAuth, controller.getBlogsByPrivateUser);
router.get('/api/user/blog/:slug', userAuth, controller.getBlogByPrivateUser);

router.get('/api/user/comments', userAuth, controller.getCommentsByPrivateUser);
router.get('/api/user/:userName/comments', controller.getCommentsByPublicUser);

router.patch('/api/user/change-password', userAuth, controller.changePassword);

router.get('/api/user/:userName', controller.getPublicProfile);

router.route('/api/user')
    .get(userAuth, controller.getPrivateProfile)
    .put(userAuth, validateFile(multer.single('profilePicture')), controller.updateProfile)
    .delete(userAuth, controller.deleteProfile)

router.post('/api/user/:userName/follow', userAuth, controller.followUser);

router.get('/api/user/:userName/followers', controller.getFollowerUsers);

router.get('/api/user/:userName/followings', controller.getFollowingUsers);

router.get('/api/user/:userName/blogs', controller.getBlogsByPublicUser);
router.get('/api/user/:userName/blog/:slug', controller.getBlogByPublicUser);

router.get('/api/user/:userName/blogs/liked', controller.getLikedBlogsByPublicUser);
router.get('/api/user/blogs/liked', controller.getLikedBlogsByPrivateUser);

router.get('/api/user/:userName/blogs/bookmarked', controller.getBookmarkedBlogsByPublicUser);
router.get('/api/user/blogs/bookmarked', controller.getBookmarkedBlogsByPrivateUser);
    


module.exports = router;