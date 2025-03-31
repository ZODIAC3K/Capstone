// type
type IMenuDataType = {
    id: number
    title: string
    link: string
}

const menu_data: IMenuDataType[] = [
    {
        id: 1,
        title: 'Home',
        link: '/'
    },
    {
        id: 2,
        title: 'Shop',
        link: '/shop'
    },
    {
        id: 3,
        title: 'About Us',
        link: '/about'
    },
    {
        id: 4,
        title: 'Contact Us',
        link: '/contact'
    }
]

export default menu_data
