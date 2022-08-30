const jwt = require("jsonwebtoken");

const adminAuth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const decode = jwt.verify(token, process.env.ADMIN_TOKEN_SECRET);

        req.id = decode?.id;

        next();

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

module.exports = adminAuth;