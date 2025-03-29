'use client'
import { StaticImageData } from 'next/image'
import React, { useRef, useEffect } from 'react'
import Vivus from 'vivus'

const SvgIconCom = ({ icon, id }: { icon: StaticImageData | string; id: string }) => {
    const svgRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const currentSvgRef = svgRef.current

        if (currentSvgRef) {
            const iconSrc = typeof icon === 'string' ? icon : icon.src

            const vivusInstance = new Vivus(currentSvgRef, {
                duration: 180,
                file: iconSrc
            })

            const handleMouseEnter = () => {
                vivusInstance.reset().play()
            }

            currentSvgRef.addEventListener('mouseenter', handleMouseEnter)

            return () => {
                currentSvgRef.removeEventListener('mouseenter', handleMouseEnter)
            }
        }
    }, [icon])
    return <div className='svg-icon' id={id} ref={svgRef} />
}

export default SvgIconCom
