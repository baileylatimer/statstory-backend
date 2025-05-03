import OpenAI from 'openai';
import fs from 'fs-extra';
import tmp from 'tmp';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { ApiError } from '../middleware/error';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validate API key on startup
if (!process.env.OPENAI_API_KEY) {
  console.error('[OpenAI Service] ERROR: Missing OPENAI_API_KEY environment variable');
}

/**
 * Save a base64 image to a temporary file
 * @param base64Data - Base64 encoded image data
 * @returns Object with the file path and MIME type
 */
async function saveBase64ToTempFile(base64Data: string): Promise<{ imageFilePath: string; mimeType: string }> {
  // Extract the MIME type and actual base64 data
  let mimeType = 'image/png'; // Default MIME type
  let cleanBase64 = base64Data;

  try {
    // Check if the data includes a data URL prefix
    if (base64Data.includes('base64,')) {
      const parts = base64Data.split('base64,');
      
      // Extract the MIME type from the data URL if available
      if (parts[0].includes('image/')) {
        // Clean up the MIME type - remove any trailing characters like semicolons
        mimeType = parts[0].trim()
          .replace('data:', '')
          .replace(';base64', '')
          .replace(';', ''); // Remove any trailing semicolons
      }
      
      cleanBase64 = parts[1];
    }

    console.log(`[OpenAI Service] Detected MIME type: ${mimeType}`);
    
    // Get appropriate file extension based on MIME type
    let extension = '.png'; // Default extension
    
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      extension = '.jpg';
    } else if (mimeType === 'image/webp') {
      extension = '.webp';
    }
    
    // Create a temporary file with the appropriate extension
    const tmpObj = tmp.fileSync({ postfix: extension, keep: true });
    const imageFilePath = tmpObj.name;

    // Write the base64 data to the file
    await fs.writeFile(imageFilePath, Buffer.from(cleanBase64, 'base64'));
    
    // Verify the file was created successfully
    const stats = await fs.stat(imageFilePath);
    console.log(`[OpenAI Service] Temp file created successfully: ${imageFilePath} (${Math.round(stats.size / 1024)} KB)`);
    
    return { imageFilePath, mimeType };
  } catch (error: any) {
    console.error('[OpenAI Service] Error saving base64 to file:', error);
    throw new Error(`Failed to save image: ${error.message}`);
  }
}

/**
 * Service for interacting with OpenAI API
 */
