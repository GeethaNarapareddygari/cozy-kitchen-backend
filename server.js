require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 

console.log("🔑 API KEY LOADED:", process.env.THEMEALDB_API_KEY ? "YES" : "NO");

const authRoutes = require('./routes/auth');
const favoritesRoutes = require('./routes/favorites');
const recipeRoutes = require('./routes/recipes');
const userRecipesRoute = require('./routes/userRecipes');

const app = express();
const PORT = process.env.PORT || 5007;
app.use(cors({
  origin: [
    "http://localhost:5173",                       // Localhost
    "https://cozy-kitchen-api.onrender.com",       // Backend itself
    "https://cozy-kitchen-frontend.vercel.app"    // 👈 PASTE YOUR COPIED VERCEL LINK HERE
  ],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "auth-token"]
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/user-recipes', userRecipesRoute);

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});