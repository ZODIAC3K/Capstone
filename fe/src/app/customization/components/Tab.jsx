// import React from 'react'
// import { useSnapshot } from 'valtio'

// import state from '../store';

// const Tab = ({ tab, isFilterTab, isActiveTab, handleClick }) => {
//   const snap = useSnapshot(state);

// //   give style whether it is active of not
//   const activeStyles = isFilterTab && isActiveTab
//     ? { backgroundColor: snap.color, opacity: 0.5 } //active tab
//     : { backgroundColor: "transparent", opacity: 1 } //non active tab

//   return (
//     <div
//       key={tab.name}
//       className={`tab-btn ${isFilterTab ? 'rounded-full glassmorphism' : 'rounded-4'}`}
//       onClick={handleClick}
//       style={activeStyles}
//     >
//       <img
//         src={tab.icon}
//         alt={tab.name}
//         className={`${isFilterTab ? 'w-2/3 h-2/3' : 'w-11/12 h-11/12 object-contain'}`}
//       />
//     </div>
//   )
// }

// export default Tab

import React from 'react'
import { useSnapshot } from 'valtio'

import state from '../store'
import { downloadCanvasToImage } from '../config/helpers' // Ensure this helper function exists

const Tab = ({ tab, isFilterTab, isActiveTab, handleClick }) => {
    const snap = useSnapshot(state)

    // Define styles for active or inactive tabs
    const activeStyles =
        isFilterTab && isActiveTab
            ? { backgroundColor: snap.color, opacity: 0.5 } // Active tab
            : { backgroundColor: 'transparent', opacity: 1 } // Non-active tab

    // Download button logic
    const handleDownload = () => {
        downloadCanvasToImage() // Downloads the canvas as an image
    }

    // Render different content for Download tab
    if (tab.name === 'download') {
        return (
            <div
                className='tab-btn rounded-4' // Add appropriate styles here
                onClick={handleDownload}
                style={{ backgroundColor: 'transparent', opacity: 1 }}
            >
                <img src={tab.icon} alt={tab.name} className='w-11/12 h-11/12 object-contain' />
            </div>
        )
    }

    return (
        <div
            key={tab.name}
            className={`tab-btn ${isFilterTab ? 'rounded-full glassmorphism' : 'rounded-4'}`}
            onClick={handleClick}
            style={activeStyles}
        >
            <img
                src={tab.icon}
                alt={tab.name}
                className={`${isFilterTab ? 'w-2/3 h-2/3' : 'w-11/12 h-11/12 object-contain'}`}
            />
        </div>
    )
}

export default Tab
