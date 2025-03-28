import React from 'react'
import CustomButton from './CustomButton'

const AIPicker = ({ prompt, setPrompt, generatingImg, handleSubmit }) => {
    const handleGenerate = async (type) => {
        if (!prompt) return alert('Please enter a prompt')

        console.log('Generating image with prompt:', prompt)
        await handleSubmit(type)
    }

    return (
        <div className='container p-3 border rounded bg-light'>
            <textarea
                placeholder='Ask AI...'
                rows={5}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className='form-control mb-3'
            />
            <div className='d-flex flex-wrap gap-2'>
                {generatingImg ? (
                    <CustomButton type='outline' title='Asking AI...' customStyles='btn btn-outline-secondary btn-sm' />
                ) : (
                    <>
                        <CustomButton
                            type='outline'
                            title='AI Logo'
                            handleClick={() => handleGenerate('logo')}
                            customStyles='btn btn-outline-primary btn-sm'
                        />
                        <CustomButton
                            type='filled'
                            title='AI Full'
                            handleClick={() => handleGenerate('full')}
                            customStyles='btn btn-primary btn-sm'
                        />
                    </>
                )}
            </div>
        </div>
    )
}

export default AIPicker
