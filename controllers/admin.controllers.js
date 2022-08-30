const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require("path");
const Admin = require(path.join(process.cwd(), '/models/admin.model'));
const User = require(path.join(process.cwd(), '/models/user.model'));
const Category = require(path.join(process.cwd(), "/models/category.model"));
const randomColor = require('randomcolor');


async function signin(req, res) {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(400).send('Invalid credentials.');
        
        const isPasswordCorrect = await admin.comparePassword(password);
        if (!isPasswordCorrect) return res.status(400).send('Invalid credentials.');
        
        if (admin.email === email && isPasswordCorrect) {
            const token = jwt.sign({ id: admin._id }, process.env.ADMIN_TOKEN_SECRET, { expiresIn: '1h' });

            return res.status(200).send({ accessToken: token });
        }
        else res.status(400).send('Invalid Credentials');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function logout(req, res) {
    try {
        res.status(200).send('Successfully logged out');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}


async function createAdmin(req, res) {
    try {
        const { userName, email, password, confirmPassword } = req.body;

        const existAdmin = await Admin.findOne({ userName });
        if(existAdmin) return res.status(400).send('Admin already exists.');

        if(password !== confirmPassword) return res.status('Password does not match.');

        const admin = new Admin({ userName, email, password });

        await admin.save();

        res.status(201).send('Successfully created admin.');
    }
    catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function getAdmins(req, res) {
    try {
        const limit = req.query.limit || 10;
        const page = req.query.page || 1;

        const admins = await Admin
                                .find()
                                .skip(limit * (page - 1))
                                .limit(limit);
        
        const totalAdmins = await Admin.count();

        const data = {
            admins,
            metaData: {
                start: (limit * (page - 1)) + 1,
                end: limit * page,
                total: totalAdmins,
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

async function getAdmin(req, res) {
    try {
        const { userName } = req.params;

        const admin = await Admin
                            .findOne({ userName })
                            .select("-password");
        if (!admin) return res.status(404).send('Admin does not exists.');

        res.status(200).send(admin);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function getPrivateProfile(req, res) {
    try {
        const admin = await Admin
                            .findById(req.id)
                            .select("-password");
        if (!admin) return res.status(404).send('Admin does not exists.');

        res.status(200).send(admin);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function updateProfile(req, res) {
    try {
        const admin = await Admin.findById(req.id);
        if (!admin) return res.status(404).send('Admin does not exists.');

        const { firstName, lastName } = req.body;

        const updatedAdmin = await Admin.findByIdAndUpdate(req.id, { firstName, lastName }, { new: true });

        res.status(200).send(updatedAdmin);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function deleteProfile(req, res) {
    try {
        const admin = await Admin.findById(req.id);
        if (!admin) return res.status(404).send('Admin does not exists.');

        const deletedAdmin = await Admin.findByIdAndDelete(req.id);

        res.status(200).send(deletedAdmin);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}


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


async function getUsers(req, res) {
    try {
        const limit = req.query.limit || 10;
        const page = req.query.page || 1;
        const search = new RegExp(req.query.search,'i');

        const users = await User
                            .find(
                                {
                                    "$or": [
                                        { userName: search },
                                        { email: search }
                                    ]
                                }
                            )
                            .skip(limit * (page - 1))
                            .limit(limit)
                            .sort({ createdAt: 'DESC' });
        
        const totalUsers = await User.count();

        const data = {
            users,
            metaData: {
                start: (limit * (page - 1)) + 1,
                end: limit * page,
                total: totalUsers,
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


module.exports.signin = signin;
module.exports.logout = logout;

module.exports.createAdmin = createAdmin;
module.exports.getAdmins = getAdmins;
module.exports.getAdmin = getAdmin;
module.exports.getPrivateProfile = getPrivateProfile;
module.exports.updateProfile = updateProfile;
module.exports.deleteProfile = deleteProfile;

module.exports.getCategory = getCategory;
module.exports.getCategories = getCategories;
module.exports.createNewCategory = createNewCategory;
module.exports.updateCategory = updateCategory;
module.exports.deleteCategory = deleteCategory;

module.exports.getUsers = getUsers;