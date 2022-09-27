const path = require("path");
const express = require('express');
const router = express.Router();

const adminAuth = require(path.join(process.cwd(), '/src/middlewares/admin-auth'));
const controller = require('./admin.controllers');

const adminAuthRoutes = require(path.join(process.cwd(), '/src/modules/admin/admin-auth/admin-auth.routes'));
const adminCategoryRoutes = require(path.join(process.cwd(), '/src/modules/admin/admin-category/admin-category.routes'));

router.use(adminAuthRoutes);
router.use(adminCategoryRoutes);


router.get('/api/admin/create', adminAuth, controller.createAdmin);

router.get('/api/admins', adminAuth, controller.getAdmins);

router.get('/api/admin/users', adminAuth, controller.getUsers);   

router.route('/api/admin')
    .get(adminAuth, controller.getPrivateProfile)
    .put(adminAuth, controller.updateProfile)
    .delete(adminAuth, controller.deleteProfile);  


router.get('/api/admin/:userName', adminAuth, controller.getAdmin);


module.exports = router;