export const openaiService = {
  /**
   * Generate an image using GPT Image model
   * 
   * @param description - Main description for the image
   * @param mediaStyle - Media style to apply (e.g., "Bleacher Report")
   * @param vibe - Visual vibe to apply (e.g., "Gritty")
   * @param title - Optional title to include in the image/prompt
   * @param imageBase64 - Optional base64-encoded image to use as reference
   * @returns The generated image as base64 string
   */
  generateImage: async (
    description: string,
    mediaStyle: string,
    vibe: string,
    title?: string,
    imageBase64?: string,
    characterTraits?: any
  ): Promise<string> => {
    // Temporary files to clean up
    const tempFiles: string[] = [];
    
    try {
      console.log(`[OpenAI Service] Generating image with: ${mediaStyle} style, ${vibe} vibe`);
      
      // Construct the prompt
      const prompt = constructPrompt(description, mediaStyle, vibe, title, characterTraits);
      console.log(`[OpenAI Service] Constructed prompt: ${prompt.substring(0, 100)}...`);
      
      let response;
      
      // If image is provided, use the edit endpoint
      if (imageBase64) {
        console.log('[OpenAI Service] Reference image provided, using edit endpoint...');
        
        try {
          // Create a temporary file for the image
          const { imageFilePath, mimeType } = await saveBase64ToTempFile(imageBase64);
          tempFiles.push(imageFilePath);
          
          console.log(`[OpenAI Service] Image saved to temporary file: ${imageFilePath}`);
          console.log(`[OpenAI Service] Image MIME type: ${mimeType}`);
          
          // Make sure the file exists
          if (!await fs.pathExists(imageFilePath)) {
            throw new Error(`Temporary image file does not exist: ${imageFilePath}`);
          }
          
          // Create a form data object for the multipart/form-data request
          const form = new FormData();
          form.append('model', 'gpt-image-1');
          form.append('prompt', prompt);
          form.append('n', '1');
          form.append('size', '1024x1536'); // Portrait mode for better sports graphics
          form.append('quality', 'medium');
          
          // Append the image file with the correct MIME type
          // Important: Let FormData handle the content-type automatically
          form.append('image', fs.createReadStream(imageFilePath), {
            filename: path.basename(imageFilePath),
            contentType: mimeType
          });
          
          console.log('[OpenAI Service] Calling OpenAI edit endpoint with reference image...');
          
          // Make the API request
          const apiResponse = await axios.post(
            'https://api.openai.com/v1/images/edits',
            form,
            {
              headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                ...form.getHeaders() // Let FormData set the correct boundaries
              },
              maxContentLength: Infinity,
              maxBodyLength: Infinity,
              timeout: 180000 // 3 minutes timeout
            }
          );
          
          response = apiResponse.data;
          console.log('[OpenAI Service] OpenAI edit API call successful');
        } catch (err: any) {
          console.error('[OpenAI Service] Error in image edit:', err);
          
          // Extract error details from axios error
          let errorMessage = 'Unknown error';
          let statusCode = 500;
          
          if (err.response) {
            console.error('[OpenAI Service] API Error Response:', JSON.stringify(err.response.data, null, 2));
            errorMessage = err.response.data?.error?.message || err.message;
            statusCode = err.response.status || 500;
            
            // Log detailed error information
            console.error(`[OpenAI Service] Status: ${statusCode}, Message: ${errorMessage}`);
          } else if (err.message) {
            errorMessage = err.message;
            console.error(`[OpenAI Service] Error message: ${errorMessage}`);
          }
          
          // If edit fails with 400 or 404, fall back to generation without image
          if (statusCode === 400 || statusCode === 404) {
            console.log('[OpenAI Service] Edit endpoint failed, falling back to generation endpoint...');
            
            response = await openai.images.generate({
              model: "gpt-image-1",
              prompt: `${prompt}\n\nNote: I've uploaded a reference image of the player/athlete. Please match their appearance, uniform, and style closely.`,
              n: 1,
              size: "1024x1536", // Portrait mode for better sports graphics
              quality: "medium",
            });
          } else {
            // For other errors, propagate the error
            throw new ApiError(`Image edit failed: ${errorMessage}`, statusCode);
          }
        }
      } else {
        // Otherwise, use the generate endpoint
        console.log('[OpenAI Service] No reference image, using generation endpoint');
        
        response = await openai.images.generate({
          model: "gpt-image-1",
          prompt: prompt,
          n: 1,
          size: "1024x1536", // Portrait mode for better sports graphics
          quality: "medium",
        });
      }
      
      // Log some information about the response
      console.log('[OpenAI Service] Response received, checking for image data...');
      console.log('[OpenAI Service] Response structure:', typeof response, Object.keys(response || {}));
      
      // Extract the image data from the response
      let generatedImageBase64;
      
      // Check for b64_json field in the data array
      if (response?.data?.[0]?.b64_json) {
        generatedImageBase64 = response.data[0].b64_json;
        console.log('[OpenAI Service] Image data found in b64_json field');
      } 
      // Check for url field in the data array
      else if (response?.data?.[0]?.url) {
        console.log('[OpenAI Service] Image URL found, downloading image...', response.data[0].url);
        try {
          // Download the image using axios
          const imageResponse = await axios.get(response.data[0].url, { 
            responseType: 'arraybuffer' 
          });
          
          // Convert to base64
          generatedImageBase64 = Buffer.from(imageResponse.data).toString('base64');
          console.log('[OpenAI Service] Image downloaded and converted to base64');
        } catch (err: any) {
          console.error('[OpenAI Service] Error downloading image:', err);
          throw new ApiError('Failed to download generated image', 500);
        }
      } 
      // No image data found
      else {
        console.error('[OpenAI Service] No image data in response:', JSON.stringify(response, null, 2));
        throw new ApiError('Failed to generate image: No image data in response', 500);
      }
      
      console.log('[OpenAI Service] Image generation successful');
      return generatedImageBase64;
      
    } catch (error: any) {
      // Log the full error details
      console.error('[OpenAI Service] Error generating image:', error);
      
      // Extract OpenAI API error details if available
      let errorMessage = 'Unknown error';
      let statusCode = 500;
      
      if (error.response) {
        console.error('[OpenAI Service] API Error Response:', JSON.stringify(error.response.data, null, 2));
        errorMessage = error.response.data?.error?.message || error.message || 'API Error';
        statusCode = error.response.status || 500;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(`Failed to generate image: ${errorMessage}`, statusCode);
    } finally {
      // Clean up temporary files
      for (const filePath of tempFiles) {
        try {
          await fs.remove(filePath);
          console.log(`[OpenAI Service] Cleaned up temporary file: ${filePath}`);
        } catch (err: any) {
          console.error(`[OpenAI Service] Error cleaning up file ${filePath}:`, err);
        }
      }
    }
  }
};

