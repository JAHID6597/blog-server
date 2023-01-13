const path = require('path');
const express = require('express');
const router = express.Router();

const likeController = require(path.join(process.cwd(), '/src/modules/blog/like/like.controllers'));
const userAuth = require(path.join(process.cwd(), '/src/middlewares/user-auth'));


router.post('/api/blog/:slug/like', userAuth, likeController.likeBlog);


module.exports = router;