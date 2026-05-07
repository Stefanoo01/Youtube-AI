import { GoogleGenAI } from "@google/genai";
import { Script, CharacterProfile } from '../types';

export const GEMINI_MODELS = [
  { id: "gemini-3.1-flash-lite-preview", name: "Gemini 3.1 Flash Lite" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { id: "gemini-3-flash-preview", name: "Gemini 3 Flash" },
  { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite" },
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
  
  const defaultModelId = profile.selectedModel || GEMINI_MODELS[0].id;
  const orderedModels = [
    defaultModelId,
    ...GEMINI_MODELS.map(m => m.id).filter(id => id !== defaultModelId)
  ];

  for (let i = 0; i < orderedModels.length; i++) {
    const modelId = orderedModels[i];
    try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7, 
        }
      });

      return response.text || "Failed to generate script content.";
    } catch (error) {
      console.warn(`Model ${modelId} failed, falling back...`, error);
      lastError = error;
      
      const failedModelName = GEMINI_MODELS.find(m => m.id === modelId)?.name || modelId;
      const nextModelId = orderedModels[i + 1];
      
      if (nextModelId) {
        const nextModelName = GEMINI_MODELS.find(m => m.id === nextModelId)?.name || nextModelId;
        window.dispatchEvent(new CustomEvent('app-toast', { 
          detail: { message: `Errore in ${failedModelName}, fallback su ${nextModelName}...` } 
        }));
      } else {
        window.dispatchEvent(new CustomEvent('app-toast', { 
          detail: { message: `Tutti i modelli hanno fallito.`, type: 'error' } 
        }));
      }
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

  const defaultModelId = profile.selectedModel || GEMINI_MODELS[0].id;
  const orderedModels = [
    defaultModelId,
    ...GEMINI_MODELS.map(m => m.id).filter(id => id !== defaultModelId)
  ];

  for (let i = 0; i < orderedModels.length; i++) {
    const modelId = orderedModels[i];
    try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.8,
        }
      });

      return response.text?.trim() || sectionContent;
    } catch (error) {
      console.warn(`Model ${modelId} failed, falling back...`, error);
      lastError = error;

      const failedModelName = GEMINI_MODELS.find(m => m.id === modelId)?.name || modelId;
      const nextModelId = orderedModels[i + 1];
      
      if (nextModelId) {
        const nextModelName = GEMINI_MODELS.find(m => m.id === nextModelId)?.name || nextModelId;
        window.dispatchEvent(new CustomEvent('app-toast', { 
          detail: { message: `Errore in ${failedModelName}, fallback su ${nextModelName}...` } 
        }));
      } else {
        window.dispatchEvent(new CustomEvent('app-toast', { 
          detail: { message: `Tutti i modelli hanno fallito.`, type: 'error' } 
        }));
      }
    }
  }

  console.error("All Gemini models failed:", lastError);
  throw lastError;
};