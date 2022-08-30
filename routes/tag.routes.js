const path = require('path');
const express = require('express');
const router = express.Router();

const controller = require('../controllers/tag.controllers');
const userAuth = require(path.join(process.cwd(), '/middlewares/userAuth'));


router.route('/api/tag/:slug')
    .get(controller.getTag)
    .put(userAuth, controller.updateTag)
    .delete(userAuth, controller.deleteTag)

router.get('/api/tags', controller.getTags);

router.post('/api/tag', userAuth, controller.createNewTag);

router.get('/api/tag/:slug/blogs', controller.getBlogsByTag);


module.exports = router;