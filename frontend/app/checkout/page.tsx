import { Button } from './Button'

function App() {
    return (
        <div className='min-h-screen bg-background text-foreground'>
            <div className='bg-card text-card-foreground rounded-lg shadow-md p-6'>
                {/* Form content here */}
                <form>
                    {/* Input fields here */}
                    <Button type='submit' className='w-full bg-primary text-primary-foreground hover:bg-primary/90'>
                        Place Order
                    </Button>
                </form>
            </div>
        </div>
    )
}

export default App
