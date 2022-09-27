const path = require('path');
const express = require('express');
const router = express.Router();

const blogController = require(path.join(process.cwd(), '/src/modules/blog/blog.controllers'));
const userAuth = require(path.join(process.cwd(), '/src/middlewares/user-auth'));
const validateFile = require(path.join(process.cwd(), '/src/middlewares/validate-file'));
const multer = require(path.join(process.cwd(), '/src/libs/multer'));

const commentRoutes = require(path.join(process.cwd(), '/src/modules/blog/comment/comment.routes'));
const categoryRoutes = require(path.join(process.cwd(), '/src/modules/blog/category/category.routes'));
const tagRoutes = require(path.join(process.cwd(), '/src/modules/blog/tag/tag.routes'));


router.use(commentRoutes);
router.use(categoryRoutes);
router.use(tagRoutes);



router.post(
    "/api/blog",
    userAuth,
    validateFile(
        multer.fields([
            { name: "cardImage", maxCount: 1 },
            { name: "bannerImage", maxCount: 1 },
        ])
    ),
    blogController.createNewBlog
);

router.get('/api/blogs', blogController.getBlogs);

router.get('/api/blog/:slug/read-next', blogController.getReadNextBlogs);

router
    .route("/api/blog/:slug")
    .get(blogController.getBlog)
    .put(
        userAuth,
        validateFile(
            multer.fields([
                { name: "cardImage", maxCount: 1 },
                { name: "bannerImage", maxCount: 1 },
            ])
        ),
        blogController.updateBlog
    )
    .delete(userAuth, blogController.deleteBlog);



module.exports = router;