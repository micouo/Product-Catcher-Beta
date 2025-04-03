import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Endpoint for future game settings or configuration
  app.get('/api/game/config', (req, res) => {
    res.status(200).json({
      title: 'Game Portal',
      version: '0.1.0',
      status: 'in-development'
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
