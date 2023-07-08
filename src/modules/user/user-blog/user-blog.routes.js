const express = require("express");
const router = express.Router();
const path = require("path");
const userAuth = require(path.join(
    process.cwd(),
    "/src/middlewares/user-auth",
));
const controller = require("./user-blog.controllers");

router.get("/api/user/blogs", userAuth, controller.getBlogsByPrivateUser);
router.get("/api/user/blog/:slug", userAuth, controller.getBlogByPrivateUser);

router.get("/api/user/:userName/blogs", controller.getBlogsByPublicUser);
router.get("/api/user/:userName/blog/:slug", controller.getBlogByPublicUser);

router.get(
    "/api/user/:userName/blogs/liked",
    controller.getLikedBlogsByPublicUser,
);
router.get(
    "/api/user/blogs/liked",
    userAuth,
    controller.getLikedBlogsByPrivateUser,
);

router.get(
    "/api/user/:userName/blogs/bookmarked",
    controller.getBookmarkedBlogsByPublicUser,
);
router.get(
    "/api/user/blogs/bookmarked",
    userAuth,
    controller.getBookmarkedBlogsByPrivateUser,
);

router.get(
    "/api/user/:userName/blogs/comments",
    controller.getCommentsByPublicUser,
);
router.get(
    "/api/user/blogs/comments",
    userAuth,
    controller.getCommentsByPrivateUser,
);

module.exports = router;
