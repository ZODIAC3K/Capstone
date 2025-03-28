import { NextResponse } from 'next/server'

const products = [
    {
        id: 1,
        name: 'Cool Cat T-Shirt',
        price: 24.99,
        image: '/tshirt.png',
        description: 'Show off your cool side with this awesome cat design!'
    },
    {
        id: 2,
        name: 'Funky Monkey T-Shirt',
        price: 24.99,
        image: '/product1/front.webp',
        description: 'Get groovy with our funky monkey t-shirt!'
    },
    {
        id: 3,
        name: 'Space Odyssey T-Shirt',
        price: 24.99,
        image: '/tshirt.png',
        description: 'Embark on a space adventure with this cosmic design!'
    },
    {
        id: 4,
        name: 'Retro Vibes T-Shirt',
        price: 24.99,
        image: '/tshirt.png',
        description: 'Travel back in time with our retro-inspired t-shirt!'
    }
]

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const product = products.find((p) => p.id === parseInt(params.id))
    if (product) {
        return NextResponse.json(product)
    } else {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
}
