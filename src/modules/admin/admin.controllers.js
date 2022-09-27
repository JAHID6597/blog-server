const path = require("path");
const Admin = require(path.join(process.cwd(), '/src/modules/admin/admin.model'));
const User = require(path.join(process.cwd(), '/src/modules/user/user.model'));



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



module.exports.createAdmin = createAdmin;
module.exports.getAdmins = getAdmins;
module.exports.getAdmin = getAdmin;
module.exports.getPrivateProfile = getPrivateProfile;
module.exports.updateProfile = updateProfile;
module.exports.deleteProfile = deleteProfile;

module.exports.getUsers = getUsers;