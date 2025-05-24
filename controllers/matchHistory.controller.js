// controllers/matchHistory.controller.js
const MatchHistory = require("../models/matchHistory.model");
const User = require("../models/user.model");
// Lấy toàn bộ match history
exports.getAllMatches = async (req, res) => {
    try {
        const matches = await MatchHistory.find()
            .populate("playerBlack", "username")
            .populate("playerWhite", "username")
            .sort({ createdAt: -1 });
        res.json(matches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ Hàm tính delta Elo
function calculateDeltaElo(yourElo, opponentElo, result, k = 32) {
  const expected = 1 / (1 + Math.pow(10, (opponentElo - yourElo) / 400));
  return Math.round(k * (result - expected));
}

exports.createMatch = async (req, res) => {
  try {
    const { playerBlack, playerWhite, winner, type, moves, resultDescription } = req.body;

    if (!winner || !type || !Array.isArray(moves)) {
      return res.status(400).json({
        message: "Thiếu trường bắt buộc hoặc moves không hợp lệ",
        required: ["winner", "type", "moves[]"]
      });
    }

    let deltaEloBlack = 0;
    let deltaEloWhite = 0;
    let description = resultDescription?.trim() || "Match result";

    if (type === "ranked") {
      const [blackUser, whiteUser] = await Promise.all([
        User.findById(playerBlack),
        User.findById(playerWhite)
      ]);

      if (!blackUser || !whiteUser) {
        return res.status(404).json({ message: "Không tìm thấy người chơi" });
      }

      const blackElo = blackUser.elo ?? 1000;
      const whiteElo = whiteUser.elo ?? 1000;

      // Tính kết quả thắng/thua
      let resultBlack = 0.5;
      let resultWhite = 0.5;

      if (winner === "black") {
        resultBlack = 1;
        resultWhite = 0;
      } else if (winner === "white") {
        resultBlack = 0;
        resultWhite = 1;
      }

      deltaEloBlack = calculateDeltaElo(blackElo, whiteElo, resultBlack);
      deltaEloWhite = calculateDeltaElo(whiteElo, blackElo, resultWhite);

      blackUser.elo += deltaEloBlack;
      whiteUser.elo += deltaEloWhite;

      await Promise.all([blackUser.save(), whiteUser.save()]);

      // Gộp mô tả thêm deltaElo
      description += ` | deltaEloBlack: ${deltaEloBlack >= 0 ? '+' : ''}${deltaEloBlack}, deltaEloWhite: ${deltaEloWhite >= 0 ? '+' : ''}${deltaEloWhite}`;
    }

    const match = new MatchHistory({
      playerBlack,
      playerWhite,
      winner,
      type,
      moves,
      resultDescription: description,
      startTime: req.body.startTime || new Date(),
      endTime: new Date(),
    });

    await match.save();

    // Nếu là ranked thì lưu vào matchHistory của user
    if (type === "ranked") {
      await Promise.all([
        User.findByIdAndUpdate(playerBlack, { $push: { matchHistory: match._id } }),
        User.findByIdAndUpdate(playerWhite, { $push: { matchHistory: match._id } }),
      ]);
    }

    res.status(201).json(match);
  } catch (error) {
    console.error("❌ [Match] Lỗi khi tạo match:", error);
    res.status(400).json({ message: error.message });
  }
};


// Lấy chi tiết 1 match theo ID
exports.getMatchById = async (req, res) => {
    try {
        const match = await MatchHistory.findById(req.params.id)
            .populate("playerBlack", "username")
            .populate("playerWhite", "username");
        if (!match) return res.status(404).json({ message: "Match not found" });
        res.json(match);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Xóa match theo ID
exports.deleteMatch = async (req, res) => {
    try {
        const match = await MatchHistory.findByIdAndDelete(req.params.id);
        if (!match) return res.status(404).json({ message: "Match not found" });
        res.json({ message: "Match deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.getMatchesByUserId = async (req, res) => {
    const { userId } = req.params;

    try {
        const matches = await MatchHistory.find({
            $or: [
                { playerBlack: userId },
                { playerWhite: userId }
            ]
        }).populate('playerBlack')
          .populate('playerWhite');

        if (!matches || matches.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy trận đấu nào cho user này.' });
        }

        res.json(matches);
    } catch (error) {
        console.error("❌ Lỗi khi lấy trận đấu của user:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};