'use client'

import React from 'react'
import Link from 'next/link'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'secondary'
    size?: 'sm' | 'md' | 'lg'
    asChild?: boolean
    children: React.ReactNode
}

export function Button({
    variant = 'primary',
    size = 'md',
    asChild = false,
    className = '',
    children,
    ...props
}: ButtonProps) {
    // Base styles
    let buttonClasses =
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'

    // Size styles
    switch (size) {
        case 'sm':
            buttonClasses += ' h-9 px-3 text-sm'
            break
        case 'lg':
            buttonClasses += ' h-12 px-6 text-lg'
            break
        default: // 'md'
            buttonClasses += ' h-10 px-4 text-base'
            break
    }

    // Variant styles
    switch (variant) {
        case 'outline':
            buttonClasses += ' border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100'
            break
        case 'secondary':
            buttonClasses += ' bg-gray-200 text-gray-900 hover:bg-gray-300'
            break
        default: // 'primary'
            buttonClasses += ' bg-blue-600 text-white hover:bg-blue-700'
            break
    }

    // Add custom classes
    buttonClasses += ' ' + className

    // Handle as child pattern
    if (asChild) {
        return React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
                if (child.type === Link) {
                    return React.cloneElement(child, {
                        ...child.props,
                        className: `${buttonClasses} ${child.props.className || ''}`
                    })
                }
            }
            return child
        })
    }

    return (
        <button className={buttonClasses} {...props}>
            {children}
        </button>
    )
}
