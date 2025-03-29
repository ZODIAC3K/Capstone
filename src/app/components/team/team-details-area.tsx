import React from 'react'
import Image from 'next/image'

interface TeamDetailsProps {
    bio?: string
    quote?: string
    creator?: string
    contentClassName?: string
    quoteClassName?: string
    citeClassName?: string
}

const TeamDetailsArea = ({
    bio,
    quote,
    creator,
    contentClassName,
    quoteClassName,
    citeClassName
}: TeamDetailsProps) => {
    const sectionStyle = {
        backgroundColor: '#0c0c0c',
        paddingTop: '100px',
        paddingBottom: '100px'
    }

    return (
        <section className='team__details-area section-pt-120 section-pb-120' style={sectionStyle}>
            <div className='container'>
                <div className='row'>
                    <div className='col-12'>
                        <div
                            className={`team__details-content ${contentClassName || ''}`}
                            style={{
                                backgroundColor: '#121212',
                                borderRadius: '16px',
                                padding: '4rem',
                                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                                border: '1px solid rgba(34, 197, 94, 0.1)'
                            }}
                        >
                            <h2
                                className='title'
                                style={{
                                    color: '#22c55e',
                                    fontSize: '5rem',
                                    fontWeight: '900',
                                    marginBottom: '3rem',
                                    letterSpacing: '0.05em',
                                    textShadow: '0 0 20px rgba(34, 197, 94, 0.3)',
                                    textTransform: 'uppercase',
                                    fontFamily: '"Inter", "Montserrat", sans-serif'
                                }}
                            >
                                About
                            </h2>
                            <p
                                style={{
                                    color: '#e2e8f0',
                                    fontSize: '1.35rem',
                                    marginBottom: '4rem',
                                    lineHeight: '1.8',
                                    maxWidth: '900px',
                                    fontWeight: '400',
                                    letterSpacing: '0.02em',
                                    fontFamily: '"Inter", system-ui, sans-serif'
                                }}
                            >
                                {bio || 'I am a rockstar.'}
                            </p>
                            {quote && (
                                <div
                                    className={`team__details-quote ${quoteClassName || ''}`}
                                    style={{
                                        position: 'relative',
                                        padding: '2.5rem 3rem 2.5rem 4rem',
                                        borderLeft: '4px solid #22c55e',
                                        margin: '3rem 0',
                                        backgroundColor: 'rgba(34, 197, 94, 0.07)',
                                        borderRadius: '0 12px 12px 0',
                                        boxShadow: '0 5px 20px rgba(0, 0, 0, 0.15)'
                                    }}
                                >
                                    <div
                                        style={{
                                            position: 'absolute',
                                            left: '1rem',
                                            top: '0.5rem',
                                            fontSize: '6rem',
                                            color: '#22c55e',
                                            opacity: '0.8',
                                            fontFamily: '"Georgia", serif',
                                            lineHeight: '1',
                                            textShadow: '0 0 15px rgba(34, 197, 94, 0.4)'
                                        }}
                                    >
                                        "
                                    </div>
                                    <p
                                        style={{
                                            fontSize: '1.5rem',
                                            fontStyle: 'italic',
                                            color: '#e2e8f0',
                                            position: 'relative',
                                            zIndex: '1',
                                            lineHeight: '1.8',
                                            marginBottom: '2.5rem',
                                            letterSpacing: '0.02em',
                                            fontFamily: '"Georgia", serif',
                                            fontWeight: '300'
                                        }}
                                    >
                                        {quote}
                                    </p>
                                    <cite
                                        className={citeClassName || ''}
                                        style={{
                                            display: 'block',
                                            marginTop: '2rem',
                                            fontWeight: '600',
                                            color: '#22c55e',
                                            fontSize: '1.25rem',
                                            letterSpacing: '0.08em',
                                            textTransform: 'uppercase',
                                            fontFamily: '"Inter", sans-serif'
                                        }}
                                    >
                                        — {creator || 'DXACE'}
                                    </cite>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default TeamDetailsArea
