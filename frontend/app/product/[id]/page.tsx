'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '../../../components/header'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface Product {
  id: number
  name: string
  price: number
  image: string
  description: string
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then(res => res.json())
      .then(data => setProduct(data))
  }, [params.id])

  if (!product) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className=" rounded-lg shadow-md p-6 text-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Image src={product.image} alt={product.name} width={400} height={400} className="rounded-lg" />
            <div>
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
              <p className="text-xl mb-4">${product.price.toFixed(2)}</p>
              <p className="mb-6">{product.description}</p>
              <div className="flex space-x-4">
                <Button onClick={() => router.push(`/customize?product=${product.id}`)}>Customize</Button>
                <Button variant="outline">Add to Cart</Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

