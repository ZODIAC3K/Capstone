import { NextResponse } from 'next/server'
import axios from 'axios'

const STABILITY_API_KEY = process.env.STABILITY_API_KEY
const STABLE_DIFFUSION_API_URL = 'https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image'

interface TextPrompt {
    text: string
    weight: number
}

interface RequestBody {
    prompt: string
}

interface StabilityAIResponse {
    artifacts: Array<{
        base64: string
    }>
}

export async function POST(request: Request) {
    try {
        const body: RequestBody = await request.json()
        const { prompt } = body

        if (!prompt) {
            return NextResponse.json({ message: 'Prompt is required' }, { status: 400 })
        }

        const response = await axios<StabilityAIResponse>({
            method: 'post',
            url: STABLE_DIFFUSION_API_URL,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${STABILITY_API_KEY}`,
                Accept: 'application/json'
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
                steps: 30
            }
        })

        const image = response.data.artifacts[0].base64

        return NextResponse.json({ photo: image }, { status: 200 })
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json(
            {
                message: 'Image generation failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
