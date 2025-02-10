const http = require("http");
const app = require("./app");
const connectDB = require("./connection"); // Import the database connection function

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB(); // Connect to MongoDB before starting the server

    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`🚀 App is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
};

startServer();