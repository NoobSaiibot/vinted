const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  // Le token reçu est dans req.headers.authorization
  // console.log(req.headers.authorization);
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Je vais chercher mon token et j'enlève "Bearer " devant
    const token = req.headers.authorization.replace("Bearer ", "");
    // console.log(token);
    const user = await User.findOne({ token: token }).select("account _id");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = isAuthenticated;
