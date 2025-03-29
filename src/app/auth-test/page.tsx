'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AuthTestPage() {
    const [authStatus, setAuthStatus] = useState<string>('Checking...')
    const [cookies, setCookies] = useState<string[]>([])

    useEffect(() => {
        // Get all cookies
        const allCookies = document.cookie.split(';').map((cookie) => cookie.trim())
        setCookies(allCookies)

        // Check authentication
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/me', {
                    method: 'GET',
                    credentials: 'include'
                })

                if (response.ok) {
                    const data = await response.json()
                    setAuthStatus(`Authenticated: ${JSON.stringify(data)}`)
                } else {
                    setAuthStatus(`Not authenticated: ${response.status}`)
                }
            } catch (error) {
                setAuthStatus(`Error checking auth: ${error}`)
            }
        }

        checkAuth()
    }, [])

    return (
        <div className='p-8'>
            <h1 className='text-2xl font-bold mb-4'>Authentication Test</h1>

            <div className='mb-6'>
                <h2 className='text-xl font-semibold mb-2'>Authentication Status:</h2>
                <pre className='bg-gray-100 p-4 rounded'>{authStatus}</pre>
            </div>

            <div className='mb-6'>
                <h2 className='text-xl font-semibold mb-2'>Cookies:</h2>
                {cookies.length > 0 ? (
                    <ul className='bg-gray-100 p-4 rounded'>
                        {cookies.map((cookie, index) => (
                            <li key={index}>{cookie}</li>
                        ))}
                    </ul>
                ) : (
                    <p>No cookies found</p>
                )}
            </div>

            <div className='mb-6'>
                <h2 className='text-xl font-semibold mb-2'>Test API Endpoints:</h2>
                <div className='space-y-2'>
                    <button
                        className='bg-blue-500 text-white px-4 py-2 rounded mr-4'
                        onClick={async () => {
                            try {
                                const response = await fetch('/api/creator', {
                                    method: 'GET',
                                    credentials: 'include'
                                })
                                const data = await response.json()
                                alert(`Status: ${response.status}\nData: ${JSON.stringify(data)}`)
                            } catch (error) {
                                alert(`Error: ${error}`)
                            }
                        }}
                    >
                        Test Creator API
                    </button>

                    <Link href='/creator-profile' className='bg-green-500 text-white px-4 py-2 rounded'>
                        Go to Creator Profile
                    </Link>
                </div>
            </div>
        </div>
    )
}
