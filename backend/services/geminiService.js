const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeDeveloper(userActivity, doraStats) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro"});

  const prompt = `
    Analyze this software engineer based on their last month's stats:
    - Role: ${userActivity.role}
    - Pull Requests Merged: ${userActivity.prs}
    - Code Reviews Given: ${userActivity.reviews}
    - DORA Lead Time: ${doraStats.lead_time} hours
    - Bug Fixes: ${userActivity.fixes}

    Task 1: Classify them into one 'Gamer Persona': 'The Architect' (High quality, slow), 'The Speedster' (Fast, high volume), 'The Guardian' (High reviews), or 'The Rookie' (Learning).
    Task 2: Give 1 sentence of motivational gamified feedback.
    
    Return JSON format: { "persona": "", "feedback": "" }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Clean up markdown code blocks if Gemini adds them
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '');
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Error:", error);
    return { persona: "Unknown", feedback: "Keep coding!" };
  }
}

module.exports = { analyzeDeveloper };