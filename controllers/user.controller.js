// controllers/user.controller.js
const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// CRUD cơ bản
const BASE_URL = process.env.BASE_URL || 'https://tough-relaxed-newt.ngrok-free.app';



function attachAvatarFullUrl(user) {
  if (user?.avatarUrl && !user.avatarUrl.startsWith('http')) {
    user.avatarUrl = `${BASE_URL}/uploads/${user.avatarUrl.replace(/^\/?uploads\/?/, '')}`;
  }
  return user;
}
const socketInstance = require("../utils/socketInstance"); // đường dẫn đúng tới file bạn tạo

const emitFriendUpdate = (userIds) => {
  const io = socketInstance.get(); // ✅ lấy io đúng cách

  if (!io) {
    console.warn("⚠️ emitFriendUpdate: io chưa được khởi tạo");
    return;
  }

  userIds.forEach((id) => {
    io.emit("friend:refresh", { userId: id });
    console.log("📤 Emit friend:refresh →", id);
  });
};

const ChatMessage = require("../models/chatMessage.model");
exports.createUser = async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate(
      "matchHistory friends.friendId friends.messageId"
    );
  res.json(users.map(attachAvatarFullUrl));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate({ path: "waitId", model: "User" }) // ✅ WaitId là người đang chờ thách đấu
      .populate({ path: "matchHistory" })
      .populate({ path: "friends.friendId", model: "User" })
      .populate({ path: "friends.messageId", model: "ChatMessage" })
      .populate({ path: "challenges.challengerId", model: "User" }) // ✅ Người gửi thách đấu
      .populate({ path: "challenges.receiverId", model: "User" });  // ✅ Người nhận

    if (!user) return res.status(404).json({ error: "User not found" });

    // ✅ Avatar chính
    attachAvatarFullUrl(user);

    // ✅ Avatar waitId
    if (user.waitId && typeof user.waitId === 'object') {
      attachAvatarFullUrl(user.waitId);
    }

    // ✅ Avatar bạn bè
    user.friends?.forEach(friend => {
      if (friend.friendId) {
        attachAvatarFullUrl(friend.friendId);
      }
    });

    // ✅ Avatar trong danh sách challenges
    user.challenges?.forEach(challenge => {
      if (challenge.challengerId) attachAvatarFullUrl(challenge.challengerId);
      if (challenge.receiverId) attachAvatarFullUrl(challenge.receiverId);
    });

    res.json(user);
  } catch (err) {
    console.error('❌ Lỗi khi lấy user by ID:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  console.log(req);
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(attachAvatarFullUrl(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Friend management
exports.addFriend = async (req, res) => {
  try {
    const { friendId } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.friends.push({ friendId, status: "request" });
    await user.save();
    res.json({ message: "Friend request sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateFriendStatus = async (req, res) => {
  try {
    const { friendId, status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const friend = user.friends.find((f) => f.friendId.toString() === friendId);
    if (!friend) return res.status(404).json({ error: "Friend not found" });

    friend.status = status;
    await user.save();
    res.json({ message: "Friend status updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Challenge management
exports.sendChallenge = async (req, res) => {
  try {
    const { challengerId, receiverId } = req.body;
    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ error: "Receiver not found" });

    receiver.challenges.push({ challengerId, receiverId, status: "pending" });
    await receiver.save();
    res.json({ message: "Challenge sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.acceptChallenge = async (req, res) => {
  try {
    const { userId, challengeId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const challenge = user.challenges.id(challengeId);
    if (!challenge)
      return res.status(404).json({ error: "Challenge not found" });

    challenge.status = "accepted";
    await user.save();
    res.json({ message: "Challenge accepted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.declineChallenge = async (req, res) => {
  try {
    const { userId, challengeId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const challenge = user.challenges.id(challengeId);
    if (!challenge)
      return res.status(404).json({ error: "Challenge not found" });

    challenge.status = "declined";
    await user.save();
    res.json({ message: "Challenge declined" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.cancelChallenge = async (req, res) => {
  try {
    const { receiverId, challengeId } = req.params;
    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ error: "Receiver not found" });

    const challenge = receiver.challenges.id(challengeId);
    if (!challenge)
      return res.status(404).json({ error: "Challenge not found" });

    challenge.status = "cancelled";
    await receiver.save();
    res.json({ message: "Challenge cancelled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Tìm user theo username hoặc email
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    // Nếu là tài khoản Google thì không kiểm tra password
    if (user.googleId && user.password === "-1") {
      // Sinh token cho user Google
      const payload = {
        id: user._id,
        username: user.username,
        email: user.email,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET || "your_secret", {
        expiresIn: "7d",
      });
      return res.json({ message: "Login successful (Google)", token, user });
    }

    // Kiểm tra password thường
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    // Tạo token
    const payload = {
      id: user._id,
      username: user.username,
      email: user.email,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "your_secret", {
      expiresIn: "7d",
    });

  res.json({ message: 'Login successful', token, user: attachAvatarFullUrl(user) });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.registerUser = async (req, res) => {
  try {
    console.log("👉 [registerUser] req.body:", req.body);

    const { username, password, email, googleId, photo } = req.body;

    // ✅ Đăng nhập / đăng ký bằng Google
    if (googleId) {
      console.log("👉 [Google Login] googleId:", googleId);

      let user = await User.findOne({ googleId });

      if (user) {
        // 🔴 Kiểm tra nếu đã online → không cho login
        if (user.onlineStatus === "online") {
          console.log("⚠️ [Google Login] User đã online, từ chối đăng nhập");
          return res.status(403).json({
            error: "Tài khoản này đang hoạt động trên thiết bị khác.",
          });
        }
        // ✅ Tạo token cho user Google đã tồn tại
        const payload = {
          id: user._id,
          username: user.username,
          email: user.email,
        };
        const token = jwt.sign(
          payload,
          process.env.JWT_SECRET || "your_secret",
          { expiresIn: "7d" }
        );
        return res.json({ message: "Login by Google successful", token, user });
      }

      // Nếu chưa tồn tại → tạo mới
      user = new User({
        username: username || `google_${Date.now()}`,
        googleId,
        email: email || "",
        password: "-1", // không cần password với Google
        displayName: username,
        avatarUrl: photo || "",
      });

      console.log("👉 [Google Login] Tạo user mới:", user);

      await user.save();
      console.log("✅ [Google Login] User đã lưu thành công:", user);

      // ✅ Tạo token cho user Google mới
      const payload = {
        id: user._id,
        username: user.username,
        email: user.email,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET || "your_secret", {
        expiresIn: "7d",
      });

      return res.json({ message: "Login by Google successful", token, user });
    }

    // ✅ Đăng ký thông thường
    console.log("👉 [Normal Register] Bắt đầu kiểm tra username + email");

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      console.log("❌ [Normal Register] Username đã tồn tại:", username);
      return res.status(400).json({ error: "Username already exists" });
    }

    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        console.log("❌ [Normal Register] Email đã tồn tại:", email);
        return res.status(400).json({ error: "Email already exists" });
      }
    }

    // Hash password trước khi lưu
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      username,
      password: hashedPassword,
      email: email || "",
      displayName: username,
    });

    console.log("👉 [Normal Register] Tạo user mới:", newUser);

    await newUser.save();
    console.log("✅ [Normal Register] User đã lưu thành công:", newUser);

   res.json({ message: 'Register successful', user: attachAvatarFullUrl(newUser) });
  } catch (err) {
    console.error("❌ [registerUser] Lỗi hệ thống:", err);
    res.status(500).json({ error: err.message });
  }
};

const nodemailer = require("nodemailer");

// Bộ nhớ tạm lưu mã đổi mật khẩu
const changePasswordCodes = new Map();

// ✅ Cấu hình gửi email (đặt email và password thật của bạn ở đây)
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "managingagents.se@gmail.com",
    pass: "gtwdyjnrsuimdojf", // ❗ mật khẩu ứng dụng (app password)
  },
});

// ✅ Bước 1: Gửi mã xác thực đổi mật khẩu
exports.requestChangePasswordCode = async (req, res) => {
  const { email } = req.body;
  console.log(
    "👉 [requestChangePasswordCode] Nhận yêu cầu gửi mã xác thực cho:",
    email
  );

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log(
        "❌ [requestChangePasswordCode] Không tìm thấy người dùng với email:",
        email
      );
      return res.status(404).json({ error: "Email không tồn tại" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    changePasswordCodes.set(email, { code, createdAt: Date.now() });

    console.log(
      `✅ [requestChangePasswordCode] Đã tạo mã xác thực: ${code} cho email: ${email}`
    );

    await transporter.sendMail({
      from: "managingagents.se@gmail.com",
      to: email,
      subject: "Mã xác thực đổi mật khẩu",
      text: `Mã xác thực đổi mật khẩu của bạn là: ${code}. Mã có hiệu lực trong 10 phút.`,
    });

    console.log(
      `✅ [requestChangePasswordCode] Đã gửi email mã xác thực tới: ${email}`
    );
    res.status(200).json({ message: "Đã gửi mã xác thực tới email của bạn." });
  } catch (err) {
    console.error("❌ [requestChangePasswordCode] Lỗi hệ thống:", err);
    res.status(500).json({ error: "Lỗi khi gửi mã xác thực" });
  }
};

// ✅ Bước 2: Xác nhận đổi mật khẩu
exports.confirmChangePassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  console.log(
    `👉 [confirmChangePassword] Yêu cầu xác nhận đổi mật khẩu cho email: ${email}, mã code: ${code}`
  );

  try {
    const stored = changePasswordCodes.get(email);

    if (!stored) {
      console.log(
        "❌ [confirmChangePassword] Không tìm thấy mã cho email:",
        email
      );
      return res
        .status(400)
        .json({ error: "Mã xác thực không hợp lệ hoặc đã hết hạn." });
    }

    if (stored.code !== code) {
      console.log(
        `❌ [confirmChangePassword] Mã không khớp. Nhập: ${code}, thực tế: ${stored.code}`
      );
      return res
        .status(400)
        .json({ error: "Mã xác thực không hợp lệ hoặc đã hết hạn." });
    }

    // Kiểm tra hết hạn (10 phút)
    if (Date.now() - stored.createdAt > 10 * 60 * 1000) {
      console.log(
        `❌ [confirmChangePassword] Mã đã hết hạn cho email: ${email}`
      );
      changePasswordCodes.delete(email);
      return res.status(400).json({ error: "Mã xác thực đã hết hạn." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log(
        `❌ [confirmChangePassword] Không tìm thấy user với email: ${email}`
      );
      return res.status(404).json({ error: "Email không tồn tại" });
    }

    console.log(
      `✅ [confirmChangePassword] Đổi mật khẩu cho user: ${user.username} (email: ${email})`
    );
    // Hash mật khẩu mới trước khi lưu
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = newHashedPassword;
    await user.save();

    changePasswordCodes.delete(email);
    console.log(
      `✅ [confirmChangePassword] Đổi mật khẩu thành công và đã xóa mã tạm cho email: ${email}`
    );

    res.status(200).json({ message: "Đổi mật khẩu thành công." });
  } catch (err) {
    console.error("❌ [confirmChangePassword] Lỗi hệ thống:", err);
    res.status(500).json({ error: "Lỗi khi đổi mật khẩu" });
  }
};

// Tìm kiếm user theo username hoặc _id (không phân biệt hoa thường)
const mongoose = require("mongoose");

exports.searchUsers = async (req, res) => {
  try {
    const { query, userId } = req.query;
    console.log("🔍 Nhận request tìm kiếm:", { query, userId });

    if (!query || !userId) {
      return res.status(400).json({ error: "Thiếu query hoặc userId" });
    }

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }

    // ✅ Danh sách người bạn đã gửi lời mời hoặc đã là bạn
    const excludedByCurrentUser = currentUser.friends
      .filter((f) => f.status === "friend" || f.status === "request")
      .map((f) => f.friendId.toString());

    // ✅ Danh sách người đã gửi lời mời cho bạn (request từ phía người khác)
    const usersSentRequestToYou = await User.find({
      "friends.friendId": userId,
      "friends.status": "request",
    }).select("_id");

    const excludedByOthers = usersSentRequestToYou.map((u) => u._id.toString());

    // ✅ Hợp nhất danh sách loại trừ
    const excludedIds = [
      ...new Set([...excludedByCurrentUser, ...excludedByOthers]),
    ];
    console.log("🧾 Danh sách excludedIds:", excludedIds);

    // ✅ Tìm theo ObjectId hoặc displayName
    const orConditions = [];
    if (mongoose.Types.ObjectId.isValid(query)) {
      orConditions.push({ _id: query });
    }
    orConditions.push({ displayName: { $regex: query, $options: "i" } });

    const users = await User.find({
      _id: { $ne: userId, $nin: excludedIds },
      $or: orConditions,
    }).select("-password");

    console.log("✅ Kết quả tìm kiếm:", users.length);
  res.json(users.map(attachAvatarFullUrl));
  } catch (err) {
    console.error("❌ Lỗi khi tìm kiếm người dùng:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.respondToFriendRequest = async (req, res) => {
  try {
    const { fromUserId, toUserId, accepted } = req.body;
    console.log(
      "[RESPOND REQUEST] from:",
      fromUserId,
      "to:",
      toUserId,
      "accepted:",
      accepted
    );

    const fromUser = await User.findById(fromUserId);
    const toUser = await User.findById(toUserId);
    console.log("🔍 Tìm thấy người dùng:", {
      fromUser: !!fromUser,
      toUser: !!toUser,
    });

    if (!fromUser || !toUser) {
      return res.status(404).json({ error: "Người dùng không tồn tại." });
    }

    const friendIndex = toUser.friends.findIndex(
      (f) => f.friendId.toString() === fromUserId
    );
    if (friendIndex === -1) {
      console.warn("❌ Không tìm thấy lời mời kết bạn.");
      return res.status(400).json({ error: "Không tìm thấy lời mời kết bạn." });
    }

    if (!accepted) {
      toUser.friends.splice(friendIndex, 1);
      await toUser.save();
      console.log("❌ Đã từ chối lời mời.");

      emitFriendUpdate([fromUserId, toUserId]);

      return res.json({ message: "Đã từ chối lời mời kết bạn." });
    }

    const chat = new ChatMessage({
      user1: fromUser._id,
      user2: toUser._id,
      messages: [],
    });

    await chat.save();
    console.log("💬 Tạo cuộc trò chuyện mới:", chat._id);

    toUser.friends[friendIndex].status = "friend";
    toUser.friends[friendIndex].messageId = chat._id;

    fromUser.friends.push({
      friendId: toUser._id,
      status: "friend",
      messageId: chat._id,
    });

    await fromUser.save();
    await toUser.save();
    console.log("✅ Cập nhật trạng thái bạn bè và lưu dữ liệu.");

    emitFriendUpdate([fromUserId, toUserId]);

    res.json({ message: "Đã chấp nhận kết bạn và tạo cuộc trò chuyện." });
  } catch (err) {
    console.error("❌ Lỗi phản hồi kết bạn:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.getFriendRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("[GET REQUESTS] userId:", userId);

    const user = await User.findById(userId).populate(
      "friends.friendId",
      "-password"
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

const requests = user.friends
  .filter(f => f.status === 'request')
  .map(r => {
    if (r.friendId) r.friendId = attachAvatarFullUrl(r.friendId);
    return r;
  });

res.json(requests);

  } catch (err) {
    console.error("❌ Lỗi lấy lời mời:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// POST /friends/request
exports.sendFriendRequest = async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;
    console.log("📤 Gửi lời mời kết bạn:", { fromUserId, toUserId });

    if (fromUserId === toUserId) {
      console.warn("⚠️ Không thể kết bạn với chính mình.");
      return res
        .status(400)
        .json({ error: "Không thể kết bạn với chính mình." });
    }

    const fromUser = await User.findById(fromUserId);
    const toUser = await User.findById(toUserId);
    console.log("🔍 Tìm user:", {
      fromUserExists: !!fromUser,
      toUserExists: !!toUser,
    });

    if (!fromUser || !toUser) {
      return res.status(404).json({ error: "Người dùng không tồn tại." });
    }

    const alreadyFriend = toUser.friends.find(
      (f) => f.friendId.toString() === fromUserId
    );
    if (alreadyFriend) {
      console.warn("⚠️ Đã là bạn hoặc đã gửi lời mời.");
      return res.status(400).json({ error: "Đã gửi lời mời hoặc đã là bạn." });
    }

    toUser.friends.push({
      friendId: fromUser._id,
      status: "request",
    });

    await toUser.save();
    console.log("✅ Lưu lời mời kết bạn vào database.");

    // Emit socket event
    emitFriendUpdate([fromUserId, toUserId]);

    res.json({ message: "Đã gửi lời mời kết bạn." });
  } catch (err) {
    console.error("❌ Lỗi gửi lời mời kết bạn:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.unfriendUser = async (req, res) => {
  try {
    const { userId, friendId } = req.params;

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ error: "Người dùng không tồn tại." });
    }

    // Tìm và xóa ChatMessage giữa user và friend
    await ChatMessage.deleteOne({
      $or: [
        { user1: userId, user2: friendId },
        { user1: friendId, user2: userId },
      ],
    });

    // Xóa bạn khỏi danh sách của user
    user.friends = user.friends.filter(
      (f) => f.friendId.toString() !== friendId
    );

    // Xóa user khỏi danh sách của friend
    friend.friends = friend.friends.filter(
      (f) => f.friendId.toString() !== userId
    );

    await user.save();
    await friend.save();

    // Emit socket cập nhật UI
    emitFriendUpdate([userId, friendId]);

    res.json({ message: "Đã hủy kết bạn và xóa tin nhắn thành công." });
  } catch (err) {
    console.error("❌ [unfriendUser] Lỗi:", err.message);
    res.status(500).json({ error: "Lỗi khi hủy kết bạn." });
  }
};

const userService = require("../services/user.service");

exports.getUsersByElo = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const users = await userService.getUsersSortedByElo(limit);
    res.status(200).json(users);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch leaderboard", error: err.message });
  }
};


exports.sendChallengeDirect = async (req, res) => {
  const { myId, opponentId } = req.body;

  console.log('📥 Gửi thách đấu từ:', myId, '→ đến:', opponentId);

  try {
    const myUser = await User.findById(myId);
    const opponent = await User.findById(opponentId);

    if (!myUser || !opponent) {
      console.warn('❌ Không tìm thấy người dùng:', {
        myUserFound: !!myUser,
        opponentFound: !!opponent,
      });
      return res.status(404).json({ message: "Người dùng không tồn tại." });
    }

    console.log('✅ Cả hai người dùng đều tồn tại.');
    console.log('🔧 Gán waitId cho người gửi...');

    // Gán waitId cho mình
    myUser.waitId = opponentId;

    console.log('✅ waitId đã gán:', myUser.waitId);

    console.log('➕ Thêm challenge vào danh sách của đối thủ...');
    opponent.challenges.push({
      challengerId: myId,
      receiverId: opponentId,
      status: "pending",
    });

    console.log('✅ Challenge đã được thêm.');
    console.log('💾 Lưu người gửi...');
    await myUser.save();
    console.log('✅ Người gửi đã được lưu.');

    console.log('💾 Lưu đối thủ...');
    await opponent.save();
    console.log('✅ Đối thủ đã được lưu.');

    console.log('🚀 Thách đấu gửi thành công.');
    return res.json({ message: "Đã gửi thách đấu!" });
  } catch (err) {
    console.error('🔥 Lỗi khi gửi challenge:', err);
    return res.status(500).json({ message: "Lỗi server khi gửi challenge." });
  }
};



exports.acceptChallengeDirect = async (req, res) => {
    const { myId, opponentId } = req.body;

    try {
        const me = await User.findById(myId);
        const opponent = await User.findById(opponentId);

        if (!me || !opponent) {
            return res.status(404).json({ message: "Không tìm thấy người dùng." });
        }

        // Gán waitId cho mình
        me.waitId = opponentId;

        // Xoá challenge của đối thủ trong danh sách của mình
        me.challenges = me.challenges.filter(chal => !chal.challengerId.equals(opponentId));
        await me.save();

        return res.json({ message: "Đã chấp nhận thách đấu!" });
    } catch (err) {
        return res.status(500).json({ message: "Lỗi server khi chấp nhận challenge." });
    }
};

exports.declineChallengeDirect = async (req, res) => {
    const { myId, opponentId } = req.body;

    try {
        const me = await User.findById(myId);
        const opponent = await User.findById(opponentId);

        if (!me || !opponent) {
            return res.status(404).json({ message: "Không tìm thấy người dùng." });
        }

        // Xoá waitId của đối thủ
        opponent.waitId = null;

        // Xoá challenge của đối thủ ở chỗ mình
        me.challenges = me.challenges.filter(chal => !chal.challengerId.equals(opponentId));

        await opponent.save();
        await me.save();

        return res.json({ message: "Đã từ chối thách đấu." });
    } catch (err) {
        return res.status(500).json({ message: "Lỗi server khi từ chối challenge." });
    }
};


exports.outChallenge = async (req, res) => {
  const { userId } = req.body;

  try {
    const me = await User.findById(userId);
    if (!me) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // ✅ Nếu không có waitId thì coi như đã thoát thách đấu
    if (!me.waitId) {
      return res.json({ message: "Không có đối thủ để thoát, xử lý an toàn" });
    }

    const opponentId = me.waitId;
    const opponent = await User.findById(opponentId);

    // Nếu không tìm được đối thủ cũng không sao, vẫn reset waitId
    if (opponent) {
      opponent.challenges = opponent.challenges.filter(
        chal => !chal.challengerId.equals(userId) && !chal.receiverId.equals(userId)
      );
      opponent.waitId = null;
      await opponent.save();
    }

    me.waitId = null;
    await me.save();

    return res.json({ message: "Đã thoát thách đấu" });
  } catch (err) {
    console.error("❌ Lỗi khi thoát challenge:", err);
    return res.status(500).json({ message: "Lỗi server khi thoát challenge" });
  }
};


exports.offlineChallenge = async (req, res) => {
  const { userId } = req.body;

  try {
    const me = await User.findById(userId);
    if (!me) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    // Xoá waitId của chính mình
    me.waitId = null;
    await me.save();

    // Xoá tất cả challenge liên quan ở tất cả user
    await User.updateMany(
      {
        "challenges": {
          $elemMatch: {
            $or: [
              { challengerId: userId },
              { receiverId: userId }
            ]
          }
        }
      },
      {
        $pull: {
          challenges: {
            $or: [
              { challengerId: userId },
              { receiverId: userId }
            ]
          }
        }
      }
    );

    return res.json({ message: "Đã xử lý offline: xoá waitId và challenge liên quan" });
  } catch (err) {
    console.error("❌ Lỗi offlineChallenge:", err);
    return res.status(500).json({ message: "Lỗi server khi xử lý offline challenge" });
  }
};


