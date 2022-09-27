const path = require("path");
const bcrypt = require("bcryptjs");
const User = require(path.join(process.cwd(), '/src/modules/user/user.model'));
const cloudinary = require(path.join(process.cwd(), "/src/libs/cloudinary"));



async function getUsers(req, res) {
    try {
        const limit = req.query.limit || 10;
        const page = req.query.page || 1;
        const search = new RegExp(req.query.search, 'i');

        const users = await User
                            .find(
                                {
                                    "$or": [
                                        { userName: search },
                                        { email: search }
                                    ]
                                }
                                )
                                    .select("-password")
                            .skip(limit * (page - 1))
                            .limit(limit);
        
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

async function changePassword(req, res) {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) return res.status(400).send('Password must match.');

        const user = await User.findById(req.id);
        if (!user) return res.status(404).send('User does not exists.');

        const isPasswordCorrect = await user.comparePassword(currentPassword);
        if (!isPasswordCorrect) return res.status(400).send('Invalid credentials.');

        const salt = await bcrypt.genSalt(10);
		const hashPassword = await bcrypt.hash(newPassword, salt);

        const updatedUser = await User.findByIdAndUpdate(req.id, { password: hashPassword }, { new: true }).select("-password");

        res.status(200).send(updatedUser);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function getPublicProfile(req, res) {
    try {
        const { userName } = req.params;

        const user = await User
                            .findOne({ userName })
                            .select("-password");
        if (!user) return res.status(404).send('User does not exists.');

        res.status(200).json(user);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function getPrivateProfile(req, res) {
    try {
        const user = await User
                            .findById(req.id)
                            .select("-password");
        if (!user) return res.status(404).send('User does not exists.');

        res.status(200).send(user);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function updateProfile(req, res) {
    try {
        const { firstName, lastName, userName, email, profilePicture, bio, address, dob, favouriteColor, work, education, socialUrl, skills, languages, learning, hacking, availability, isActive } = req.body;

        const profilePictureUrl = await cloudinary.uploader.upload(profilePicture);

        const newUpdateUserData = {
            firstName, 
            lastName,
            userName, 
            email, 
            profilePicture: profilePictureUrl.secure_url, 
            bio, 
            address, 
            dob, 
            favouriteColor, 
            work, 
            education, 
            socialUrl, 
            skills, 
            languages, 
            learning, 
            hacking, 
            availability,
            isActive
        }

        const updatedUser = await User.findByIdAndUpdate(req.id, newUpdateUserData, { new: true }).select("-password");

        res.status(200).send(updatedUser);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function deleteProfile(req, res) {
    try {
        const deletedUser = await User.findByIdAndDelete(req.id).select("-password");

        res.status(200).send(deletedUser);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}



module.exports.getUsers = getUsers;
module.exports.changePassword = changePassword;
module.exports.getPublicProfile = getPublicProfile;
module.exports.getPrivateProfile = getPrivateProfile;
module.exports.updateProfile = updateProfile;
module.exports.deleteProfile = deleteProfile;