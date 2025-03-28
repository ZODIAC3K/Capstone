import React from 'react'

import CustomButton from './CustomButton'

// const AIPicker = ({ prompt, setPrompt, generatingImg, handleSubmit }) => {
//   return (
//     <div className="aipicker-container">

//       <textarea
//         placeholder="Ask AI..."
//         rows={5}
//         value={prompt}
//         onChange={(e) => setPrompt(e.target.value)}
//         className="aipicker-textarea"
//       />

//       <div className="flex flex-wrap gap-3">
//         {generatingImg ? (
//           // like loading button
//           <CustomButton
//             type="outline"
//             title="Asking AI..."
//             customStyles="text-xs"
//           />
//         ) : (
//           <>
//             <CustomButton
//               type="outline"
//               title="AI Logo"
//               handleClick={() => handleSubmit('logo')}
//               customStyles="text-xs"
//             />

//             <CustomButton
//               type="filled"
//               title="AI Full"
//               handleClick={() => handleSubmit('full')}
//               customStyles="text-xs"
//             />
//           </>
//         )}
//       </div>
//     </div>
//   )
// }

const AIPicker = ({ prompt, setPrompt, generatingImg, handleSubmit }) => {
    const handleGenerate = async (type) => {
        if (!prompt) return alert('Please enter a prompt')

        console.log('Generating image with prompt:', prompt)
        await handleSubmit(type)
    }

    return (
        <div className='aipicker-container'>
            <textarea
                placeholder='Ask AI...'
                rows={5}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className='aipicker-textarea'
            />
            <div className='flex flex-wrap gap-3'>
                {generatingImg ? (
                    <CustomButton type='outline' title='Asking AI...' customStyles='text-xs' />
                ) : (
                    <>
                        <CustomButton
                            type='outline'
                            title='AI Logo'
                            handleClick={() => handleGenerate('logo')}
                            customStyles='text-xs'
                        />

                        <CustomButton
                            type='filled'
                            title='AI Full'
                            handleClick={() => handleGenerate('full')}
                            customStyles='text-xs'
                        />
                    </>
                )}
            </div>
        </div>
    )
}

export default AIPicker
