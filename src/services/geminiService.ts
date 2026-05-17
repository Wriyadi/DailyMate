export const geminiService = {
  getSystemInstruction(baseInstruction: string): string {
    const lang = typeof window !== 'undefined' ? localStorage.getItem('language') : 'en';
    const langSuffix = lang === 'id' ? ' You MUST respond in Bahasa Indonesia.' : ' You MUST respond in English.';
    return baseInstruction + langSuffix;
  },

  async requestGemini(body: any): Promise<string | null> {
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        let errorMsg = 'Failed to fetch Gemini API';
        try {
          const err = await res.json();
          errorMsg = err.error || errorMsg;
        } catch (e) {
          errorMsg = `Server error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMsg);
      }
      const data = await res.json();
      return data.text;
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('Network error: Could not reach the server. Please check your connection or if the server is running.');
      }
      throw error;
    }
  },

  async enhanceRecipeFormat(recipeText: string): Promise<string> {
    try {
      const text = await this.requestGemini({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: this.getSystemInstruction("You are a master culinary editor. Format the provided recipe beautifully in Markdown. Fix typos, improve structure, and use an appealing tone. Always output in Indonesian, with sections like 'Bahan Utama & Bumbu' and 'Cara Membuat'."),
        },
        contents: `Recipe to improve: \n\n${recipeText}`,
      });
      return text || recipeText;
    } catch (error: any) {
      console.error("Error enhancing recipe format:", error);
      return recipeText;
    }
  },

  async extractOdometer(base64Image: string): Promise<number | null> {
    try {
      const text = await this.requestGemini({
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
      if (!text) return null;
      const mileage = parseInt(text.replace(/[^0-9]/g, ""), 10);
      return isNaN(mileage) ? null : mileage;
    } catch (error: any) {
      console.error("Error extracting odometer:", error);
      if (error?.message?.includes('API key')) alert(error.message);
      return null;
    }
  },

  async checkSymptoms(symptoms: string, userData?: { age?: number, gender?: string, allergies?: string }): Promise<string> {
    try {
      const context = userData ? ` User Context: Age ${userData.age || 'unknown'}, Gender ${userData.gender || 'unknown'}, Allergies: ${userData.allergies || 'none'}.` : '';
      const text = await this.requestGemini({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: this.getSystemInstruction("You are an advanced AI Medical Triage Assistant. Perform complex triage on user symptoms, factoring in their age, gender, and allergies. Provide in-depth preliminary health insights, potential causes, and next steps. Always include a strong disclaimer that you are an AI and the user must consult a licensed physician."),
        },
        contents: `The user reports these symptoms: ${symptoms}.${context}`,
      });
      return text || "Unable to process symptoms at this time.";
    } catch (error: any) {
      console.error("Error checking symptoms:", error);
      if (error?.message?.includes('API key')) return error.message;
      return "An error occurred while analyzing symptoms.";
    }
  },

  async getVaccineRecommendations(childData: { name: string, age: number, gender: string }): Promise<string[]> {
    try {
      const text = await this.requestGemini({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: this.getSystemInstruction("You are a pediatric AI. Given a child's age, return a strict JSON array of strings containing the recommended vaccines they should have taken or should take now. For example: [\"BCG\", \"Hepatitis B (Dose 1)\", \"Polio (Dose 1)\"]. Do not include markdown formatting or extra text, just the raw JSON array. If unsure, provide standard WHO recommendations for that age."),
        },
        contents: `Child Name: ${childData.name}, Age: ${childData.age}, Gender: ${childData.gender}. Provide recommended vaccines as a JSON array of strings.`,
      });
      const parsedText = (text || "[]").trim();
      try {
        const parsed = JSON.parse(parsedText.replace(/```json/g, '').replace(/```/g, '').trim());
        if (Array.isArray(parsed)) return parsed;
        return [];
      } catch (e) {
        console.error("Failed to parse vaccines JSON", parsedText);
        return [];
      }
    } catch (error: any) {
      console.error("Error analyzing vaccines:", error);
      if (error?.message?.includes('API key')) alert(error.message);
      return [];
    }
  },

  async getNutritionRecommendations(childData: { name: string, age: number, gender: string, allergies?: string }): Promise<string> {
    try {
      const prompt = `Child Name: ${childData.name}, Age: ${childData.age}, Gender: ${childData.gender}${childData.allergies ? `, Allergies: ${childData.allergies}` : ''}.
Provide specific recommendations for milk and essential nutrients/vitamins for this child's development phase. Keep it actionable and concise.`;
      const text = await this.requestGemini({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: this.getSystemInstruction("You are a senior pediatric nutritionist AI. Recommend suitable milk and specific nutrients/vitamins based on age, gender and allergies."),
        },
        contents: prompt,
      });
      return text || "No insights found.";
    } catch (error: any) {
      console.error("Error analyzing child nutrition:", error);
      if (error?.message?.includes('API key')) return error.message;
      return "Error analyzing nutritional needs.";
    }
  },

  async analyzeChildHealth(childData: { name: string, age: number, gender: string, symptoms?: string, allergies?: string }): Promise<string> {
    try {
      const prompt = `Child Name: ${childData.name}, Age: ${childData.age}, Gender: ${childData.gender}${childData.allergies ? `, Allergies: ${childData.allergies}` : ''}. Symptoms: ${childData.symptoms || 'none'}.
        Estimate vaccination schedules, recommend suitable milk (allergy-aware), suggest vitamins to prevent stunting, and provide AI triage for symptoms.`;
      
      const text = await this.requestGemini({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: this.getSystemInstruction("You are a senior pediatric health AI capable of complex triage. Provide actionable, medically sound advice for child development and health triage. Include vaccination markers and nutritional recommendations."),
        },
        contents: prompt,
      });
      return text || "No insights found.";
    } catch (error: any) {
      console.error("Error analyzing child health:", error);
      if (error?.message?.includes('API key')) return error.message;
      return "Error analyzing pediatric data.";
    }
  },

  async troubleshootHobby(type: 'pet' | 'plant', problem: string, base64Image?: string | null): Promise<string> {
    try {
      const parts: any[] = [{ text: `Problem description: ${problem}` }];
      if (base64Image) {
        parts.push({ inlineData: { mimeType: "image/jpeg", data: base64Image } });
      }

      const text = await this.requestGemini({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: this.getSystemInstruction(`You are an advanced diagnostic AI specializing in ${type === 'pet' ? 'veterinary medicine' : 'botany and plant pathology'}. Utilize your advanced vision capabilities to perform a unified visual diagnostic if an image is provided. Detail potential diagnoses, causes, and step-by-step solutions. Keep it highly actionable.`),
        },
        contents: [{ parts }],
      });
      return text || "No solutions found.";
    } catch (error: any) {
      console.error("Error troubleshooting hobby:", error);
      if (error?.message?.includes('API key')) return error.message;
      return "An error occurred while finding solutions.";
    }
  },

  async recommendRecipe(preferences: string, cuisinePreferences?: string[]): Promise<string> {
    try {
      const cuisineStr = cuisinePreferences?.length ? ` Cuisines: ${cuisinePreferences.join(', ')}.` : '';
      const text = await this.requestGemini({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: this.getSystemInstruction("You are a master gourmet chef. Recommend a personalized, healthy recipe based on user preferences and cuisine favorites. Detail precise ingredients and step-by-step instructions."),
        },
        contents: `User preferences: ${preferences}.${cuisineStr}`,
      });
      return text || "No recipe found.";
    } catch (error: any) {
      console.error("Error recommending recipe:", error);
      if (error?.message?.includes('API key')) return error.message;
      return "An error occurred while generating a recipe.";
    }
  },

  async getHouseholdRestockingInsights(inventory: { children: number, pets: string[], plants: string[] }): Promise<string> {
    try {
      const prompt = `Household composition: ${inventory.pets.length} pets (${inventory.pets.join(', ')}), ${inventory.plants.length} plants (${inventory.plants.join(', ')}), ${inventory.children} children. Synthesize a smart, comprehensive restocking logic and checklist covering groceries, pet food, and plant care supplies.`;
      const text = await this.requestGemini({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: this.getSystemInstruction("You are an advanced household operations AI. Synthesize logical, predictive restocking needs for complex households with children, pets, and plants. Output a smart, bulleted checklist."),
        },
        contents: prompt,
      });
      return text || "No recommendations.";
    } catch (error: any) {
      console.error("Error generating restock info:", error);
      if (error?.message?.includes('API key')) return error.message;
      return "Error generating recommendations.";
    }
  },

  async analyzeMeal(base64Image: string, gender: string = 'unknown', bmi: number | null = null): Promise<string> {
    try {
      const text = await this.requestGemini({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: this.getSystemInstruction("You are an advanced AI nutritionist. Leverage advanced vision capabilities to precisely estimate calories and macronutrients (like carbs) from the provided meal image. Recommend specific fruits/vegetables to achieve dietary balance according to gender and BMI parameters."),
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
      return text || "Unable to analyze meal.";
    } catch (error: any) {
      console.error("Error analyzing meal:", error);
      if (error?.message?.includes('API key')) return error.message;
      return "An error occurred while analyzing the meal.";
    }
  },

  async getHealthInsights(caloriesConsumed: number, caloriesBurned: number, bmi: number | null): Promise<string> {
    try {
      const text = await this.requestGemini({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: this.getSystemInstruction("You are a proactive Virtual Medical & Fitness Assistant. Perform a complex analysis comparing daily calories consumed vs burned, factoring in BMI. Deliver a concise, medically-sound, encouraging summary and actionable fitness advice."),
        },
        contents: `Calories consumed today: ${caloriesConsumed}. Calories burned today: ${caloriesBurned}. User BMI is ${bmi || 'unknown'}. Provide analysis and actionable advice.`,
      });
      return text || "Keep up the good work!";
    } catch (error: any) {
      console.error("Error generating health insights:", error);
      if (error?.message?.includes('API key')) return error.message;
      return "Unable to generate insights at this time.";
    }
  }
};
