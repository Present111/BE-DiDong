// controllers/user.controller.js
const User = require("../models/user.model");

// CRUD cơ bản
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
        const users = await User.find().populate('matchHistory friends.friendId friends.messageId');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate({ path: 'matchHistory' })                              // ✅ MatchHistory
            .populate({ path: 'friends.friendId', model: 'User' })           // ✅ friends.friendId → User
            .populate({ path: 'friends.messageId', model: 'ChatMessage' })   // ✅ friends.messageId → ChatMessage
            .populate({ path: 'challenges.challengerId', model: 'User' })    // ✅ challenges.challengerId → User
            .populate({ path: 'challenges.receiverId', model: 'User' });     // ✅ challenges.receiverId → User

        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



exports.updateUser = async (req, res) => {
    console.log(req)
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
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

        user.friends.push({ friendId, status: 'request' });
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

        const friend = user.friends.find(f => f.friendId.toString() === friendId);
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

        receiver.challenges.push({ challengerId, receiverId, status: 'pending' });
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
        if (!challenge) return res.status(404).json({ error: "Challenge not found" });

        challenge.status = 'accepted';
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
        if (!challenge) return res.status(404).json({ error: "Challenge not found" });

        challenge.status = 'declined';
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
        if (!challenge) return res.status(404).json({ error: "Challenge not found" });

        challenge.status = 'cancelled';
        await receiver.save();
        res.json({ message: "Challenge cancelled" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }

   
    
};


exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // ✅ Tìm user theo username hoặc email
        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        // ✅ So sánh password (vì bạn chưa dùng bcrypt nên chỉ so sánh thẳng)
        if (user.password !== password)
            return res.status(401).json({ error: "Invalid password" });

        res.json({ message: "Login successful", user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



exports.registerUser = async (req, res) => {
    try {
        console.log("👉 [registerUser] req.body:", req.body);

        const { username, password, email, googleId, photo } = req.body;

        // ✅ Nếu có googleId → xử lý đăng ký Googlec
        if (googleId) {
            console.log("👉 [Google Login] googleId:", googleId);

            let user = await User.findOne({ googleId });
            if (user) {
                console.log("✅ [Google Login] User đã tồn tại:", user);
                return res.json({ message: "Login by Google successful", user });
            }

            // Nếu chưa tồn tại → tạo mới
            user = new User({
                username: username || `google_${Date.now()}`,
                googleId,
                email: email || "",
                password: "-1",  // không cần password với Google
                displayName: username,
                avatarUrl: photo || "",
            });

            console.log("👉 [Google Login] Tạo user mới:", user);

            await user.save();
            console.log("✅ [Google Login] User đã lưu thành công:", user);

            return res.json({ message: "Login by Google successful", user });
        }

        // ✅ Nếu không có googleId → xử lý đăng ký thường
        console.log("👉 [Normal Register] Bắt đầu kiểm tra username + email");

        // Kiểm tra trùng username
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            console.log("❌ [Normal Register] Username đã tồn tại:", username);
            return res.status(400).json({ error: "Username already exists" });
        }

        // Kiểm tra trùng email (nếu có)
        if (email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                console.log("❌ [Normal Register] Email đã tồn tại:", email);
                return res.status(400).json({ error: "Email already exists" });
            }
        }

        // Tạo user mới
        const newUser = new User({
            username,
            password,
            email: email || "",
            displayName: username,
        });

        console.log("👉 [Normal Register] Tạo user mới:", newUser);

        await newUser.save();
        console.log("✅ [Normal Register] User đã lưu thành công:", newUser);

        res.json({ message: "Register successful", user: newUser });

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
        pass: "gtwdyjnrsuimdojf",   // ❗ mật khẩu ứng dụng (app password)
    },
});

// ✅ Bước 1: Gửi mã xác thực đổi mật khẩu
exports.requestChangePasswordCode = async (req, res) => {
    const { email } = req.body;
    console.log("👉 [requestChangePasswordCode] Nhận yêu cầu gửi mã xác thực cho:", email);

    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log("❌ [requestChangePasswordCode] Không tìm thấy người dùng với email:", email);
            return res.status(404).json({ error: "Email không tồn tại" });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        changePasswordCodes.set(email, { code, createdAt: Date.now() });

        console.log(`✅ [requestChangePasswordCode] Đã tạo mã xác thực: ${code} cho email: ${email}`);

        await transporter.sendMail({
            from: "managingagents.se@gmail.com",
            to: email,
            subject: "Mã xác thực đổi mật khẩu",
            text: `Mã xác thực đổi mật khẩu của bạn là: ${code}. Mã có hiệu lực trong 10 phút.`,
        });

        console.log(`✅ [requestChangePasswordCode] Đã gửi email mã xác thực tới: ${email}`);
        res.status(200).json({ message: "Đã gửi mã xác thực tới email của bạn." });
    } catch (err) {
        console.error("❌ [requestChangePasswordCode] Lỗi hệ thống:", err);
        res.status(500).json({ error: "Lỗi khi gửi mã xác thực" });
    }
};

// ✅ Bước 2: Xác nhận đổi mật khẩu
exports.confirmChangePassword = async (req, res) => {
    const { email, code, newPassword } = req.body;
    console.log(`👉 [confirmChangePassword] Yêu cầu xác nhận đổi mật khẩu cho email: ${email}, mã code: ${code}`);

    try {
        const stored = changePasswordCodes.get(email);

        if (!stored) {
            console.log("❌ [confirmChangePassword] Không tìm thấy mã cho email:", email);
            return res.status(400).json({ error: "Mã xác thực không hợp lệ hoặc đã hết hạn." });
        }

        if (stored.code !== code) {
            console.log(`❌ [confirmChangePassword] Mã không khớp. Nhập: ${code}, thực tế: ${stored.code}`);
            return res.status(400).json({ error: "Mã xác thực không hợp lệ hoặc đã hết hạn." });
        }

        // Kiểm tra hết hạn (10 phút)
        if (Date.now() - stored.createdAt > 10 * 60 * 1000) {
            console.log(`❌ [confirmChangePassword] Mã đã hết hạn cho email: ${email}`);
            changePasswordCodes.delete(email);
            return res.status(400).json({ error: "Mã xác thực đã hết hạn." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            console.log(`❌ [confirmChangePassword] Không tìm thấy user với email: ${email}`);
            return res.status(404).json({ error: "Email không tồn tại" });
        }

        console.log(`✅ [confirmChangePassword] Đổi mật khẩu cho user: ${user.username} (email: ${email})`);
        user.password = newPassword;
        await user.save();

        changePasswordCodes.delete(email);
        console.log(`✅ [confirmChangePassword] Đổi mật khẩu thành công và đã xóa mã tạm cho email: ${email}`);

        res.status(200).json({ message: "Đổi mật khẩu thành công." });
    } catch (err) {
        console.error("❌ [confirmChangePassword] Lỗi hệ thống:", err);
        res.status(500).json({ error: "Lỗi khi đổi mật khẩu" });
    }
};

