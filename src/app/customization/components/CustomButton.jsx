import React from 'react'
import { useSnapshot } from 'valtio'

import state from '../store'
import { getContrastingColor } from '../config/helpers'

const CustomButton = ({ type, title, customStyles, handleClick }) => {
    const snap = useSnapshot(state)

    const generateStyle = (type) => {
        if (type === 'filled') {
            return {
                backgroundColor: snap.color, //retriving color from valtio defalut state
                color: getContrastingColor(snap.color) //for our go back button to be always visible
            }
        } else if (type === 'outline') {
            return {
                borderWidth: '1px',
                borderColor: snap.color,
                color: snap.color
            }
        }
    }

    return (
        <button
            className={`px-2 py-1.5 flex-1 rounded-md ${customStyles}`}
            style={generateStyle(type)}
            onClick={handleClick}
        >
            {title}
        </button>
    )
}

export default CustomButton
