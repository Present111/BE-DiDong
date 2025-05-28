const User = require("../models/user.model");

exports.createUser = async (data) => {
  return await User.create(data);
};

exports.getAllUsers = async () => {
  return await User.find();
};

exports.getUsersSortedByElo = async (limit = 20) => {
  return await User.find().sort({ elo: -1 }).limit(limit);
};
