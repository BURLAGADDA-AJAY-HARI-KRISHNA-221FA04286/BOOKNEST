import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { MongoStorage } from "./mongoStorage";
import { storage as memStorage, IStorage } from "./storage";

// Initialize MongoDB storage
const MONGO_URI = 'mongodb+srv://root:root@cluster0.zoyqk.mongodb.net/bookworld?retryWrites=true&w=majority&appName=Cluster0';
export let storage: IStorage;

try {
  // Use MongoDB storage
  storage = new MongoStorage(MONGO_URI);
  log("Using MongoDB storage", "server");

  // Create or update default admin account
  (async () => {
    try {
      const adminEmail = "admin@gmail.com";
      const existingAdmin = await storage.getUserByEmail(adminEmail);
      
      if (existingAdmin) {
        // Update existing admin password
        await storage.updateUser(existingAdmin.id, {
          password: "admin123" // Ensure password is correct
        });
        console.log("Admin account updated with correct password");
      } else {
        // Create new admin
        await storage.createUser({
          name: "Admin User",
          email: adminEmail,
          password: "admin123",
          isAdmin: true
        });
        console.log("Default admin account created");
      }
    } catch (err) {
      console.error("Error creating/updating admin:", err);
    }
  })();
} catch (error) {
  // Fallback to in-memory storage
  storage = memStorage;
  log("Failed to connect to MongoDB, using in-memory storage", "server");
  console.error("MongoDB connection error:", error);
  
  // Create or update default admin account in memory storage
  (async () => {
    try {
      const adminEmail = "admin@gmail.com";
      const existingAdmin = await storage.getUserByEmail(adminEmail);
      
      if (existingAdmin) {
        // Update existing admin password
        await storage.updateUser(existingAdmin.id, {
          password: "admin123" // Ensure password is correct
        });
        console.log("Admin account updated with correct password (in-memory)");
      } else {
        // Create new admin
        await storage.createUser({
          name: "Admin User",
          email: adminEmail,
          password: "admin123",
          isAdmin: true
        });
        console.log("Default admin account created (in-memory)");
      }
    } catch (err) {
      console.error("Error creating/updating admin:", err);
    }
  })();
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
