'use client'

import { useState } from 'react'
import { Header } from '../../components/header'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image from 'next/image'

export default function CartPage() {
    const [cartItems, setCartItems] = useState([
        { id: 1, name: 'Custom T-Shirt', price: 450.0, quantity: 2, image: '/tshirt.png', inStock: true },
        { id: 2, name: 'Custom Shirt', price: 750.0, quantity: 1, image: '/shirt.png', inStock: true }
    ])

    const updateQuantity = (id, quantity) => {
        setCartItems(cartItems.map((item) => (item.id === id ? { ...item, quantity } : item)))
    }

    const removeItem = (id) => {
        setCartItems(cartItems.filter((item) => item.id !== id))
    }

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

    const handleCheckout = () => {
        // Add your checkout logic here
    }

    return (
        <div className='min-h-screen bg-background text-foreground'>
            <Header />
            <main className='container mx-auto px-4 py-8'>
                <h1 className='text-3xl font-bold mb-8'>SHOPPING CART</h1>
                <div className='bg-card text-card-foreground rounded-lg shadow-md p-6'>
                    {cartItems.map((item) => (
                        <div key={item.id} className='flex items-center justify-between border-b py-4'>
                            <div className='flex items-center space-x-4'>
                                <Image src={item.image} alt={item.name} width={100} height={100} className='rounded' />
                                <div>
                                    <h3 className='font-semibold'>{item.name}</h3>
                                    <p className='text-gray-400'>₹{item.price.toFixed(2)}</p>
                                    <p className={item.inStock ? 'text-green-600' : 'text-red-600'}>
                                        {item.inStock ? 'In stock' : 'Out of stock'}
                                    </p>
                                </div>
                            </div>
                            <div className='flex items-center space-x-4'>
                                <Select
                                    value={item.quantity.toString()}
                                    onValueChange={(value) => updateQuantity(item.id, parseInt(value))}
                                >
                                    <SelectTrigger className='w-20'>
                                        <SelectValue placeholder='Qty' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4, 5].map((num) => (
                                            <SelectItem key={num} value={num.toString()}>
                                                {num}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button variant='ghost' onClick={() => removeItem(item.id)}>
                                    Remove
                                </Button>
                            </div>
                        </div>
                    ))}
                    <div className='mt-6'>
                        <h3 className='text-xl font-semibold mb-4'>Order Summary</h3>
                        <div className='grid grid-cols-3 gap-4'>
                            <span className='font-bold'>PRICE</span>
                            <span className='font-bold'>QUANTITY</span>
                            <span className='font-bold'>SUBTOTAL</span>
                            {cartItems.map((item) => (
                                <>
                                    <span>₹{item.price.toFixed(2)}</span>
                                    <span>{item.quantity}</span>
                                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                                </>
                            ))}
                        </div>
                        <div className='mt-4 font-bold text-lg'>Total: ₹{total.toFixed(2)}</div>
                        <Button className='w-full mt-4' size='lg' onClick={handleCheckout}>
                            Proceed to Checkout
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    )
}
