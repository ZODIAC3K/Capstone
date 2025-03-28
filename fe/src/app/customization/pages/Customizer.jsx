import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSnapshot } from 'valtio'

import config from '../config/config'
import state from '../store'
import { downloadCanvasToImage, reader } from '../config/helpers'
import { EditorTabs, FilterTabs, DecalTypes } from '../config/constants'
import { fadeAnimation, slideAnimation } from '../config/motion'
import { AIPicker, ColorPicker, CustomButton, FilePicker, Tab } from '../components'

const Customizer = () => {
    const snap = useSnapshot(state)

    const [file, setFile] = useState('')
    const [prompt, setPrompt] = useState('')
    const [generatingImg, setGeneratingImg] = useState(false)
    const [activeEditorTab, setActiveEditorTab] = useState('')
    const [activeFilterTab, setActiveFilterTab] = useState({
        logoShirt: true,
        stylishShirt: false
    })

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.editortabs-container')) {
                setActiveEditorTab('')
            }
        }

        document.addEventListener('click', handleClickOutside)
        return () => {
            document.removeEventListener('click', handleClickOutside)
        }
    }, [])

    const generateTabContent = () => {
        switch (activeEditorTab) {
            case 'colorpicker':
                return <ColorPicker />
            case 'filepicker':
                return <FilePicker file={file} setFile={setFile} readFile={readFile} />
            case 'aipicker':
                return (
                    <AIPicker
                        prompt={prompt}
                        setPrompt={setPrompt}
                        generatingImg={generatingImg}
                        handleSubmit={handleSubmit}
                    />
                )
            default:
                return null
        }
    }

    const handleSubmit = async (type) => {
        if (!prompt) return alert('Please enter a prompt')

        try {
            setGeneratingImg(true)

            const response = await fetch('/api/genAI', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: `${prompt}, high quality, detailed, clean background, vector style, logo design`
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to generate image')
            }

            const data = await response.json()

            if (!data.photo) {
                throw new Error('No image data received')
            }

            handleDecals(type, `data:image/png;base64,${data.photo}`)
        } catch (error) {
            alert(error.message)
        } finally {
            setGeneratingImg(false)
            setActiveEditorTab('')
        }
    }

    const handleDecals = (type, result) => {
        const decalType = DecalTypes[type]
        console.log('Applying decal:', { type, stateProperty: decalType.stateProperty })

        state[decalType.stateProperty] = result

        if (!activeFilterTab[decalType.filterTab]) {
            handleActiveFilterTab(decalType.filterTab)
        }
    }

    const handleActiveFilterTab = (tabName) => {
        switch (tabName) {
            case 'logoShirt':
                state.isLogoTexture = !activeFilterTab[tabName]
                break
            case 'stylishShirt':
                state.isFullTexture = !activeFilterTab[tabName]
                break
            default:
                state.isLogoTexture = true
                state.isFullTexture = false
                break
        }

        setActiveFilterTab((prevState) => ({
            ...prevState,
            [tabName]: !prevState[tabName]
        }))
    }

    const readFile = (type) => {
        reader(file).then((result) => {
            handleDecals(type, result)
            setActiveEditorTab('')
        })
    }

    return (
        <AnimatePresence>
            {!snap.intro && (
                <>
                    {/* Editor Tabs */}
                    <motion.div
                        key='custom'
                        className='position-absolute top-0 start-0 z-3 '
                        {...slideAnimation('left')}
                        {...slideAnimation('left')}
                    >
                        <div className='d-flex align-items-center min-vh-100'>
                            <div className='editortabs-container border rounded p-3 bg-light shadow'>
                                {EditorTabs.map((tab) => (
                                    <Tab
                                        key={tab.name}
                                        tab={tab}
                                        handleClick={() =>
                                            setActiveEditorTab((prev) => (prev === tab.name ? '' : tab.name))
                                        }
                                    />
                                ))}
                                {generateTabContent()}
                            </div>
                        </div>
                    </motion.div>

                    {/* Download Button */}
                    <motion.div className='download-btn ' {...fadeAnimation}>
                        <button className='btn btn-primary' style={{ width: 'fit' }} onClick={downloadCanvasToImage}>
                            <img
                                src={'/assets/download.png'}
                                alt='download_image'
                                className='w-50 h-50 object-fit-contain'
                            />
                        </button>
                    </motion.div>

                    {/* Filter Tabs */}
                    <motion.div
                        className='position-absolute bottom-0 start-50 translate-middle-x p-2 bg-light rounded shadow d-flex gap-2'
                        {...slideAnimation('up')}
                    >
                        {FilterTabs.map((tab) => (
                            <Tab
                                key={tab.name}
                                tab={tab}
                                isFilterTab
                                isActiveTab={activeFilterTab[tab.name]}
                                handleClick={() => handleActiveFilterTab(tab.name)}
                            />
                        ))}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

export default Customizer
