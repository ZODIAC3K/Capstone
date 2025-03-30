import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { IProduct } from '@/types/product-type'
import styles from './shop-item.module.css'

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
        <div className={styles.shopItem} onClick={onClick} style={{ cursor: 'pointer' }}>
            <div className={styles.shopItemThumb}>
                <Link href={`/product-details/${id}`}>
                    <Image
                        src={img}
                        alt={title}
                        width={400}
                        height={450}
                        style={{ width: '100%', height: 'auto', maxHeight: '18rem' }}
                    />
                </Link>
                <Link href='#' className={styles.wishlistButton}>
                    <i className='far fa-heart'></i>
                </Link>
            </div>
            <div className={styles.shopItemLine}></div>
            <div className={styles.shopItemContent}>
                <div className={styles.contentTop}>
                    <h4 className={styles.title}>
                        <Link href={`/product-details/${id}`}>{title}</Link>
                    </h4>
                    <div className={styles.price}>
                        {currency} {price}
                    </div>
                </div>
                <div className={styles.category}>
                    <Link href='/shop'>{category}</Link>
                </div>
                <div className={styles.creator}>
                    <p>
                        <span>by</span> <a href='#'>{creator}</a>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ShopItem
