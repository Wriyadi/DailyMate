import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const geminiService = {
  async extractOdometer(base64Image: string): Promise<number | null> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: "Extract the numeric odometer mileage from this dashboard photo. Only return the number, no text." },
              { inlineData: { mimeType: "image/jpeg", data: base64Image } }
            ]
          }
        ],
      });
      const text = response.text?.trim() || "";
      const mileage = parseInt(text.replace(/[^0-9]/g, ""), 10);
      return isNaN(mileage) ? null : mileage;
    } catch (error) {
      console.error("Error extracting odometer:", error);
      return null;
    }
  },

  async checkSymptoms(symptoms: string, userData?: { age?: number, gender?: string, allergies?: string }): Promise<string> {
    try {
      const context = userData ? ` User Context: Age ${userData.age || 'unknown'}, Gender ${userData.gender || 'unknown'}, Allergies: ${userData.allergies || 'none'}.` : '';
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are an advanced AI Medical Triage Assistant. Perform complex triage on user symptoms, factoring in their age, gender, and allergies. Provide in-depth preliminary health insights, potential causes, and next steps. Always include a strong disclaimer that you are an AI and the user must consult a licensed physician.",
        },
        contents: `The user reports these symptoms: ${symptoms}.${context}`,
      });
      return response.text || "Unable to process symptoms at this time.";
    } catch (error) {
      console.error("Error checking symptoms:", error);
      return "An error occurred while analyzing symptoms.";
    }
  },

  async getVaccineRecommendations(childData: { name: string, age: number, gender: string }): Promise<string[]> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are a pediatric AI. Given a child's age, return a strict JSON array of strings containing the recommended vaccines they should have taken or should take now. For example: [\"BCG\", \"Hepatitis B (Dose 1)\", \"Polio (Dose 1)\"]. Do not include markdown formatting or extra text, just the raw JSON array. If unsure, provide standard WHO recommendations for that age.",
        },
        contents: `Child Name: ${childData.name}, Age: ${childData.age}, Gender: ${childData.gender}. Provide recommended vaccines as a JSON array of strings.`,
      });
      const text = response.text?.trim() || "[]";
      try {
        const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
        if (Array.isArray(parsed)) return parsed;
        return [];
      } catch (e) {
        console.error("Failed to parse vaccines JSON", text);
        return [];
      }
    } catch (error) {
      console.error("Error analyzing vaccines:", error);
      return [];
    }
  },

  async getNutritionRecommendations(childData: { name: string, age: number, gender: string, allergies?: string }): Promise<string> {
    try {
      const prompt = `Child Name: ${childData.name}, Age: ${childData.age}, Gender: ${childData.gender}${childData.allergies ? `, Allergies: ${childData.allergies}` : ''}.
Provide specific recommendations for milk and essential nutrients/vitamins for this child's development phase. Keep it actionable and concise.`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are a senior pediatric nutritionist AI. Recommend suitable milk and specific nutrients/vitamins based on age, gender and allergies.",
        },
        contents: prompt,
      });
      return response.text || "No insights found.";
    } catch (error) {
      console.error("Error analyzing child nutrition:", error);
      return "Error analyzing nutritional needs.";
    }
  },

  async analyzeChildHealth(childData: { name: string, age: number, gender: string, symptoms?: string, allergies?: string }): Promise<string> {
    try {
      const prompt = `Child Name: ${childData.name}, Age: ${childData.age}, Gender: ${childData.gender}${childData.allergies ? `, Allergies: ${childData.allergies}` : ''}. Symptoms: ${childData.symptoms || 'none'}.
        Estimate vaccination schedules, recommend suitable milk (allergy-aware), suggest vitamins to prevent stunting, and provide AI triage for symptoms.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are a senior pediatric health AI capable of complex triage. Provide actionable, medically sound advice for child development and health triage. Include vaccination markers and nutritional recommendations.",
        },
        contents: prompt,
      });
      return response.text || "No insights found.";
    } catch (error) {
      console.error("Error analyzing child health:", error);
      return "Error analyzing pediatric data.";
    }
  },

  async troubleshootHobby(type: 'pet' | 'plant', problem: string, base64Image?: string | null): Promise<string> {
    try {
      const parts: any[] = [{ text: `Problem description: ${problem}` }];
      if (base64Image) {
        parts.push({ inlineData: { mimeType: "image/jpeg", data: base64Image } });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are an advanced diagnostic AI specializing in ${type === 'pet' ? 'veterinary medicine' : 'botany and plant pathology'}. Utilize your advanced vision capabilities to perform a unified visual diagnostic if an image is provided. Detail potential diagnoses, causes, and step-by-step solutions. Keep it highly actionable.`,
        },
        contents: [{ parts }],
      });
      return response.text || "No solutions found.";
    } catch (error) {
      console.error("Error troubleshooting hobby:", error);
      return "An error occurred while finding solutions.";
    }
  },

  async recommendRecipe(preferences: string, cuisinePreferences?: string[]): Promise<string> {
    try {
      const cuisineStr = cuisinePreferences?.length ? ` Cuisines: ${cuisinePreferences.join(', ')}.` : '';
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are a master gourmet chef. Recommend a personalized, healthy recipe based on user preferences and cuisine favorites. Detail precise ingredients and step-by-step instructions.",
        },
        contents: `User preferences: ${preferences}.${cuisineStr}`,
      });
      return response.text || "No recipe found.";
    } catch (error) {
      console.error("Error recommending recipe:", error);
      return "An error occurred while generating a recipe.";
    }
  },

  async getHouseholdRestockingInsights(inventory: { children: number, pets: string[], plants: string[] }): Promise<string> {
    try {
      const prompt = `Household composition: ${inventory.pets.length} pets (${inventory.pets.join(', ')}), ${inventory.plants.length} plants (${inventory.plants.join(', ')}), ${inventory.children} children. Synthesize a smart, comprehensive restocking logic and checklist covering groceries, pet food, and plant care supplies.`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are an advanced household operations AI. Synthesize logical, predictive restocking needs for complex households with children, pets, and plants. Output a smart, bulleted checklist.",
        },
        contents: prompt,
      });
      return response.text || "No recommendations.";
    } catch (error) {
      console.error("Error generating restock info:", error);
      return "Error generating recommendations.";
    }
  },

  async analyzeMeal(base64Image: string, gender: string = 'unknown', bmi: number | null = null): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are an advanced AI nutritionist. Leverage advanced vision capabilities to precisely estimate calories and macronutrients (like carbs) from the provided meal image. Recommend specific fruits/vegetables to achieve dietary balance according to gender and BMI parameters.",
        },
        contents: [
          {
            parts: [
              { text: `Analyze the meal and estimate calories and carbohydrates. User context -> Gender: ${gender}, BMI: ${bmi || 'unknown'}. Give clear recommendations to balance their diet.` },
              { inlineData: { mimeType: "image/jpeg", data: base64Image } }
            ]
          }
        ],
      });
      return response.text || "Unable to analyze meal.";
    } catch (error) {
      console.error("Error analyzing meal:", error);
      return "An error occurred while analyzing the meal.";
    }
  },

  async getHealthInsights(caloriesConsumed: number, caloriesBurned: number, bmi: number | null): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are a proactive Virtual Medical & Fitness Assistant. Perform a complex analysis comparing daily calories consumed vs burned, factoring in BMI. Deliver a concise, medically-sound, encouraging summary and actionable fitness advice.",
        },
        contents: `Calories consumed today: ${caloriesConsumed}. Calories burned today: ${caloriesBurned}. User BMI is ${bmi || 'unknown'}. Provide analysis and actionable advice.`,
      });
      return response.text || "Keep up the good work!";
    } catch (error) {
      console.error("Error generating health insights:", error);
      return "Unable to generate insights at this time.";
    }
  }
};
