'use client'

import { useEffect, useState } from 'react'

export default function CreatorAPITestPage() {
    const [testResult, setTestResult] = useState<string>('Not tested yet')
    const [isLoading, setIsLoading] = useState(false)

    const testCreatorAPI = async () => {
        setIsLoading(true)
        setTestResult('Testing...')
        
        try {
            console.log('Testing creator API...')
            const response = await fetch('/api/creator', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            
            console.log('Response status:', response.status)
            
            const contentType = response.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json()
                console.log('Response data:', data)
                setTestResult(`Status: ${response.status}\nData: ${JSON.stringify(data, null, 2)}`)
            } else {
                const text = await response.text()
                console.log('Response text:', text)
                setTestResult(`Status: ${response.status}\nText: ${text}`)
            }
        } catch (error) {
            console.error('Error testing API:', error)
            setTestResult(`Error: ${error instanceof Error ? error.message : String(error)}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Creator API Test</h1>
            
            <button 
                className="bg-blue-500 text-white px-4 py-2 rounded mb-6 disabled:opacity-50"
                onClick={testCreatorAPI}
                disabled={isLoading}
            >
                {isLoading ? 'Testing...' : 'Test Creator API'}
            </button>
            
            <div>
                <h2 className="text-xl font-semibold mb-2">Test Result:</h2>
                <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">{testResult}</pre>
            </div>
            
            <div className="mt-6">
                <p className="mb-2"><strong>Note:</strong> This test directly calls the creator API endpoint. If it doesn't work, check:</p>
                <ul className="list-disc list-inside ml-4">
                    <li>If you are logged in</li>
                    <li>If you have the proper cookies set</li>
                    <li>If the API route exists and is working properly</li>
                </ul>
            </div>
        </div>
    )
} 