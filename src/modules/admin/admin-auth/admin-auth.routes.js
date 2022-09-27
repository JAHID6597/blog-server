const path = require("path");
const express = require('express');
const router = express.Router();

const adminAuth = require(path.join(process.cwd(), '/src/middlewares/admin-auth'));
const controller = require('./admin-auth.controllers');



router.post('/api/admin/signin', controller.signin);

router.get('/api/admin/logout', adminAuth, controller.logout);



module.exports = router;