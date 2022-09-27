const path = require("path");
const Category = require(path.join(process.cwd(), "/src/modules/blog/category/category.model"));
const randomColor = require('randomcolor');



async function getCategory(req, res) {
    try {
        const { slug } = req.params;
        
        const category = await Category.findOne({ slug });

        res.status(200).send(category);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function getCategories(req, res) {
    try {
        const limit = +req.query.limit || 10;
        const page = +req.query.page || 1;

        const categories = await Category
                                    .find()
                                    .skip(limit * (page - 1))
                                    .limit(limit)
                                    .sort({ createdAt: 'DESC' });
        const totalCategories = await Category.count();

        const data = {
            categories,
            metaData: {
                start: (limit * (page - 1)) + 1,
                end: limit * page,
                total: totalCategories,
                page,
                limit
            }
        };

        res.status(200).send(data);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function createNewCategory(req, res) {
    try {
        const { name, description, image } = req.body;

        const category = new Category(
            { name, description, image, color: randomColor({ luminosity: 'dark', format: 'rgb' }), createdBy: req.id }
        );
        const newCategory = await category.save();

        res.status(200).send(newCategory);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function updateCategory(req, res) {
    try {
        const { slug } = req.params;

        const { name, description, image } = req.body;

        const category = await Category.findOneAndUpdate({ slug }, { name, description, image }, { new: true });

        res.status(200).send(category);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function deleteCategory(req, res) {
    try {
        const { slug } = req.params;
        
        const category = await Category.findOneAndDelete({ slug });

        res.status(200).send(category);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}



module.exports.getCategory = getCategory;
module.exports.getCategories = getCategories;
module.exports.createNewCategory = createNewCategory;
module.exports.updateCategory = updateCategory;
module.exports.deleteCategory = deleteCategory;