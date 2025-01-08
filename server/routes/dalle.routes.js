
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