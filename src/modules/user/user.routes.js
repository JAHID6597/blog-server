const express = require('express');
const router = express.Router();
const path = require("path");
const userAuth = require(path.join(process.cwd(), '/src/middlewares/user-auth'));
const controller = require('./user.controllers');
const validateFile = require(path.join(process.cwd(), '/src/middlewares/validate-file'));
const multer = require(path.join(process.cwd(), '/src/libs/multer'));

const userAuthRoutes = require(path.join(process.cwd(), '/src/modules/user/user-auth/user-auth.routes'));
const userBlogRoutes = require(path.join(process.cwd(), '/src/modules/user/user-blog/user-blog.routes'));
const userFollowRoutes = require(path.join(process.cwd(), '/src/modules/user/user-follow/user-follow.routes'));


router.use(userAuthRoutes);
router.use(userBlogRoutes);
router.use(userFollowRoutes);



router.get('/api/users', controller.getUsers);

router.patch('/api/user/change-password', userAuth, controller.changePassword);

router.get('/api/user/:userName', controller.getPublicProfile);

router.route('/api/user')
    .get(userAuth, controller.getPrivateProfile)
    .put(userAuth, validateFile(multer.single('profilePicture')), controller.updateProfile)
    .delete(userAuth, controller.deleteProfile)



module.exports = router;