/**
 * Construct the prompt for image generation
 */
function constructPrompt(
  description: string,
  mediaStyle: string,
  vibe: string,
  title?: string,
  characterTraits?: any
): string {
  // Base prompt
  let prompt = `Create a photorealistic ${mediaStyle} style sports graphic.`;
  
  // Add vibe-specific styling
  switch(vibe.toLowerCase()) {
    case 'nostalgic':
      prompt += `
Style the graphic like a vintage 1970s-1980s sports magazine cover.
Use warm tones, film grain, retro color grading, and vintage serif fonts.
Add slight blurring and authentic film scratches for realism.`;
      break;
    case 'hype':
      prompt += `
Style the graphic like a modern social media sports poster.
Use bright, vivid colors, neon accents, and bold modern fonts.
Incorporate geometric textures, sharp speed lines, and energetic background patterns.`;
      break;
    case 'gritty':
      prompt += `
Style the graphic like a gritty sports editorial poster.
Use dark muted colors, heavy bold distressed typography.
Add physical elements like page tears, cracks, dust particles, and dramatic stadium lighting.`;
      break;
    case 'clean':
      prompt += `
Style the graphic like a professional studio sports photo shoot.
Use neutral colors, soft lighting, and minimalist sans-serif fonts.
Focus on clean composition and natural backgrounds.`;
      break;
    default:
      // Default styling if vibe doesn't match any specific case
      prompt += ` with a ${vibe.toLowerCase()} aesthetic.`;
  }
  
  // Add the athlete description
  prompt += `\nShow the athlete ${description}.`;
  
  // Add character traits if available
  if (characterTraits) {
    prompt += `
The athlete has ${characterTraits.hairColor ? 'a ' + characterTraits.hairColor : 'an'} ${characterTraits.hairStyle} hairstyle${characterTraits.facialHair && characterTraits.facialHair !== 'none' ? ' with ' + characterTraits.facialHair : ''}.
They are ${characterTraits.shirtStatus}${characterTraits.shortsColor ? ' and wearing ' + characterTraits.shortsColor + ' shorts' : ''}.`;

    // Add tattoo details if any
    if (characterTraits.tattoos && characterTraits.tattoos !== 'none' && characterTraits.tattoos !== 'unknown') {
      prompt += `\n${characterTraits.tattoos}.`;
    }
  }
  
  // Add reference image matching instructions
  prompt += `
Match the player's face, hairstyle, and uniform exactly as shown in the reference image.
Maintain realistic posture and proportions.`;
  
  // Add logo placement based on media style
  if (mediaStyle === 'ESPN' || mediaStyle === 'Sports Illustrated') {
    prompt += `\nAdd a large ${mediaStyle} logo centered at the top of the graphic.`;
  } else {
    prompt += `\nAdd the ${mediaStyle} logo in the top right corner.`;
  }
  
  // Add title if provided
  if (title) {
    prompt += `\nInclude the player's name "${title}" in large bold text styled like ${mediaStyle}'s typical typography.`;
  }
  
  return prompt;
}

export default openaiService;
