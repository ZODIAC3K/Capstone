'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '../../components/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image from 'next/image'
import dynamic from 'next/dynamic'
const TShirt3D = dynamic(() => import('../../components/TShirt3D'), {
    ssr: false,
    loading: () => <div className='h-[400px] flex items-center justify-center'>Loading 3D view...</div>
})

interface Product {
    id: number
    name: string
    price: number
    image: string
}

export default function CustomizePage() {
    const searchParams = useSearchParams()
    const [activeView, setActiveView] = useState('front')
    const [customText, setCustomText] = useState('')
    const [selectedColor, setSelectedColor] = useState('white')
    const [selectedSize, setSelectedSize] = useState('M')
    const [product, setProduct] = useState<Product | null>(null)

    const colors = ['white', 'black', 'red', 'blue', 'green']
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

    useEffect(() => {
        const productId = searchParams.get('design')
        if (productId) {
            fetch(`/api/products/${productId}`)
                .then((res) => res.json())
                .then((data) => setProduct(data))
        }
    }, [searchParams])

    return (
        <div className='min-h-screen bg-background text-foreground'>
            <Header />
            <main className='container mx-auto px-4 py-8'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                    <div>
                        <Tabs value={activeView} onValueChange={setActiveView}>
                            <TabsList>
                                <TabsTrigger value='front'>Front</TabsTrigger>
                                <TabsTrigger value='back'>Back</TabsTrigger>
                                <TabsTrigger value='side'>Side</TabsTrigger>
                                <TabsTrigger value='3d'>3D View</TabsTrigger>
                            </TabsList>
                            <TabsContent value='front'>
                                <Image
                                    src={product ? product.image : `/product1/front.webp`}
                                    alt='T-shirt front'
                                    width={300}
                                    height={400}
                                    className={`w-full bg-${selectedColor}`}
                                />
                            </TabsContent>
                            <TabsContent value='back'>
                                <Image
                                    src='/product1/back.webp'
                                    alt='T-shirt back'
                                    width={300}
                                    height={400}
                                    className={`w-full bg-${selectedColor}`}
                                />
                            </TabsContent>
                            <TabsContent value='side'>
                                <Image
                                    src='/product1/side.webp'
                                    alt='T-shirt side'
                                    width={300}
                                    height={400}
                                    className={`w-full bg-${selectedColor}`}
                                />
                            </TabsContent>
                            <TabsContent value='3d'>
                                <div style={{ height: '400px' }}>
                                    <TShirt3D color={selectedColor} />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                    <div>
                        <h2 className='text-2xl font-semibold mb-4'>Customize Your T-Shirt</h2>
                        <div className='space-y-4'>
                            <div>
                                <Label htmlFor='custom-text'>Add Custom Text</Label>
                                <Input
                                    id='custom-text'
                                    value={customText}
                                    onChange={(e) => setCustomText(e.target.value)}
                                    placeholder='Enter your text here'
                                />
                            </div>
                            <div>
                                <Label>Select Color</Label>
                                <div className='flex space-x-2 mt-2'>
                                    {colors.map((color) => (
                                        <button
                                            key={color}
                                            className={`w-8 h-8 rounded-full ${color === 'white' ? 'border border-gray-300' : ''}`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => setSelectedColor(color)}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Label htmlFor='size'>Select Size</Label>
                                <Select value={selectedSize} onValueChange={setSelectedSize}>
                                    <SelectTrigger id='size'>
                                        <SelectValue placeholder='Select size' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sizes.map((size) => (
                                            <SelectItem key={size} value={size}>
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button>Upload Image</Button>
                            <div className='mt-8'>
                                <h3 className='text-xl font-semibold mb-2'>Product Details</h3>
                                <p>Price: ${product ? product.price.toFixed(2) : '24.99'}</p>
                                <p>Rating: ★★★★☆</p>
                                <p>Estimated Delivery: 5-7 business days</p>
                            </div>
                            <div className='flex space-x-4'>
                                <Button>Add to Cart</Button>
                                <Button variant='outline'>Save Design</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
