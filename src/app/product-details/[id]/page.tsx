import { Metadata } from 'next'
import Wrapper from '@/layout/wrapper'
import Header from '@/layout/header/header'
import Footer from '@/layout/footer/footer'
import ShopDetailsArea from '../../components/shop-details/shop-details-area'

export const metadata: Metadata = {
    title: 'Product Details'
}

type IParams = { id: string }

async function getProduct(id: string) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/product?id=${id}`, {
            cache: 'no-store'
        })

        if (!res.ok) {
            throw new Error('Failed to fetch product')
        }

        const data = await res.json()

        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch product')
        }

        return data.data
    } catch (error) {
        console.error('Error fetching product:', error)
        return null
    }
}

export default async function ProductDetailsPage({ params }: { params: IParams }) {
    const product = await getProduct(params.id)

    return (
        <Wrapper>
            {/* header start */}
            <Header />
            {/* header end */}

            {/* main area start */}
            <main className='main--area' style={{ paddingTop: '80px' }}>
                {/* shop details area start */}
                {product ? (
                    <ShopDetailsArea product={product} />
                ) : (
                    <div className='container py-5 text-center'>
                        <h2>Product not found</h2>
                        <p>The product you're looking for doesn't exist or has been removed.</p>
                    </div>
                )}
                {/* shop details area end */}
            </main>
            {/* main area end */}

            {/* footer start */}
            <Footer />
            {/* footer end */}
        </Wrapper>
    )
}
