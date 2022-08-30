const express = require('express');
const router = express.Router();
const path = require('path');

const controller = require(path.join(process.cwd(), '/controllers/category.controllers'));


router.get('/api/categories', controller.getCategories);

router.get('/api/category/:slug', controller.getCategory);

router.get('/api/category/:slug/blogs', controller.getBlogsByCategory);


module.exports = router;