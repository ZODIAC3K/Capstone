import React, { useState } from 'react'
import Image from 'next/image'
import logo from '@/assets/img/logo/logo.png'
import social_data from '@/data/social-data'
import MobileMenus from './mobile-menus'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// prop type
type IProps = {
    openMobileOffCanvas: boolean
    setOpenMobileOffCanvas: React.Dispatch<React.SetStateAction<boolean>>
}

const MobileOffCanvas = ({ openMobileOffCanvas, setOpenMobileOffCanvas }: IProps) => {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')

    // handle close search
    const handleCloseOffCanvas = (audioPath: string) => {
        setOpenMobileOffCanvas(false)
        const audio = new Audio(audioPath)
        audio.play()
    }

    // handle search submit
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            // Close the mobile menu
            setOpenMobileOffCanvas(false)
            // Redirect to shop page with search query
            router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
        }
    }

    return (
        <div className={openMobileOffCanvas ? 'mobile-menu-visible' : ''}>
            <div className='tgmobile__menu'>
                <nav className='tgmobile__menu-box'>
                    <div className='close-btn' onClick={() => handleCloseOffCanvas('/assets/audio/remove.wav')}>
                        <i className='flaticon-swords-in-cross-arrangement'></i>
                    </div>
                    <div className='nav-logo'>
                        <Link href='/'>
                            <Image src={logo} alt='Logo' style={{ height: 'auto' }} />
                        </Link>
                    </div>
                    <div className='tgmobile__search'>
                        <form onSubmit={handleSearchSubmit}>
                            <input
                                type='text'
                                placeholder='Search for products...'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button type='submit'>
                                <i className='flaticon-loupe'></i>
                            </button>
                        </form>
                    </div>
                    <div className='tgmobile__menu-outer'>
                        <MobileMenus />
                    </div>
                    <div className='social-links'>
                        <ul className='list-wrap'>
                            {social_data.map((s, i) => (
                                <li key={i}>
                                    <Link href={s.link} target='_blank'>
                                        <i className={s.icon}></i>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>
            </div>
            <div className='tgmobile__menu-backdrop' onClick={() => setOpenMobileOffCanvas(false)} />
        </div>
    )
}

export default MobileOffCanvas
