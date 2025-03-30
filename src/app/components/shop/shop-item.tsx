import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { IProduct } from '@/types/product-type'

interface ShopItemProps {
    item: {
        id: string
        img: string
        title: string
        price: number
        currency?: string
        creator?: string
        category?: string
    }
    onClick?: () => void
}

const ShopItem = ({ item, onClick }: ShopItemProps) => {
    const { id, img, title, price, currency = 'USD', creator, category } = item

    return (
        <div className='shop__item' onClick={onClick} style={{ cursor: 'pointer' }}>
            <div className='shop__item-thumb'>
                <Link href={`/product-details/${id}`}>
                    <Image
                        src={img}
                        alt={title}
                        width={400}
                        height={450}
                        style={{ width: '100%', height: 'auto', maxHeight: '18rem', objectFit: 'cover' }}
                    />
                </Link>
                <Link href='#' className='wishlist-button'>
                    <i className='far fa-heart'></i>
                </Link>
            </div>
            <div className='shop__item-line'></div>
            <div className='shop__item-content'>
                <div className='shop__item-content-top'>
                    <h4 className='title'>
                        <Link href={`/product-details/${id}`}>{title}</Link>
                    </h4>
                    <div className='shop__item-price'>
                        {currency} {price}
                    </div>
                </div>
                <div className='shop__item-cat'>
                    <Link href='/shop'>{category}</Link>
                </div>
                <div className='shop__item-creator'>
                    <p>
                        by <a href='#'>{creator}</a>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ShopItem
