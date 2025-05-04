import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/error';
import openaiService from '../services/openai.service';
import visionService, { CharacterTraits } from '../services/vision.service';

/**
 * Images controller
 */
export const imagesController = {
  /**
   * Generate an image
   * 
   * @route POST /api/images/generate
   */
  generateImage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Enhanced logging for TestFlight debugging
      console.log(`[Images Controller] Received generate image request from ${req.headers['user-agent'] || 'unknown client'}`);
      console.log(`[Images Controller] Request headers:`, JSON.stringify(req.headers, null, 2));
      
      const { title, description, mediaStyle, vibe, imageBase64, characterTraits } = req.body;
      
      if (!description) {
        console.error('[Images Controller] Error: No description provided in request');
        throw new ApiError('Description is required', 400);
      }
      
      if (!mediaStyle) {
        console.error('[Images Controller] Error: No media style provided in request');
        throw new ApiError('Media style is required', 400);
      }
      
      if (!vibe) {
        console.error('[Images Controller] Error: No vibe provided in request');
        throw new ApiError('Vibe is required', 400);
      }
      
      console.log(`[Images Controller] Received request to generate image with ${mediaStyle} style, ${vibe} vibe`);
      console.log(`[Images Controller] Description: ${description.substring(0, 50)}...`);
      console.log(`[Images Controller] Title provided: ${!!title ? title : 'No'}`);
      console.log(`[Images Controller] Image data provided: ${!!imageBase64}`);
      
      if (imageBase64) {
        console.log(`[Images Controller] Base64 image data length: ${imageBase64.length} characters`);
      }
      
      // Character traits may be provided from the analyze endpoint
      if (characterTraits) {
        console.log(`[Images Controller] Character traits provided:`, characterTraits);
      }
      
      console.log(`[Images Controller] Calling OpenAI service to generate image...`);
      const startTime = Date.now();
      
      // Generate the image
      const imageBase64Result = await openaiService.generateImage(
        description,
        mediaStyle,
        vibe,
        title,
        imageBase64,
        characterTraits
      );
      
      const duration = Date.now() - startTime;
      console.log(`[Images Controller] Image generated successfully in ${duration}ms`);
      
      // Return the generated image
      res.status(200).json({
        success: true,
        data: {
          imageBase64: imageBase64Result
        }
      });
    } catch (error) {
      console.error(`[Images Controller] Error generating image:`, error);
      next(error);
    }
  },
  
  /**
   * Analyze an image to extract character traits
   * 
   * @route POST /api/images/analyze
   */
  analyzeImage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Enhanced logging for TestFlight debugging
      console.log(`[Images Controller] Received analyze image request from ${req.headers['user-agent'] || 'unknown client'}`);
      console.log(`[Images Controller] Request headers:`, JSON.stringify(req.headers, null, 2));
      
      const { imageBase64 } = req.body;
      
      if (!imageBase64) {
        console.error('[Images Controller] Error: No image data provided in request');
        throw new ApiError('Image data is required', 400);
      }
      
      console.log(`[Images Controller] Received request to analyze image`);
      console.log(`[Images Controller] Base64 image data length: ${imageBase64.length} characters`);
      console.log(`[Images Controller] Image data format check: ${imageBase64.substring(0, 30)}...`);
      
      console.log(`[Images Controller] Calling Vision service to analyze image...`);
      const startTime = Date.now();
      
      // Analyze the image
      const characterTraits = await visionService.analyzeImage(imageBase64);
      
      const duration = Date.now() - startTime;
      console.log(`[Images Controller] Image analyzed successfully in ${duration}ms`);
      
      // Return the character traits
      res.status(200).json({
        success: true,
        data: characterTraits
      });
    } catch (error) {
      console.error(`[Images Controller] Error analyzing image:`, error);
      next(error);
    }
  }
};

export default imagesController;
