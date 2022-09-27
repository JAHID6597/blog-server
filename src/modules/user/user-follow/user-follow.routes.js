const express = require('express');
const router = express.Router();
const path = require("path");
const userAuth = require(path.join(process.cwd(), '/src/middlewares/user-auth'));
const controller = require('./user-follow.controllers');



router.post('/api/user/:userName/follow', userAuth, controller.followUser);

router.get('/api/user/:userName/followers', controller.getFollowerUsers);

router.get('/api/user/:userName/followings', controller.getFollowingUsers);



module.exports = router;