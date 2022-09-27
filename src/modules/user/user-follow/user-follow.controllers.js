const path = require("path");
const User = require(path.join(process.cwd(), '/src/modules/user/user.model'));
const Follow = require(path.join(process.cwd(), "/src/modules/user/user-follow/user-follow.model"));



async function followUser(req, res) {
    try {
        const { userName } = req.params;

        const user = await User.findOne({ userName })
            .select("-password")
            .lean();
        if (!user) return res.status(404).send('User does not exists.');

        const followed = await Follow.findOne({ follower: req.id, following: user._id });
        if (followed) {
            await followed.delete();
            await User.findOneAndUpdate(
                { userName },
                { $pull: { followers: req.id } },
                { new: true }
            );
            const updatedUser = await User.findByIdAndUpdate(
                req.id,
                { $pull: { followings: user._id } },
                { new: true }
            ).select("-password");
            return res.status(200).send(updatedUser);
        }

        const newFollow = new Follow({ follower: req.id, following: user._id });
        await newFollow.save();
        await User.findOneAndUpdate({ userName }, { $push: { followers: req.id } }, { new: true });

        const updatedUser = await User.findByIdAndUpdate(req.id, { $push: { followings: user._id } }, { new: true }).select("-password");
        return res.status(200).send(updatedUser);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function getFollowerUsers(req, res) {
    try {
        const { userName } = req.params;

        const user = await User.findOne({ userName });
        if (!user) return res.status(404).send('User does not exists.');

        const limit = req.query.limit || 10;
        const page = req.query.page || 1;
        const search = new RegExp(req.query.search, 'i');

        const query = {
            following: user._id,
            "$or": [
                { userName: search },
                { email: search }
            ]
        };

        const followers = await Follow
                                .find(query)
                                .populate({ path: 'follower', select: '-password' })
                                .skip(limit * (page - 1))
                                .limit(limit);
        
        const totalFollowers = await Follow.count(query);

        const data = {
            users: followers,
            metaData: {
                start: (limit * (page - 1)) + 1,
                end: limit * page,
                total: totalFollowers,
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

async function getFollowingUsers(req, res) {
    try {
        const { userName } = req.params;

        const user = await User.findOne({ userName });
        if (!user) return res.status(404).send('User does not exists.');

        const limit = req.query.limit || 10;
        const page = req.query.page || 1;
        const search = new RegExp(req.query.search, 'i');

        const query = {
            follower: user._id,
            "$or": [
                { userName: search },
                { email: search }
            ]
        };

        const followings = await Follow
                            .find(query).populate({ path: 'following', select: '-password' })
                            .skip(limit * (page - 1))
                            .limit(limit);
        
        const totalFollowings = await Follow.count(query);

        const data = {
            users: followings,
            metaData: {
                start: (limit * (page - 1)) + 1,
                end: limit * page,
                total: totalFollowings,
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



module.exports.followUser = followUser;
module.exports.getFollowerUsers = getFollowerUsers;
module.exports.getFollowingUsers = getFollowingUsers;