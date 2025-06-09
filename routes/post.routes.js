const express = require("express");
const router = express.Router();
const Post = require("../models/post.model");
const User = require("../models/user.model");
const auth = require("../utils/authMiddleware"); // middleware xác thực
const BASE_URL = process.env.BASE_URL || 'https://tough-relaxed-newt.ngrok-free.app';

function attachFullUrl(path) {
  if (!path) return null;
  return path.startsWith('http') ? path : `${BASE_URL}/uploads/${path.replace(/^\/?uploads\/?/, '')}`;
}

function attachAvatarFullUrl(user) {
  if (!user) return null;
  const plain = user.toObject?.() || user;
  plain.avatarUrl = attachFullUrl(plain.avatarUrl);
  return plain;
}

function attachPostFullUrl(post) {
  if (!post) return null;
  const plain = post.toObject?.() || post;

  plain.imageUrl = attachFullUrl(plain.imageUrl);
  plain.user = attachAvatarFullUrl(plain.user);

  if (plain.comments?.length) {
    plain.comments = plain.comments.map(c => ({
      ...c,
      user: attachAvatarFullUrl(c.user)
    }));
  }

  return plain;
}

// 📝 Tạo bài đăng mới
router.post("/", auth, async (req, res) => {
  try {
    const { caption, imageUrl } = req.body;
   

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
      .populate("user", "displayName avatarUrl")
      .sort({ createdAt: -1 });

     res.json(posts.map(attachPostFullUrl));
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy bài viết", error: err.message });
  }
});

// 👍 Like hoặc Unlike bài đăng
router.post("/:id/like", auth, async (req, res) => {
  try {
    console.log("🟢 [LIKE API] Bắt đầu xử lý...");
    console.log("🔑 ID bài viết:", req.params.id);
    console.log("👤 ID người dùng:", req.user.id);

    const post = await Post.findById(req.params.id);
    if (!post) {
      console.log("❌ Không tìm thấy bài viết");
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    console.log("✅ Bài viết tìm được:", post._id);
    console.log("💖 Danh sách likes trước:", post.likes);

    // 💥 Quan trọng: dùng equals thay vì indexOf để so sánh ObjectId
    const index = post.likes.findIndex(userId => userId.equals(req.user.id));

    if (index === -1) {
      console.log("➕ Chưa like → tiến hành like");
      post.likes.push(req.user.id);
    } else {
      console.log("➖ Đã like → tiến hành unlike");
      post.likes.splice(index, 1);
    }

    await post.save();
    console.log("💾 Đã lưu thay đổi");

    res.json({
      message: "Cập nhật lượt thích thành công",
      likes: post.likes.length,
      likesList: post.likes,
    });
  } catch (err) {
    console.error("🔥 Lỗi khi like bài viết:", err);
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


// 🔍 Lấy tất cả bài viết của chính user
router.get("/me", auth, async (req, res) => {
    console.log("MEEE")
  try {
    console.log("📌 /me | req.user.id:", req.user?.id);

    const posts = await Post.find({ user: req.user.id })
      .populate("user", "displayName avatarUrl")
      .sort({ createdAt: -1 });

    console.log("📌 /me | Tổng post:", posts.length);
    res.json(posts.map(attachPostFullUrl));
  } catch (err) {
    console.error("🔥 Lỗi API /me:", err);
    res.status(500).json({ message: "Lỗi lấy bài viết của bạn", error: err.message });
  }
});


router.get("/friends", auth, async (req, res) => {
  try {
    console.log("📌 /friends | req.user.id:", req.user?.id);
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const friendIds = user.friends
      .filter(f => f.status === "friend")
      .map(f => f.friendId);

    console.log("📌 /friends | friendIds:", friendIds);

    const posts = await Post.find({ user: { $in: friendIds } })
      .populate("user", "displayName avatarUrl")
      .sort({ createdAt: -1 });

    console.log("📌 /friends | Tổng post:", posts.length);
    res.json(posts.map(attachPostFullUrl));
  } catch (err) {
    console.error("🔥 Lỗi API /friends:", err);
    res.status(500).json({ message: "Lỗi lấy bài viết bạn bè", error: err.message });
  }
});

// 🌍 Lấy tất cả bài viết của người lạ (thế giới) - trừ bản thân
router.get("/global", auth, async (req, res) => {
  try {
    const posts = await Post.find({ user: { $ne: req.user.id } })
      .populate("user", "displayName avatarUrl")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy bài viết thế giới", error: err.message });
  }
});

// 📜 Lấy 1 bài viết chi tiết (có comment, like)
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", "displayName avatarUrl")
      .populate("comments.user", "displayName avatarUrl");

    if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết" });

 res.json(attachPostFullUrl(post));
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy bài viết", error: err.message });
  }
});



module.exports = router;
