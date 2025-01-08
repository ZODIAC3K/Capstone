// import express from 'express';
// import * as dotenv from 'dotenv';
// import { OpenAI } from 'openai';

// dotenv.config();

// const router = express.Router();

// // Initialize OpenAI with the API key
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// router.route('/').get((req, res) => {
//   res.status(200).json({ message: "Hello from DALL.E ROUTES" });
// });

// // // Route to handle image creation based on user input
// // router.route('/').post(async (req, res) => {
// //   try {
// //     const { prompt } = req.body;

// //     // Make an API call to generate an image
// //     const response = await openai.images.generate({
// //       prompt, // Text prompt for the image
// //       n: 1, // Number of images to generate
// //       size: '1024x1024', // Image resolution
// //       response_format: 'b64_json', // Base64-encoded JSON format
// //     });

// //     // Extract the image data
// //     const image = response.data[0].b64_json;

// //     // Send the generated image back to the client
// //     res.status(200).json({ photo: image });
// //   } catch (error) {
// //     console.error(error.message);
// //     res.status(500).json({ message: "Something went wrong with the image generation." });
// //   }
// // });

// router.route('/').post(async (req, res) => {
//   try {
//     const { prompt } = req.body;
    
//     console.log('Attempting to generate image with prompt:', prompt);
//     console.log('Using API key:', process.env.OPENAI_API_KEY.substring(0, 8) + '...');

//     const response = await openai.images.generate({
//       prompt,
//       n: 1,
//       size: '1024x1024',
//       response_format: 'b64_json',
//     });

//     // ... rest of the code ...

//   } catch (error) {
//     console.error('Detailed error:', {
//       message: error.message,
//       status: error.status,
//       response: error.response?.data,
//     });
    
//     res.status(500).json({ 
//       message: "Something went wrong with the image generation.",
//       error: error.message,
//       details: error.response?.data 
//     });
//   }
// });

// export default router;




////////////// google gemini api worked but showing red square in image generation

// import express from 'express';
// import * as dotenv from 'dotenv';
// import axios from 'axios';

// dotenv.config();

// const router = express.Router();

// // Using a different Gemini endpoint that's more suitable for image tasks
// const GOOGLE_AI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro-vision-latest:generateContent';

// router.route('/').post(async (req, res) => {
//   try {
//     const { prompt } = req.body;

//     if (!prompt) {
//       return res.status(400).json({ message: "Prompt is required" });
//     }

//     // For testing, return a placeholder image
//     // This ensures your frontend gets the expected response format
//     const placeholderImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    
//     res.status(200).json({ 
//       photo: placeholderImage  // This matches what your frontend expects
//     });

//   } catch (error) {
//     console.error('API Error:', error);
//     res.status(500).json({ 
//       message: "Image generation failed",
//       error: error.response?.data || error.message
//     });
//   }
// });

// export default router;














///////////////////////// stability api worked
import express from 'express';
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const router = express.Router();

// Using Stable Diffusion API endpoint
const STABLE_DIFFUSION_API_URL = 'https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image';

router.route('/').post(async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    const response = await axios({
      method: 'post',
      url: STABLE_DIFFUSION_API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
        'Accept': 'application/json'
      },
      data: {
        text_prompts: [
          {
            text: prompt,
            weight: 1
          }
        ],
        cfg_scale: 7,
        height: 512,
        width: 512,
        samples: 1,
        steps: 30,
      }
    });

    // Extract the base64 image from the response
    const image = response.data.artifacts[0].base64;
    
    res.status(200).json({ 
      photo: image 
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      message: "Image generation failed",
      error: error.response?.data || error.message
    });
  }
});

export default router;