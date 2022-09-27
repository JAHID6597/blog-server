const path = require("path");
const Tag = require(path.join(process.cwd(), "/src/modules/blog/tag/tag.model"));
const Blog = require(path.join(process.cwd(), "/src/modules/blog/blog.model"));


async function getTag(req, res) {
    try {
        const { slug } = req.params;
        
        const tag = await Tag.findOne({ slug });

        res.status(200).send(tag);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function getTags(req, res) {
    try {
        const limit = +req.query.limit || 25;
        const page = +req.query.page || 1;
        const search = new RegExp(req.query.search, 'i');

        const query = [
            {
                $match: { $or: [{ name: search }] }
            },
            {
                $addFields: { blogsCount: { $size: { "$ifNull": ["$blogs", []] } } }
            },
            {
                $sort: { "blogsCount": -1 }
            }
        ];
        
        const tags = await Tag
                            .aggregate(query)
                            .skip(limit * (page - 1))
                            .limit(limit);

        const totalTags = await Tag.count();
        
        const data = {
            tags,
            metaData: {
                start: (limit * (page - 1)) + 1,
                end: limit * page,
                total: totalTags,
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

async function createNewTag(req, res) {
    try {
        const { name } = req.body;

        const tag = new Tag({ name });
        const newTag = await tag.save();

        res.status(200).send(newTag);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function updateTag(req, res) {
    try {
        const { slug } = req.params;

        const { name } = req.body;

        const tag = await Tag.findOneAndUpdate({ slug }, { name }, { new: true });

        res.status(200).send(tag);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}

async function deleteTag(req, res) {
    try {
        const { slug } = req.params;
        
        const tag = await Tag.findOneAndDelete({ slug });

        res.status(200).send(tag);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error!');
    }
}


async function getBlogsByTag(req, res) {
    try {
        const slug = req.params.slug;

        const tag = await Tag.findOne({ slug });
        if (!tag) return res.status(400).send('Not found any tag.');

        const limit = +req.query.limit || 10;
        const page = +req.query.page || 1;

        const query = { tags: { $in: tag.name } };

        const blogs = await Blog
                            .find(query)
                            .skip(limit * (page - 1))
                            .limit(limit)
                            .sort({ createdAt: 'DESC' })
                            .populate(
                                {
                                    path: 'user',
                                    select: '_id userName'
                                }
                            );
        
        const totalBlogs = await Blog.count(query);

        const data = {
            blogs,
            metaData: {
                start: (limit * (page - 1)) + 1,
                end: limit * page,
                total: totalBlogs,
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


module.exports.getTag = getTag;
module.exports.getTags = getTags;
module.exports.createNewTag = createNewTag;
module.exports.updateTag = updateTag;
module.exports.deleteTag = deleteTag;

module.exports.getBlogsByTag = getBlogsByTag;