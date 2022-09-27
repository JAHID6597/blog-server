const path = require('path');
const express = require('express');
const router = express.Router();

const blogController = require(path.join(process.cwd(), '/controllers/blog.controllers'));
const userAuth = require(path.join(process.cwd(), '/src/middlewares/user-auth'));


router.post('/api/blog/:slug/like', userAuth, blogController.likeBlog);


module.exports = router;