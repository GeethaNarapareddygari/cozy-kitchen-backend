const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
  // Link the recipe to the user who created it
  userId: { 
    type: String, 
    required: true 
  },
  
  title: { 
    type: String, 
    required: true 
  },
  
  image: { 
    type: String, 
    required: true 
  },
  
  // Basic Info
  servings: { type: Number, required: true },
  sourceUrl: { type: String }, // For the YouTube link
  
  // Arrays for tags (e.g., ["Italian", "Dinner"])
  cuisines: [String],
  dishTypes: [String],
  
  // Complex objects for Ingredients
  extendedIngredients: [{
    original: { type: String, required: true }
  }],
  
  // Complex objects for Instructions
  analyzedInstructions: [{
    steps: [{
      number: { type: Number },
      step: { type: String }
    }]
  }],
  
  // Automatically track when it was created
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Create and export the model
module.exports = mongoose.model('Recipe', RecipeSchema);