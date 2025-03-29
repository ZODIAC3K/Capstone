/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'capstone-modal-bucket.s3.ap-southeast-1.amazonaws.com',
                port: '',
                pathname: '/**'
            }
        ]
    }
}

module.exports = nextConfig
