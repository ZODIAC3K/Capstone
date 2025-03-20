'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '../../components/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // In a real application, you would send a request to your backend here
        // For this example, we'll just simulate a successful login
        localStorage.setItem('isLoggedIn', 'true')
        router.push('/dashboard')
    }

    return (
        <div className='min-h-screen bg-gray  text-black'>
            <Header />
            <main className='container mx-auto px-4 py-8'>
                <div className='max-w-md mx-auto text-white border-2 border-white rounded-sm shadow-md p-6'>
                    <h1 className='text-5xl mb-6 text-center'>Login</h1>
                    <form onSubmit={handleSubmit} className='space-y-4 '>
                        <div className='mb-4'>
                            <Label htmlFor='email' className='block text-xl mb-2'>
                                Email
                            </Label>
                            <Input
                                id='email'
                                type='email'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className='w-full bg-gray-700 text-white border border-gray-600 px-4 py-2 rounded-lg focus:outline-none focus:border-[#60E8C8]'
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor='password' className='block text-xl mb-2'>
                                Password
                            </Label>
                            <Input
                                id='password'
                                type='password'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className='w-full bg-gray-700 text-white border border-gray-600 px-4 py-2 rounded-lg focus:outline-none focus:border-[#60E8C8]'
                                required
                            />
                        </div>
                        <Button
                            type='submit'
                            className='w-full bg-[#60E8C8] hover:bg-teal-400 text-black text-lg py-2 rounded-lg transition'
                        >
                            Login
                        </Button>
                    </form>
                    <div className='mt-6 text-center text-lg'>
                        <p className='text-gray-400'>
                            {' '}
                            Don't have an account?{' '}
                            <Link href='/signup' className='text-[#60E8C8] hover:underline'>
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}
