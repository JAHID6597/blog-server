const path = require('path');
const express = require('express');
const router = express.Router();

const controller = require(path.join(process.cwd(), '/src/modules/blog/comment/comment.controllers'));
const userAuth = require(path.join(process.cwd(), '/src/middlewares/user-auth'));


router.route('/api/blog/:slug/comment/:id')
    .get(controller.getComment)
    .put(userAuth, controller.updateComment)
    .delete(userAuth, controller.deleteComment)

router.get('/api/blog/:slug/comments', controller.getComments);

router.post('/api/blog/:slug/comment', userAuth, controller.createNewComment);


module.exports = router;