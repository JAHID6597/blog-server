const path = require("path");
const express = require('express');
const cors = require('cors');
const dotEnv = require('dotenv');

const connection = require(path.join(process.cwd(), '/src/database/mongodb-connection'));

const userRoutes = require(path.join(process.cwd(), '/src/modules/user/user.routes'));
const blogRoutes = require(path.join(process.cwd(), '/src/modules/blog/blog.routes'));
const adminRoutes = require(path.join(process.cwd(), '/src/modules/admin/admin.routes'));

const swaggerDocs = require(path.join(process.cwd(), '/src/libs/swagger'));

const app = express();

app.use(express.json({ limit: '50mb', extended: true }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
dotEnv.config();

connection();

app.use(userRoutes);
app.use(blogRoutes);
app.use(adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
    swaggerDocs(app, PORT)
});
