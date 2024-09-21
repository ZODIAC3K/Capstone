# Backend-For-Clothing-Store


## Must Run First
```
    git config --global core.autocrlf true
```
- Converts line endings to the native format of the operating system on checkout.
- Converts them back to the standard format on commit.
- Useful for cross-platform collaboration to maintain consistent line endings.
```
    git config --global core.autocrlf input
```
- Converts line endings to LF (Unix format) on checkout.
- Leaves line endings unchanged on commit.
- Useful when working locally with LF line endings but preserving the original line endings in the repository.

## Run Server
Use the prewritten scripts **'start'** or **'dev'** to run the server.

For Production ( uses Node )
```
    npm run start
```
For Devlopment ( uses Nodemon )
```
    npm run dev
```

## API Authentication

Requests need to be authenticated such that any third party cannot request resources on our server.

- ### <code>x-api-key</code> Header
    Added an API key system where every request should contain a token encrypted using the API key which will be decrypted to check if it's valid or not
        
        {
            Headers: {
                ...

                x-api-key: // API Key....
            
                ...
            }
        }

    ### Error
        {
            status: 401,
            message: "Unauthorized"
        }

- ### <code>Authorization</code> Header
    For requests from logged in user the frontend will pass the jwt into this header such that the server can verify and give access to the user.

        {
            Headers: {
                ...
                Authorization: // JWT returned by the server stored in 'auth-token' cookie
                ...
            }
        }

- ### Email Verification
    After JWT verification if the user proceeds to order this middleware will check if the email of the user is verified or not, if not it will redirect it will send the following response

    #### Status Code 300

        {
            message: "Email ID not verified",
            redirectTo: "/email-verification"
        }
        

## Routes

- ### Register
    - **Path** <code>/api/v1/auth/reg</code>
    - **Body:**
        ```
            {
                email: "USERNAME",
                password: "PASSWORD",
                fname: // First Name , 
                lname: // Last Name,
                mobile: // 10 digit mobile number
            }
        ```

    - **Authentication:**
        Now we check if user is present in our database, if yes we return an error. Else we enter the usernae and password in the database.
    - **Success:**
        - #### Status Code 200
                {
                    message: "Successfully Registered!",
                    redirectTo: "/"
                }
    - **Error:**
        ```
            {
                status: 409,
                message: "Already Exists: User already exists!"
            }
        ```

- ### Login
    - **Path:** <code>/api/v1/auth/login</code>
    - **Body:**
        ```
            {
                email: "USERNAME",
                password: "PASSWORD"
            }
        ```

    - **Authentication:**
        Now we check if user is present in our database, if yes we set and cookie <code>auth-token</code> as jwt token (uid as payload, default expiry - 2h). Else throw an error.
    
    - **Success:**
        - #### Status Code 200
                {
                    message: "Logged in sucessfully!",
                    redirectTo: "/"
                }

    - **Error:**
        ```
            {
                status: 403,
                message: "Forbidden: User not found!"
            }
        ```
        ```
            {
                status: 401,
                message: "Email or password is wrong"
            }
        ```

- ### Logout

    Logout will be handled in the frontend by simply deleting the <code>auth-token</code> cookie.

- ### Email Verification

- ### Forgot Password

- ### Admin

- ### Products



## Controllers

- ### Image Controller
    Made two controllers to handle image uploads: <code>insertImage</code> and <code>insertMultipleImages</code>. These are to be used inside routes where image uploading is needed. It reads the uploaded image and uploads it to the database while returning the id to reference it in the required places.

    Make sure to use **ERROR HANDLING** when using this controller as it **directly throws error** without passing it to the next middleware.

    **NOTE:** Size checking has not been added yet

## Get Analysis Data

Endpoint to fetch various analytics data related to products, orders, and returns.

- ### Endpoint

    `GET /api/v1/analysis/`

- ### Response Data

    The response data is a JSON object containing the following key-value pairs:

    - `totalProducts` (Number): The total number of products.

    - `highestSoldProducts` (Array): An array of products with their total sold quantities.

    - `highestRatedProduct` (Object): The product with the highest average rating.

    - `mostSoldCategory` (Object): The category with the most products sold.

    - `mostSoldBrand` (Object): The brand with the most products sold.

    - `totalOrders` (Number): The total number of orders.

    - `ordersPending` (Array): An array of orders with "Pending" status.

    - `ordersAccepted` (Array): An array of orders with "Accepted" status.

    - `ordersRejected` (Array): An array of orders with "Rejected" status.

    - `totalReturnedOrders` (Number): The total number of returned orders.

    - `totalAmountGainedOnOrders` (Number): The total amount gained on orders.

    - `totalAmountSpentOnReturns` (Number): The total amount spent on returns.

- ### Example

    ```json
    {
    "totalProducts": 1000,
    "highestSoldProducts": [
        {
        "product_id": "123",
        "totalSold": 500
        },
        // Other products...
    ],
    "highestRatedProduct": {
        "product_id": "456",
        "avgRating": 4.7
    },
    "mostSoldCategory": {
        "category_id": "789",
        "totalSold": 300
    },
    "mostSoldBrand": {
        "brand_id": "abc",
        "totalSold": 150
    },
    "totalOrders": 500,
    "ordersPending": [
        {
        "order_id": "111",
        "status": "Pending"
        },
        // Other "Pending" orders...
    ],
    "ordersAccepted": [
        {
        "order_id": "222",
        "status": "Accepted"
        },
        // Other "Accepted" orders...
    ],
    "ordersRejected": [
        {
        "order_id": "333",
        "status": "Rejected"
        },
        // Other "Rejected" orders...
    ],
    "totalReturnedOrders": 50,
    "totalAmountGainedOnOrders": 10000.0,
    "totalAmountSpentOnReturns": 500.0
    }
    ```
    
# Get Analysis Data by Time Filter

Endpoint to fetch analysis data based on a specific time filter (day, week, month, or year).

## Endpoint

`GET /api/v1/admin/analytics/:filter`

### Parameters

- `filter` (string): The time filter for data retrieval (e.g., "day", "week", "month", or "year").

### Response Data

The response data is an array of (x, y) coordinate objects representing the number of orders or relevant metric counts at various timestamps within the specified time filter.

- `x` (number): Timestamp in milliseconds.
- `y` (number): The corresponding metric count (e.g., number of orders).

### Example

```json
[
  { "x": 1668175200000, "y": 10 }, // Example timestamp (x) and metric count (y)
  { "x": 1668186000000, "y": 15 },
  { "x": 1668196800000, "y": 18 },
  // ... more data points for the specified time filter
]
```

### Date Parsing Function

To parse the incoming timestamp and format it as a human-readable date, you can use the following JavaScript function:

```javascript
function formatTimestampToHumanReadable(timestamp) {
  const formattedDate = new Date(timestamp).toLocaleString(); // Customize the format as needed
  return formattedDate;
}
```
You can call this function to format the ‘x’ values (timestamps) in the response data to human-readable dates if needed.

This documentation provides information about the API endpoint, the input parameter, the structure of the response data, and a function to parse incoming timestamps into human-readable dates. It can be shared with the frontend team for reference.