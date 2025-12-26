const express = require('express');
const router = express.Router();
const axios = require('axios');

// Helper to Shuffle
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Helper: Format Ingredients
const formatIngredients = (meal) => {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim() !== "") {
      ingredients.push({
        name: ingredient.trim(),
        amount: measure ? measure.trim() : "" 
      });
    }
  }
  return ingredients;
};

router.get('/search', async (req, res) => {
  const query = req.query.q || '';
  const ingredientsParam = req.query.ingredients || '';
  const apiKey = process.env.THEMEALDB_API_KEY || '1';

  try {
    let initialMeals = [];

    // STEP 1: FIND RECIPES (Get IDs)
    if (query) {
      const apiUrl = `https://www.themealdb.com/api/json/v1/${apiKey}/search.php?s=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl);
      initialMeals = response.data.meals || [];
    } 
    else if (ingredientsParam) {
      const ingredientList = ingredientsParam.split(',').map(i => i.trim());
      
      const requests = ingredientList.map(ing => 
        axios.get(`https://www.themealdb.com/api/json/v1/${apiKey}/filter.php?i=${encodeURIComponent(ing)}`)
      );

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        if (response.data.meals) {
          initialMeals = [...initialMeals, ...response.data.meals];
        }
      });
    }

    // STEP 2: REMOVE DUPLICATES & SHUFFLE
    const uniqueIds = new Set();
    const uniqueMeals = initialMeals.filter(meal => {
      const isDuplicate = uniqueIds.has(meal.idMeal);
      uniqueIds.add(meal.idMeal);
      return !isDuplicate;
    });

    const shuffledMeals = shuffleArray(uniqueMeals);

    // STEP 3: DEEP LOOKUP (The Fix 🛠️)
    // ✅ CHANGED: Limit increased to 100 so you see all results
    const topMeals = shuffledMeals.slice(0, 100);

    const detailRequests = topMeals.map(meal => {
        // If we already have the area (from Name search), skip fetch
        if (meal.strArea) return Promise.resolve({ data: { meals: [meal] } });
        
        // Otherwise, fetch full details by ID
        return axios.get(`https://www.themealdb.com/api/json/v1/${apiKey}/lookup.php?i=${meal.idMeal}`);
    });

    const detailResponses = await Promise.all(detailRequests);
    
    const fullMeals = detailResponses.map(resp => resp.data.meals ? resp.data.meals[0] : null).filter(Boolean);

    // STEP 4: FORMAT DATA
    const formattedResults = fullMeals.map(meal => {
      let steps = [];
      if (meal.strInstructions) {
        steps = meal.strInstructions.split(/\r\n|\n|\./).filter(s => s.length > 5).map(s => s.trim());
      } else {
         steps = ["Click recipe to view instructions..."];
      }

      // Mock Data
      const randomTime = Math.floor(Math.random() * 30) + 20;     
      const randomCals = Math.floor(Math.random() * 300) + 300;   

      return {
        id: meal.idMeal,
        title: meal.strMeal,
        image: `${meal.strMealThumb}/preview`, 
        fullImage: meal.strMealThumb,          
        
        ingredients: formatIngredients(meal),
        instructions: steps,
        
        dishTypes: meal.strCategory ? [meal.strCategory] : ["Main Course"],
        cuisines: meal.strArea ? [meal.strArea] : ["International"], 
        
        readyInMinutes: randomTime,
        servings: 2,
        calories: `${randomCals} kcal`, 
        sourceUrl: meal.strSource || meal.strYoutube || ""
      };
    });

    res.json({
        results: formattedResults,
        totalResults: formattedResults.length
    });

  } catch (err) {
    console.error("❌ ERROR:", err.message);
    res.status(500).json({ error: "Fetch failed" });
  }
});

module.exports = router;