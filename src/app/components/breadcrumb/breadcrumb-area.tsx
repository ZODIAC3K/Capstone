import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import SvgIconCom from '../common/svg-icon-anim'

// props type
interface IProps {
    title: string
    subtitle: string
    bg?: any
    brd_img?: any
    customButton?: {
        text: string
        link?: string
        onClick?: () => void
    }
    imageClassName?: string
}

const BreadcrumbArea = ({ bg, brd_img, title, subtitle, customButton, imageClassName }: IProps) => {
    // Default background fallback
    const bgStyle = bg ? { backgroundImage: `url(${bg.src})` } : { backgroundColor: '#0d0d0d' }

    return (
        <section className='breadcrumb-area' style={bgStyle}>
            <div className='container'>
                <div className='breadcrumb__wrapper'>
                    <div className='row'>
                        <div className='col-xl-6 col-lg-7'>
                            <div className='breadcrumb__content'>
                                <h2 className='title'>{title}</h2>
                                <nav aria-label='breadcrumb'>
                                    <ul className='breadcrumb'>
                                        {/* <li className="breadcrumb-item">
											<Link href="/">Home</Link>
										</li> */}
                                        <li className='breadcrumb-item active' aria-current='page'>
                                            {subtitle}
                                        </li>
                                    </ul>
                                </nav>
                                {customButton && (
                                    <div className='about__content-btns mx-auto my-4'>
                                        {customButton.link ? (
                                            <Link href={customButton.link} className='tg-btn-3 tg-svg'>
                                                <SvgIconCom icon='/assets/img/icons/shape.svg' id='svg-6' />
                                                <span>{customButton.text}</span>
                                            </Link>
                                        ) : customButton.onClick ? (
                                            <button onClick={customButton.onClick} className='tg-btn-3 tg-svg'>
                                                <SvgIconCom icon='/assets/img/icons/shape.svg' id='svg-6' />
                                                <span>{customButton.text}</span>
                                            </button>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className='col-xl-6 col-lg-5 position-relative d-none d-lg-block'>
                            {brd_img && (
                                <div className='breadcrumb__img'>
                                    <Image
                                        src={brd_img}
                                        alt='img'
                                        style={{ height: 'auto', width: 'auto' }}
                                        width={500}
                                        height={500}
                                        className={imageClassName}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default BreadcrumbArea
