# Electronic Shop - Backend

Backend server for the Electronic Shop application.

## Technologies

- Node.js
- Express.js
- MongoDB
- JWT Authentication

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Endpoints

The API documentation is available once the server is running.

## Project Structure

```
server/
├── src/
│   ├── config/       # Configuration files
│   ├── controllers/  # Route controllers
│   ├── middleware/   # Custom middleware
│   ├── models/       # Database models
│   ├── routes/       # API routes
│   └── utils/        # Utility functions
├── uploads/          # Uploaded files
└── package.json
```

## License

ISC
