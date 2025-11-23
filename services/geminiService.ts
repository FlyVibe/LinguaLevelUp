import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { LevelData, AnalysisResult, CoursePlan, ScenarioTopic, TimeFrame } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- 1. Analysis Schema ---
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    originalGoal: { type: Type.STRING },
    suggestedTopics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING, description: "Specific sub-scenario title (e.g. 'At the Airport')" },
          description: { type: Type.STRING, description: "Brief description of what will be learned" },
          keyVocabulary: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 key words/phrases" },
        },
        required: ["id", "title", "description", "keyVocabulary"],
      },
    },
  },
  required: ["originalGoal", "suggestedTopics"],
};

export const analyzeUserScenario = async (goal: string): Promise<AnalysisResult> => {
  const prompt = `
    The user wants to learn English for the following goal: "${goal}".
    Analyze this goal and break it down into 6-10 specific, practical sub-scenarios or situations they will likely encounter.
    For example, if the goal is "Travel to USA", sub-scenarios could be "Airport Immigration", "Ordering Food", "Hotel Check-in", "Asking Directions", etc.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "You are an expert curriculum designer for English learners.",
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No analysis returned");
    return JSON.parse(jsonText) as AnalysisResult;
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};

// --- 2. Planning Schema ---
const coursePlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    planTitle: { type: Type.STRING, description: "A catchy title for the full course" },
    totalDuration: { type: Type.STRING },
    modules: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING, description: "Must match one of the selected topic titles" },
          description: { type: Type.STRING },
          estimatedTime: { type: Type.STRING, description: "Time to complete this module based on user's timeframe" },
          status: { type: Type.STRING, enum: ["locked", "current", "completed"] },
        },
        required: ["id", "title", "description", "estimatedTime", "status"],
      },
    },
  },
  required: ["planTitle", "totalDuration", "modules"],
};

export const generateCoursePlan = async (topics: ScenarioTopic[], timeFrame: TimeFrame): Promise<CoursePlan> => {
  const topicTitles = topics.map(t => t.title).join(", ");
  const prompt = `
    Create a structured English study roadmap based on these selected topics: [${topicTitles}].
    The user wants to complete this learning journey over a period defined by: "${timeFrame}".
    Organize the topics into a logical sequence (Modules).
    Set the first module status to 'current', and the rest to 'locked'.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: coursePlanSchema,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No plan returned");
    return JSON.parse(jsonText) as CoursePlan;
  } catch (error) {
    console.error("Planning Error:", error);
    throw error;
  }
};

// --- 3. Level Generation (Existing, slightly updated schema description) ---
const levelSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    topic: { type: Type.STRING },
    levelName: { type: Type.STRING },
    flashcards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          front: { type: Type.STRING },
          back: { type: Type.STRING },
          pronunciation: { type: Type.STRING },
          imageVisualDescription: { type: Type.STRING },
        },
        required: ["id", "front", "back", "imageVisualDescription"],
      },
    },
    rolePlay: {
      type: Type.OBJECT,
      properties: {
        setting: { type: Type.STRING },
        userRole: { type: Type.STRING },
        aiRole: { type: Type.STRING },
        objective: { type: Type.STRING },
        openingLine: { type: Type.STRING },
      },
      required: ["setting", "userRole", "aiRole", "objective", "openingLine"],
    },
    exam: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctIndex: { type: Type.INTEGER },
          explanation: { type: Type.STRING },
        },
        required: ["id", "question", "options", "correctIndex", "explanation"],
      },
    },
    weeklyPlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.INTEGER },
          focus: { type: Type.STRING },
          task: { type: Type.STRING },
          duration: { type: Type.STRING },
        },
        required: ["day", "focus", "task", "duration"],
      },
    },
  },
  required: ["topic", "levelName", "flashcards", "rolePlay", "exam", "weeklyPlan"],
};

export const generateLevelContent = async (scenario: string): Promise<LevelData> => {
  const prompt = `
    You are an expert English teacher.
    Create a detailed learning module for the specific scenario: "${scenario}".
    
    Requirements:
    1. **Flashcards**: 6-8 practical sentences. Include visual description for GSV/First-person view generation.
    2. **Roleplay**: Realistic dialogue setup.
    3. **Exam**: 3-5 questions.
    4. **WeeklyPlan**: A micro-task list (3-5 items) to master JUST this specific scenario.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: levelSchema,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from Gemini");

    return JSON.parse(jsonText) as LevelData;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export const getRolePlayResponse = async (
  history: { role: "user" | "model"; parts: { text: string }[] }[],
  message: string
): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: history,
      config: {
        systemInstruction: "You are a roleplay partner. Keep responses concise (1-2 sentences), natural, and helpful.",
      }
    });

    const result = await chat.sendMessage({ message });
    return result.text || "I didn't catch that.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Connection error.";
  }
};

// --- Multimedia Services (Unchanged) ---

export const generateCardImage = async (visualDescription: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Photorealistic, cinematic, first-person POV shot. ${visualDescription}. High resolution.` }]
      },
    });
    
    if (response.candidates?.[0]?.content?.parts) {
       for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    return null;
  }
};

export const generateCardAudio = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("Audio Gen Error:", error);
    return null;
  }
};

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function playEncodedAudio(base64String: string) {
  try {
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const outputNode = outputAudioContext.createGain();
    outputNode.connect(outputAudioContext.destination);

    const audioBuffer = await decodeAudioData(
      decode(base64String),
      outputAudioContext,
      24000,
      1,
    );
    
    const source = outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputNode);
    source.start();
  } catch (e) {
    console.error("Audio Playback Error", e);
  }
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
