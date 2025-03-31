import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

// prop type
type IProps = {
    isSearchOpen: boolean
    setIsSearchOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const SearchPopup = ({ isSearchOpen, setIsSearchOpen }: IProps) => {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')

    // handle close search
    const handleCloseSearch = (audioPath: string) => {
        setIsSearchOpen(false)
        const audio = new Audio(audioPath)
        audio.play()
    }

    // handle search submit
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            // Close the search popup
            setIsSearchOpen(false)
            // Redirect to shop page with search query
            router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
        }
    }

    return (
        <div className={`${isSearchOpen ? 'search__active' : ''}`}>
            <div className={`search__popup-wrap`}>
                <div className='search__layer'></div>
                <div className='search__close' onClick={() => handleCloseSearch('/assets/audio/remove.wav')}>
                    <span>
                        <i className='flaticon-swords-in-cross-arrangement'></i>
                    </span>
                </div>
                <div className='search__wrap text-center'>
                    <div className='container'>
                        <div className='row'>
                            <div className='col-12'>
                                <h2 className='title'>
                                    ... <span>Search Products</span> ...
                                </h2>
                                <div className='search__form'>
                                    <form onSubmit={handleSearchSubmit}>
                                        <input
                                            type='text'
                                            name='search'
                                            placeholder='Search for products...'
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            required
                                        />
                                        <button type='submit' className='search-btn'>
                                            <i className='flaticon-loupe'></i>
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SearchPopup
