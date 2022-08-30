const express = require('express');
const cors = require('cors');
const dotEnv = require('dotenv');

const connection = require('./database/mongodb-connection');

const userRoutes = require('./routes/user.routes');
const blogRoutes = require('./routes/blog.routes');
const categoryRoutes = require('./routes/category.routes');
const tagRoutes = require('./routes/tag.routes');
const adminRoutes = require('./routes/admin.routes');

const swaggerDocs = require('./lib/swagger');

const app = express();

app.use(express.json({ limit: '50mb', extended: true }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
dotEnv.config();

connection();

app.use(userRoutes);
app.use(blogRoutes);
app.use(categoryRoutes);
app.use(tagRoutes);
app.use(adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
    swaggerDocs(app, PORT)
});
