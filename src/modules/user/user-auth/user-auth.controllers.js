const path = require("path");
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const User = require(path.join(process.cwd(), '/src/modules/user/user.model'));



async function signin(req, res) {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).send('Invalid credentials.');
        
        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) return res.status(400).send('Invalid credentials.');
        
        if (user.email === email && isPasswordCorrect) {
            const token = jwt.sign({ id: user._id }, process.env.USER_TOKEN_SECRET, { expiresIn: '1h' });

            return res.status(200).send({ accessToken: token });
        }
        else res.status(400).send('Invalid Credentials');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function signup(req, res) {
    try {
        const { userName, email, password, confirmPassword } = req.body;

        const existUser = await User.findOne({ userName });
        if(existUser) return res.status(400).send('User already exists.');

        if (password !== confirmPassword) return res.status('Password does not match.');
        
        const salt = await bcrypt.genSalt(10);
		const hashPassword = await bcrypt.hash(password, salt);

        const user = new User({ userName, email, password: hashPassword });

        const newUser = await user.save();

        const token = jwt.sign({ id: newUser._id }, process.env.USER_TOKEN_SECRET, { expiresIn: '1h' });

        res.status(201).send({ accessToken: token });
    }
    catch (error) {
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



module.exports.signin = signin;
module.exports.signup = signup;
module.exports.logout = logout;