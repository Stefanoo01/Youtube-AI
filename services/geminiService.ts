import { GoogleGenAI } from "@google/genai";
import { Script, CharacterProfile } from '../types';

const MODELS = [
  "gemini-3.1-flash-lite-preview",  // 1° preferito
  "gemini-2.5-flash",               // 2° fallback
  "gemini-3-flash-preview",         // 3° fallback
  "gemini-2.5-flash-lite",          // 4° ultimo fallback
];

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
};

export const generateVideoScript = async (
  topic: string,
  existingScripts: Script[],
  profile: CharacterProfile
): Promise<string> => {
  const ai = getAiClient();
  const targetLanguage = profile.language || 'English';

  // We use existing scripts as "Few-Shot" examples to teach the AI the style.
  const uploadedScripts = existingScripts.filter(s => s.type === 'uploaded');
  
  // Calculate average word count to enforce length
  let lengthInstruction = "Ensure the length is appropriate for a standard YouTube video.";
  if (uploadedScripts.length > 0) {
    const totalWords = uploadedScripts.reduce((acc, script) => acc + script.content.trim().split(/\s+/).length, 0);
    const avgWords = Math.round(totalWords / uploadedScripts.length);
    lengthInstruction = `IMPORTANT: The generated script MUST be approximately ${avgWords} words long to match the user's typical video length.`;
  }

  // We use ALL uploaded scripts. Gemini Flash has a 1M+ token context window.
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
    
    Formatting Rules (CRITICAL):
    1. The output MUST be written in ${targetLanguage}.
    2. Use [Square Brackets] for ALL stage directions, visuals, and gameplay actions.
    3. KEEP STAGE DIRECTIONS INLINE with the dialogue. Example: "I'm going to jump! [Jumps] That was close." DO NOT put them on their own line.
    4. Use **Double Asterisks** for words that should be spoken with emphasis/boldness.
    5. Format lines as: "${profile.hostName}: Dialogue here".
    
    Key Style Points:
    - Maintain the specific dynamic of ${profile.hostName} as a SOLO commentator.
    - Do not include a second host or partner. This is a single-player video.
    - Use Minecraft terminology correctly (in ${targetLanguage}).
    - Keep the tone fun, engaging, and suitable for a general gaming audience.
    - STICK TO THE LENGTH OF THE EXAMPLES.
  `;

  const prompt = `
    Here are examples of our previous scripts to learn our style and length:
    ${trainingExamples.length > 0 ? trainingExamples : "No previous scripts provided. Use a generic energetic single-player Minecraft style."}

    TASK:
    Write a new script in ${targetLanguage} for a Minecraft video about: "${topic}".
    ${lengthInstruction}
  `;

  let lastError: unknown;

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7, 
        }
      });

      return response.text || "Failed to generate script content.";
    } catch (error) {
      console.warn(`Model ${model} failed, falling back to next model...`, error);
      lastError = error;
    }
  }

  console.error("All Gemini models failed:", lastError);
  throw lastError;
};

export const regenerateScriptSection = async (
  sectionContent: string,
  profile: CharacterProfile
): Promise<string> => {
  const ai = getAiClient();
  const targetLanguage = profile.language || 'English';
  
  const systemInstruction = `
  You are a professional YouTube scriptwriter for a Minecraft channel featuring a single host: ${profile.hostName}.
    
    Your goal is to write a script for a new video that perfectly mimics the voice, personality, sentence structure, and length of the provided example scripts.
    
    Formatting Rules (CRITICAL):
    1. Use [Square Brackets] for ALL stage directions, visuals, and gameplay actions.
    3. Use **Double Asterisks** for words that should be spoken with emphasis/boldness.
    4. Format lines as: "${profile.hostName}: Dialogue here".
    
    Key Style Points:
    - Output MUST be in ${targetLanguage}.
    - Use Minecraft terminology correctly.
    - Keep the tone fun, engaging, and suitable for a general gaming audience.
    - STICK TO THE LENGTH OF THE EXAMPLES.
  `;

  const prompt = `
    REWRITE THIS SCRIPT SEGMENT IN ${targetLanguage}:
    "${sectionContent}"
    
    Output ONLY the rewritten text.
  `;

  let lastError: unknown;

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.8,
        }
      });

      return response.text?.trim() || sectionContent;
    } catch (error) {
      console.warn(`Model ${model} failed, falling back to next model...`, error);
      lastError = error;
    }
  }

  console.error("All Gemini models failed:", lastError);
  throw lastError;
};