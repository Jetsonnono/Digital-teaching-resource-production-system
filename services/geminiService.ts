import { GoogleGenAI } from "@google/genai";

// Ensure API key is present (Mocking the check for the environment variable in this context)
const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Helper to convert file to Base64
 */
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Generate a Lesson Plan (Text Only)
 */
export const generateLessonPlan = async (topic: string, grade: string, context: string): Promise<string> => {
  if (!API_KEY) return "Error: API Key is missing. Please check your environment.";

  try {
    const prompt = `
      Act as an expert educational designer. Create a detailed lesson plan for:
      Topic: ${topic}
      Grade Level: ${grade}
      Context: ${context}

      The output should be formatted in Markdown and include:
      1. Learning Objectives
      2. Key Vocabulary
      3. Materials Needed
      4. Step-by-Step Instruction (Introduction, Main Activity, Wrap-up)
      5. Assessment Methods
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No content generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `Error generating lesson plan: ${(error as Error).message}`;
  }
};

/**
 * Generate a Quiz (Text Only)
 */
export const generateQuiz = async (topic: string, grade: string): Promise<string> => {
  if (!API_KEY) return "Error: API Key is missing.";

  try {
    const prompt = `Create a 5-question multiple-choice quiz for ${grade} students about "${topic}". 
    Format the output in Markdown. Include the answer key at the very bottom.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No content generated.";
  } catch (error) {
    return `Error generating quiz: ${(error as Error).message}`;
  }
};

/**
 * Analyze Uploaded Material (Multimodal: Image/Audio -> Text)
 */
export const analyzeMaterial = async (file: File, instruction: string): Promise<string> => {
  if (!API_KEY) return "Error: API Key is missing.";

  try {
    const filePart = await fileToGenerativePart(file);
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Flash supports multimodal (audio/video/images)
      contents: {
        parts: [
          filePart,
          { text: instruction || "Analyze this material and summarize its educational value." }
        ]
      }
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    return `Error analyzing material: ${(error as Error).message}`;
  }
};
