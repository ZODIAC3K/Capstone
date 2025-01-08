'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
    setIsLoggedIn(loggedIn)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    setIsLoggedIn(false)
    router.push('/')
  }

  return (
    <header className="bg-background text-foreground shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-foreground">Custom T-shirt</Link>
        <nav>
          <ul className="flex space-x-4 items-center">
            <li><Link href="/" className="text-foreground hover:text-primary">Home</Link></li>
            <li><Link href="/customize" className="text-foreground hover:text-primary">Customize</Link></li>
            <li><Link href="/cart" className="text-foreground hover:text-primary"><ShoppingCart /></Link></li>
            {isLoggedIn ? (
              <>
                <li><Link href="/dashboard" className="text-foreground hover:text-primary"><User /></Link></li>
                <li><Button onClick={handleLogout} variant="outline" className="text-foreground hover:text-primary">Logout</Button></li>
              </>
            ) : (
              <li><Link href="/login" className="text-foreground hover:text-primary">Login</Link></li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  )
}

