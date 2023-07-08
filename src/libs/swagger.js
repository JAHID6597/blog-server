const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "DEV BLOG API",
            version: "1.0.0",
            description: "DEV blog application api",
        },
    },
    apis: [path.join(process.cwd(), "/api-docs/*.json")],
};

const swaggerSpecs = swaggerJsdoc(options);

function swaggerDocs(app, PORT) {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

    app.get("/api-docs.json", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerSpecs);
    });
}

module.exports = swaggerDocs;
