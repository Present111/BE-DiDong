require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const ngrok = require("ngrok");

const GameOfGoService = require("./services/GameOfGoService");
const matchHistoryRoutes = require("./routes/matchHistory.routes");
const userRoutes = require("./routes/user.routes");
const chatMessageRoutes = require("./routes/chatMessage.routes");
const uploadRoute = require("./routes/uploadRoute");
const gameOfGoRoutes = require("./routes/gameofgo.routes");

const socketInstance = require("./utils/socketInstance");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB runtime error:", err);
});

// ✅ Start Game bot service
GameOfGoService.init();

// ✅ HTTP + Socket.io setup
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: { origin: "*" },
});

// ✅ Set global socket io
socketInstance.set(io);

// ✅ Start socket event handlers
require("./socketHandler")(io);

// ✅ Setup routes
app.use("/api/matches", matchHistoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatMessageRoutes);
app.use("/api", uploadRoute); // 👉 ✅ NEW: thêm route upload ảnh
app.use("/api/gameofgo", gameOfGoRoutes);
// ✅ Swagger config
const PORT = process.env.PORT || 3000;
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Game Of Go API",
      version: "1.0.0",
      description: "API documentation for Game Of Go server",
    },
    servers: [{ url: `http://localhost:${PORT}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./routes/*.js"],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("👋 Game Of Go API + Real-time Chat + Swagger + Bot system READY!");
});

// ✅ Start server
http.listen(PORT, async () => {
  console.log(`🚀 Local server running at http://localhost:${PORT}`);
  console.log(`📄 Swagger Docs at http://localhost:${PORT}/api-docs`);

  // ✅ Optional: expose ngrok
  // if (process.env.NGROK_AUTH_TOKEN) {
  //     try {
  //         const url = await ngrok.connect({
  //             addr: PORT,
  //             authtoken: process.env.NGROK_AUTH_TOKEN
  //         });
  //         console.log(`🌐 Public ngrok URL: ${url}`);
  //         console.log(`👉 FE can connect socket.io to: ${url}`);
  //     } catch (err) {
  //         console.error("❌ ngrok start error:", err);
  //     }
  // }
});
