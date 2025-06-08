const express = require("express");
const router = express.Router();
const Post = require("../models/post.model");
const User = require("../models/user.model");
const auth = require("../utils/authMiddleware"); // middleware xác thực

// 📝 Tạo bài đăng mới
router.post("/", auth, async (req, res) => {
  try {
    const { caption, imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ message: "Thiếu ảnh" });

    const post = await Post.create({
      user: req.user.id,
      caption,
      imageUrl
    });

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tạo bài viết", error: err.message });
  }
});

// 📚 Lấy tất cả bài đăng mới nhất
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "username avatarUrl")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy bài viết", error: err.message });
  }
});

// 👍 Like hoặc Unlike bài đăng
router.post("/:id/like", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết" });

    const index = post.likes.indexOf(req.user.id);
    if (index === -1) {
      post.likes.push(req.user.id);
    } else {
      post.likes.splice(index, 1); // unlike
    }

    await post.save();
    res.json({ message: "Cập nhật lượt thích thành công", likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: "Lỗi like bài viết", error: err.message });
  }
});

// 💬 Bình luận bài đăng
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Thiếu nội dung bình luận" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết" });

    const comment = {
      user: req.user.id,
      content,
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    res.status(201).json({ message: "Đã bình luận", comment });
  } catch (err) {
    res.status(500).json({ message: "Lỗi bình luận", error: err.message });
  }
});

// 📜 Lấy 1 bài viết chi tiết (có comment, like)
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", "username avatarUrl")
      .populate("comments.user", "username avatarUrl");

    if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết" });

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy bài viết", error: err.message });
  }
});


// 🔍 Lấy tất cả bài viết của chính user
router.get("/me", auth, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user.id })
      .populate("user", "username avatarUrl")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy bài viết của bạn", error: err.message });
  }
});

// 🧑‍🤝‍🧑 Lấy tất cả bài viết của bạn bè
router.get("/friends", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const friendIds = user.friends
      .filter(f => f.status === "friend")
      .map(f => f.friendId);

    const posts = await Post.find({ user: { $in: friendIds } })
      .populate("user", "username avatarUrl")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy bài viết bạn bè", error: err.message });
  }
});

// 🌍 Lấy tất cả bài viết của người lạ (thế giới) - trừ bản thân
router.get("/global", auth, async (req, res) => {
  try {
    const posts = await Post.find({ user: { $ne: req.user.id } })
      .populate("user", "username avatarUrl")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy bài viết thế giới", error: err.message });
  }
});

module.exports = router;
