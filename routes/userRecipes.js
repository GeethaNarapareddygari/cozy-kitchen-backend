const router = require('express').Router();
const Recipe = require('../models/Recipe'); 
const verifyToken = require('../middleware/authMiddleware'); // 👈 1. IMPORT THIS

// ---------------------------------------------------
// 1. ADD A NEW RECIPE (Protected 🔒)
// Route: POST /api/user-recipes/add
// ---------------------------------------------------
router.post('/add', verifyToken, async (req, res) => { // 👈 2. ADD verifyToken
  try {
    const newRecipe = new Recipe({
      userId: req.body.userId,
      title: req.body.title,
      image: req.body.image,
      servings: req.body.servings,
      readyInMinutes: req.body.readyInMinutes,
      sourceUrl: req.body.sourceUrl,
      cuisines: req.body.cuisines,
      dishTypes: req.body.dishTypes,
      extendedIngredients: req.body.extendedIngredients,
      analyzedInstructions: req.body.analyzedInstructions
    });

    const savedRecipe = await newRecipe.save();
    res.status(200).json(savedRecipe);
  } catch (err) {
    console.error("Error adding recipe:", err);
    res.status(500).json({ message: "Failed to add recipe" });
  }
});

// ---------------------------------------------------
// 2. GET ALL RECIPES FOR A USER (Protected 🔒)
// Route: GET /api/user-recipes/my-recipes/:userId
// ---------------------------------------------------
router.get('/my-recipes/:userId', verifyToken, async (req, res) => { // 👈 2. ADD verifyToken
  try {
    const recipes = await Recipe.find({ userId: req.params.userId });
    res.status(200).json(recipes || []); 
  } catch (err) {
    console.error("Error fetching recipes:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------------------------------------------
// 3. GET SINGLE RECIPE DETAILS (Public 🔓)
// Route: GET /api/user-recipes/recipe/:id
// Note: We keep this public so anyone can view the details!
// ---------------------------------------------------
router.get('/recipe/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    res.status(200).json(recipe);
  } catch (err) {
    console.error("Error fetching single recipe:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------------------------------------------
// 4. DELETE A RECIPE (Protected 🔒)
// Route: DELETE /api/user-recipes/delete/:id
// ---------------------------------------------------
router.delete('/delete/:id', verifyToken, async (req, res) => { // 👈 2. ADD verifyToken
  try {
    const deletedRecipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!deletedRecipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    res.status(200).json({ message: "Recipe deleted successfully" });
  } catch (err) {
    console.error("Error deleting recipe:", err);
    res.status(500).json({ message: "Server error during deletion" });
  }
});

module.exports = router;