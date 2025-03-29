import { proxy } from 'valtio'

const state = proxy({
    intro: false, // flag variable to check whether we r on home page or not
    color: '#EFBD48', //default color
    isLogoTexture: true, //to check r we curretnly displaying logo on t-shirt
    isFullTexture: false,
    logoDecal: '/threejs.png', //initial logo
    fullDecal: '/threejs.png', //initial full texture shirt decal
    modelType: 'shirt' // Set default model type to shirt
})

export default state
