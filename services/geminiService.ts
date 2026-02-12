import { GoogleGenAI } from "@google/genai";
import { AIInsight } from "../types";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY not found in env");
    // In a real app, handle this gracefully. For this demo, we might fail or mock.
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export const generateHabitInsights = async (habits: any[], goals: any[]): Promise<AIInsight[]> => {
  try {
    const ai = getAIClient();
    const prompt = `
      Analyze the following habit and goal data for a user.
      Habits: ${JSON.stringify(habits.map(h => ({ name: h.title, historyCount: Object.keys(h.history).length })))}
      Goals: ${JSON.stringify(goals.map(g => ({ name: g.title, progress: g.current / g.target })))}

      Provide 3 short, punchy insights in JSON format.
      Each insight should have: 'title', 'content' (max 20 words), and 'type' ('positive', 'negative', 'neutral').
      The insights should be motivational or analytical about consistency.
      Return ONLY valid JSON array.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as AIInsight[];
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return [
      { title: "Keep it up!", content: "Consistency is key. You're doing great on your daily routines.", type: "positive" },
      { title: "Watch the sleep", content: "Try to get to bed a bit earlier to maximize recovery.", type: "neutral" }
    ];
  }
};

export const generateAvatarImage = async (userDescription: string): Promise<string | null> => {
  try {
    const ai = getAIClient();
    // Using gemini-3-pro-image-preview for high quality avatars
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
            parts: [{ text: `A futuristic, cool digital avatar for a habit tracker profile. Style: Minimalist flat vector art. Description: ${userDescription}` }]
        },
        config: {
            imageConfig: {
                aspectRatio: "1:1",
                imageSize: "1K"
            }
        }
    });
    
    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    return null;
  }
};

export const findNearbyPlaces = async (lat: number, lng: number, query: string): Promise<string[]> => {
    try {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Find 3 ${query} near the provided location. List them with their names and a very brief description.`,
            config: {
                tools: [{ googleMaps: {} }],
                toolConfig: {
                    retrievalConfig: {
                        latLng: {
                            latitude: lat,
                            longitude: lng
                        }
                    }
                }
            }
        });

        // Extracting chunks directly as requested in instructions
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const places = chunks
            .map(c => c.maps?.title)
            .filter(t => !!t) as string[];

        // If no grounding chunks (simulation fallback or direct text parsing might be needed if chunks empty but text exists)
        if (places.length === 0 && response.text) {
             return [response.text.slice(0, 100) + "..."]; // Fallback to text snippet if structure differs
        }

        return places;
    } catch (e) {
        console.error("Maps grounding error", e);
        return ["Could not fetch nearby places."];
    }
}
