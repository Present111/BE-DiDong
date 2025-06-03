const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // Lấy token từ header: "Authorization: Bearer <token>"
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret");
    req.user = decoded; // Lưu thông tin user vào req.user
    next(); // Cho phép đi tiếp vào controller
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
