import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Game server is running' });
  });

  // Endpoint to fetch game state - will be used later
  app.get('/api/game/state', (req, res) => {
    res.json({ 
      ready: false,
      message: 'Game implementation coming soon' 
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
