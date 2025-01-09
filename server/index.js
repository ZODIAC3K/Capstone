// import express from 'express';
// import * as dotenv from 'dotenv';
// import cors from 'cors'; // Cross-origin requests
// import dalleRoutes from './routes/dalle.routes.js';

// dotenv.config();

// // Setting server
// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json({ limit: "50mb" })) // To specify the weight of the payload we are going to send
// app.use("/api/v1/dalle", dalleRoutes);

// app.get('/', (req, res) => {
//   res.status(200).json({ message: "Hello from DALL.E" });
// });

// app.listen(8080, () => console.log('Server has started on port 8080'));





import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import dalleRoutes from './routes/dalle.routes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.use("/api/v1/dalle", dalleRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ message: "Hello from Image Generator API" });
});

app.listen(8080, () => console.log('Server has started on port 8080'));



