require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const userRoutes = require("./routes/user.routes");
const gameOfGoRoutes = require("./routes/gameofgo.routes");        // ✅ giữ lại Game Of Go

const GameOfGoService = require("./services/GameOfGoService");     // ✅ giữ lại Game Of Go

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Kết nối MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Khởi động Game Of Go bot
GameOfGoService.init();

// ✅ Routes
app.use("/api/users", userRoutes);
app.use("/api/gameofgo", gameOfGoRoutes);               // ✅ chỉ còn Game Of Go routes

// ✅ Swagger Docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ✅ Root
app.get("/", (req, res) => {
  res.send("👋 Hello from user-api-app + Game Of Go bot only!");
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
