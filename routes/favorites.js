const router = require('express').Router();
const User = require('../models/User'); 
const verifyToken = require('../middleware/authMiddleware');

router.get('/:userId', verifyToken, async (req, res) => { 
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.status(200).json(user.favorites || []);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post('/add', verifyToken, async (req, res) => { 
  console.log("----------------------------------------------");
  console.log("🔵 HIT /api/favorites/add");

  try {
    const { userId, ...recipeData } = req.body;

    // A. Check if ID exists
    if (!userId) {
      return res.status(400).json({ message: "No userId provided" });
    }

    // B. Find User
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // C. Check Duplicate
    const isAlreadyFav = user.favorites.some(fav => String(fav.recipeId) === String(recipeData.recipeId));
    
    if (isAlreadyFav) {
      console.log("⚠️ Recipe already in favorites. Skipping.");
      return res.status(200).json({ success: true, favorites: user.favorites });
    }

    // D. Push & Save
    console.log("➕ Adding new recipe...");
    user.favorites.push(recipeData);
    
    const savedUser = await user.save(); 
    console.log("💾 Save Completed!");
    
    res.status(200).json({ success: true, favorites: savedUser.favorites });

  } catch (err) {
    console.error("💥 CRASH adding favorite:", err);
    res.status(500).json({ message: "Could not add favorite" });
  }
});
router.post('/remove', verifyToken, async (req, res) => {
  try {
    const { userId, recipeId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.favorites = user.favorites.filter(fav => String(fav.recipeId) !== String(recipeId));
    await user.save();

    res.status(200).json({ success: true, favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ message: "Could not remove favorite" });
  }
});

module.exports = router;