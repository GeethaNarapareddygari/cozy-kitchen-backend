const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // 1. Get the token from the request header
  const token = req.header('auth-token');

  // 2. If no token, stop them right here
  if (!token) {
    return res.status(401).json({ message: "Access Denied. No token provided." });
  }

  try {
    // 3. Check if the token is valid using your Secret Key
    // Note: Make sure this matches the key you used in auth.js!
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secretkey123');
    
    // 4. Attach the user data to the request so routes can use it
    req.user = verified;
    
    // 5. Let them pass!
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};