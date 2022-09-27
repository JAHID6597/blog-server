const express = require('express');
const router = express.Router();
const path = require("path");
const userAuth = require(path.join(process.cwd(), '/src/middlewares/user-auth'));
const controller = require('./user-auth.controllers');


router.post('/api/user/signin', controller.signin);

router.post('/api/user/signup', controller.signup);

router.get('/api/user/logout', userAuth, controller.logout);


module.exports = router;