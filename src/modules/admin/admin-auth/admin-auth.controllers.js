const jwt = require("jsonwebtoken");
const path = require("path");
const Admin = require(path.join(
    process.cwd(),
    "/src/modules/admin/admin.model",
));

async function signin(req, res) {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(400).send("Invalid credentials.");

        const isPasswordCorrect = await admin.comparePassword(password);
        if (!isPasswordCorrect)
            return res.status(400).send("Invalid credentials.");

        if (admin.email === email && isPasswordCorrect) {
            const token = jwt.sign(
                { id: admin._id },
                process.env.ADMIN_TOKEN_SECRET,
                { expiresIn: "1h" },
            );

            return res.status(200).send({ accessToken: token });
        } else res.status(400).send("Invalid Credentials");
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error!");
    }
}

async function logout(req, res) {
    try {
        res.status(200).send("Successfully logged out");
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error!");
    }
}

module.exports.signin = signin;
module.exports.logout = logout;
