import OpenAI from 'openai';
import fs from 'fs-extra';
import { ApiError } from '../middleware/error';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Character trait interface
export interface CharacterTraits {
  hairStyle: string;
  hairColor: string;
  facialHair: string;
  shirtStatus: string;
  shortsColor: string;
  tattoos: string;
}

/**
 * Service for interacting with OpenAI Vision API
 */
export const visionService = {
  /**
   * Analyze an image to extract character traits
   * 
   * @param imageBase64 - Base64-encoded image to analyze
   * @returns Structured character traits
   */
  analyzeImage: async (imageBase64: string): Promise<CharacterTraits> => {
    try {
      console.log('[Vision Service] Analyzing image with GPT-4o Vision...');
      
      // Clean the base64 string if it includes the data URL prefix
      let cleanBase64 = imageBase64;
      if (imageBase64.includes('base64,')) {
        cleanBase64 = imageBase64.split('base64,')[1];
      }
      
      // System prompt for GPT-4o Vision
      const systemPrompt = `You are an expert sports journalist and graphic designer specializing in player analysis.  
Your task is to scan the uploaded athlete image and describe the player's visual appearance accurately.  
Focus only on the following fields:

- Hair style (e.g., buzzcut, medium, long, bald)
- Hair color (e.g., black, blonde, purple, etc.)
- Facial hair (e.g., none, goatee, beard, mustache)
- Shirt status (e.g., wearing shirt, shirtless)
- Shorts color (e.g., red, black, white)
- Tattoos (describe their location and type, e.g., right arm dragon tattoo, left chest star tattoo)

Respond ONLY in the following JSON format:

{
  "hairStyle": "...",
  "hairColor": "...",
  "facialHair": "...",
  "shirtStatus": "...",
  "shortsColor": "...",
  "tattoos": "..."
}`;

      // Call GPT-4o Vision API
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.2, // Low temperature for accuracy
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${cleanBase64}`
                }
              },
              {
                type: "text",
                text: "Analyze this athlete image and extract the visual traits as specified."
              }
            ]
          }
        ],
        max_tokens: 1000,
      });
      
      // Extract the response content
      const content = response.choices[0].message.content;
      console.log('[Vision Service] GPT-4o Vision response:', content);
      
      if (!content) {
        throw new ApiError('Failed to analyze image: No content in response', 500);
      }
      
      try {
        // Parse the JSON response
        // First, find the JSON object in the response (in case there's additional text)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON object found in response');
        }
        
        const jsonStr = jsonMatch[0];
        const traits = JSON.parse(jsonStr) as CharacterTraits;
        
        // Validate the parsed traits
        const requiredFields = ['hairStyle', 'hairColor', 'facialHair', 'shirtStatus', 'shortsColor', 'tattoos'];
        for (const field of requiredFields) {
          if (!traits[field as keyof CharacterTraits]) {
            traits[field as keyof CharacterTraits] = 'unknown';
          }
        }
        
        console.log('[Vision Service] Successfully extracted character traits:', traits);
        return traits;
      } catch (parseError: any) {
        console.error('[Vision Service] Error parsing JSON response:', parseError);
        throw new ApiError(`Failed to parse character traits: ${parseError.message}`, 500);
      }
    } catch (error: any) {
      console.error('[Vision Service] Error analyzing image:', error);
      
      // Extract OpenAI API error details if available
      let errorMessage = 'Unknown error';
      let statusCode = 500;
      
      if (error.response) {
        console.error('[Vision Service] API Error Response:', JSON.stringify(error.response.data, null, 2));
        errorMessage = error.response.data?.error?.message || error.message || 'API Error';
        statusCode = error.response.status || 500;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(`Failed to analyze image: ${errorMessage}`, statusCode);
    }
  }
};

export default visionService;
