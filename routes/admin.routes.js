const path = require("path");
const express = require('express');
const router = express.Router();
const adminAuth = require(path.join(process.cwd(), '/middlewares/adminAuth'));
const controller = require('../controllers/admin.controllers');

router.post('/api/admin/signin', controller.signin);

router.get('/api/admin/logout', adminAuth, controller.logout);

router.get('/api/admin/create', adminAuth, controller.createAdmin);

router.get('/api/admins', adminAuth, controller.getAdmins);

router.get('/api/admin/users', adminAuth, controller.getUsers);   

router.route('/api/admin')
    .get(adminAuth, controller.getPrivateProfile)
    .put(adminAuth, controller.updateProfile)
    .delete(adminAuth, controller.deleteProfile);


router.post('/api/admin/category', adminAuth, controller.createNewCategory);

router.get('/api/admin/categories/', adminAuth, controller.getCategories);

router.route('/api/admin/category/:slug')
    .get(adminAuth, controller.getCategory)
    .put(adminAuth, controller.updateCategory)
    .delete(adminAuth, controller.deleteCategory)    


router.get('/api/admin/:userName', adminAuth, controller.getAdmin);


module.exports = router;