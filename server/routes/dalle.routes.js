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

// // Route to handle image creation based on user input
// router.route('/').post(async (req, res) => {
//   try {
//     const { prompt } = req.body;

//     // Use openai.createImage method with prompt
//     const response = await openai.createImage({
//       prompt,
//       n: 1, // Number of images to generate
//       size: '1024x1024',
//       response_format: 'b64_json',
//     });

//     const image = response.data[0].b64_json; // Adjusted for correct access path

//     res.status(200).json({ photo: image });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Something went wrong" });
//   }
// });

// export default router;























import express from 'express';
import * as dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();

const router = express.Router();

// Initialize OpenAI with the API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.route('/').get((req, res) => {
  res.status(200).json({ message: "Hello from DALL.E ROUTES" });
});

// Route to handle image creation based on user input
router.route('/').post(async (req, res) => {
  try {
    const { prompt } = req.body;

    // Make an API call to generate an image
    const response = await openai.images.generate({
      prompt, // Text prompt for the image
      n: 1, // Number of images to generate
      size: '1024x1024', // Image resolution
      response_format: 'b64_json', // Base64-encoded JSON format
    });

    // Extract the image data
    const image = response.data[0].b64_json;

    // Send the generated image back to the client
    res.status(200).json({ photo: image });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Something went wrong with the image generation." });
  }
});

export default router;
