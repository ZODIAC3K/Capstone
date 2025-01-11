'use client'

import { useEffect, useState } from 'react'
import { Header } from '../components/header'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/components/Footer'

interface Product {
  id: number
  name: string
  price: number
  image: string
}

export default function Home() {
  const [topDesigns, setTopDesigns] = useState<Product[]>([])

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setTopDesigns(data))
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Create Your Custom T-Shirt</h1>
          <p className="text-xl mb-6">Design, customize, and order your unique apparel</p>
          <Link href="/customization">
            <Button size="lg"  >Launch Your Product</Button>
          </Link>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-6">Top Designs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topDesigns.map((design) => (
              <div key={design.id} className="bg-card text-card-foreground rounded-lg shadow-md overflow-hidden">
                <Image src={design.image} alt={design.name} width={200} height={200} className="w-full" />
                <div className="p-4">
                  <h3 className="font-semibold">{design.name}</h3>
                  <p className="text-gray-400 mb-2">${design.price.toFixed(2)}</p>
                  <div className="flex justify-between">
                    <Link href={`/customize?design=${design.id}`}>
                      <Button variant="outline">Customize</Button>
                    </Link>
                    <Link href={`/product/${design.id}`}>
                      <Button variant="ghost">View Details</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer/>
    </div>
  )
}

