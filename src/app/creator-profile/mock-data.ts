// Mock creator data for development and testing

export const mockCreatorData = {
    _id: '67e3cb97df5da47eba6c2de9',
    userId: {
        _id: '67e3573daada1f3977ec0b3f',
        email: 'creator@example.com',
        fname: 'John',
        lname: 'Doe',
        mobile: '1234567890',
        email_verification: true
    },
    name: 'Harsh Deepanshu',
    bio: 'Rocker Man',
    quote: 'Suparman Ka Fan',
    creatorProfilePicture: {
        _id: '67e6895a049b5dac979657a4',
        user_id: '67e3573daada1f3977ec0b3f',
        content_type: 'image/jpeg'
        // No actual data here as it would be too large
    },
    creatorCoverImage: {
        _id: '67e6895a049b5dac979657a6',
        user_id: '67e3573daada1f3977ec0b3f',
        content_type: 'image/jpeg'
        // No actual data here as it would be too large
    },
    products: [
        {
            _id: '67e3cb9adf5da47eba6c2dfa',
            title: '3D Model 1',
            description: 'Amazing 3D model description',
            price: {
                amount: 999,
                currency: 'INR'
            },
            sales_count: 10,
            image_id: {
                _id: '67e6895a049b5dac979657a8',
                user_id: '67e3573daada1f3977ec0b3f',
                content_type: 'image/jpeg'
                // No actual data here as it would be too large
            }
        },
        {
            _id: '67e68caa22dd976165b661ae',
            title: '3D Model 2',
            description: 'Another amazing 3D model description',
            price: {
                amount: 1299,
                currency: 'INR'
            },
            sales_count: 5,
            image_id: {
                _id: '67e6895a049b5dac979657a9',
                user_id: '67e3573daada1f3977ec0b3f',
                content_type: 'image/jpeg'
                // No actual data here as it would be too large
            }
        }
    ],
    totalSales: 2997,
    royaltyPercentage: 30,
    createdAt: '2025-03-26T09:40:39.568Z',
    updatedAt: '2025-03-29T12:04:20.698Z'
}
