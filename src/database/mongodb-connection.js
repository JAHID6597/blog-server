const mongoose = require("mongoose");

const connection = () => {
    mongoose
        .connect(process.env.MONGODB_URI)
        .then(() => console.log("Mongodb connected."))
        .catch((err) =>
            console.log("Mongodb connection failed.\n", err.message),
        );
};

module.exports = connection;
