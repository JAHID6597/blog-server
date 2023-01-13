const path = require('path');
const express = require('express');
const router = express.Router();

const bookmarkController = require(path.join(process.cwd(), '/src/modules/blog/bookmark/bookmark.controllers'));
const userAuth = require(path.join(process.cwd(), '/src/middlewares/user-auth'));


router.post('/api/blog/:slug/bookmark', userAuth, bookmarkController.bookmarkBlog);


module.exports = router;