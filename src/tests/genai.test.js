import { GoogleGenAI } from "@google/genai";


const ai = new GoogleGenAI({ apiKey: "API_KEY"});

async function main() {
    
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: "Explain how AI works in a few words",
  });
  console.log(response.usageMetadata.cacheTokensDetails);
}

 main();