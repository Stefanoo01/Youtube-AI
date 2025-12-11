import { GoogleGenAI } from "@google/genai";
import { Script, CharacterProfile } from '../types';

const getAiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateVideoScript = async (
  topic: string,
  existingScripts: Script[],
  profile: CharacterProfile
): Promise<string> => {
  const ai = getAiClient();

  // We use existing scripts as "Few-Shot" examples to teach the AI the style.
  const uploadedScripts = existingScripts.filter(s => s.type === 'uploaded');
  
  // Calculate average word count to enforce length
  let lengthInstruction = "Ensure the length is appropriate for a standard YouTube video.";
  if (uploadedScripts.length > 0) {
    const totalWords = uploadedScripts.reduce((acc, script) => acc + script.content.trim().split(/\s+/).length, 0);
    const avgWords = Math.round(totalWords / uploadedScripts.length);
    lengthInstruction = `IMPORTANT: The generated script MUST be approximately ${avgWords} words long to match the user's typical video length.`;
  }

  // We use ALL uploaded scripts. Gemini Flash has a 1M+ token context window, 
  // so we can fit dozens or hundreds of scripts easily. This acts as "In-Context Fine-Tuning".
  const trainingExamples = uploadedScripts
    .map(s => `
--- EXAMPLE SCRIPT START ---
Title: ${s.title}
Word Count: ${s.content.trim().split(/\s+/).length}
Content:
${s.content}
--- EXAMPLE SCRIPT END ---
    `).join('\n');

  const systemInstruction = `
    You are a professional YouTube scriptwriter for a Minecraft channel featuring a single host: ${profile.hostName}.
    
    Your goal is to write a script for a new video that perfectly mimics the voice, personality, sentence structure, and length of the provided example scripts.
    
    Key Style Points:
    - Maintain the specific dynamic of ${profile.hostName} as a SOLO commentator.
    - Do not include a second host or partner. This is a single-player video.
    - Use Minecraft terminology correctly.
    - Include stage directions for gameplay actions in brackets, e.g., [Starts punching wood].
    - Keep the tone fun, engaging, and suitable for a general gaming audience.
    - STICK TO THE LENGTH OF THE EXAMPLES. Do not make it significantly shorter or longer than the average example.
    
    Format the output clearly with the character name (${profile.hostName}: ...).
  `;

  console.log("Training examples:", trainingExamples);

  const prompt = `
    Here are examples of our previous scripts to learn our style and length:
    ${trainingExamples.length > 0 ? trainingExamples : "No previous scripts provided. Use a generic energetic single-player Minecraft style."}

    TASK:
    Write a new script for a Minecraft video about: "${topic}".
    ${lengthInstruction}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7, 
      }
    });

    return response.text || "Failed to generate script content.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};