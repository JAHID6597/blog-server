const path = require("path");
const express = require('express');
const router = express.Router();

const adminAuth = require(path.join(process.cwd(), '/src/middlewares/admin-auth'));
const controller = require('./admin-category.controllers');


router.post('/api/admin/category', adminAuth, controller.createNewCategory);

router.get('/api/admin/categories/', adminAuth, controller.getCategories);

router.route('/api/admin/category/:slug')
    .get(adminAuth, controller.getCategory)
    .put(adminAuth, controller.updateCategory)
    .delete(adminAuth, controller.deleteCategory)    




module.exports = router;