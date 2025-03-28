'use client'
import { useState } from 'react'
import Canvas from './canvas'
import Customizer from './pages/Customizer'

function App() {
    const [cloth, setCloth] = useState('shirt')
    return (
        <main className='app '>
            <Canvas cloth={cloth} />
            <Customizer />
        </main>
    )
}

export default App
