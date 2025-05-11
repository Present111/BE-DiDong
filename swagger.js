// swagger.js
const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "User API",
      version: "1.0.0",
      description: "Simple API for managing users (Node.js + MongoDB + MVC)",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./routes/*.js"], // nơi đọc mô tả Swagger
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
