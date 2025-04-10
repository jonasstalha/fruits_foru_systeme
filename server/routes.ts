import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { generateBarcodeData } from "./barcode";
import { generateLotReport } from "./pdf";
import { z } from "zod";
import { 
  insertFarmSchema,
  insertLotSchema,
  insertLotActivitySchema,
  insertUserSchema,
  Farm
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // No authentication setup
  
  // Create a fake user for the system since we have no auth
  const fakeUser = {
    id: 1,
    username: "system",
    fullName: "System User",
    role: "admin",
    password: "",
    createdAt: new Date()
  };
  
  // Simple middleware that always passes through (no auth check)
  const requireAuth = (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    // Attach a fake user to the request to make APIs work
    (req as any).user = fakeUser;
    next();
  };

  // Farm routes
  app.get("/api/farms", requireAuth, async (req, res) => {
    const farms = await storage.getAllFarms();
    res.json(farms);
  });

  app.get("/api/farms/:id", requireAuth, async (req, res) => {
    const farmId = parseInt(req.params.id, 10);
    const farm = await storage.getFarm(farmId);
    
    if (!farm) {
      return res.status(404).json({ message: "Ferme non trouvée" });
    }
    
    res.json(farm);
  });

  app.post("/api/farms", requireAuth, async (req, res) => {
    try {
      const validatedData = insertFarmSchema.parse(req.body);
      
      // Check if farm code already exists
      const existingFarm = await storage.getFarmByCode(validatedData.code);
      if (existingFarm) {
        return res.status(400).json({ message: "Code de ferme déjà utilisé" });
      }
      
      const farm = await storage.createFarm(validatedData);
      res.status(201).json(farm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Erreur du serveur" });
    }
  });

  app.put("/api/farms/:id", requireAuth, async (req, res) => {
    try {
      const farmId = parseInt(req.params.id, 10);
      const validatedData = insertFarmSchema.partial().parse(req.body);
      
      const updatedFarm = await storage.updateFarm(farmId, validatedData);
      
      if (!updatedFarm) {
        return res.status(404).json({ message: "Ferme non trouvée" });
      }
      
      res.json(updatedFarm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Erreur du serveur" });
    }
  });

  // Lot routes
  app.get("/api/lots", requireAuth, async (req, res) => {
    // Query parameters for filtering
    const { farmId, status, startDate, endDate } = req.query;
    
    let lots = await storage.getAllLots();
    
    // Apply filters
    if (farmId && !isNaN(Number(farmId))) {
      lots = lots.filter(lot => lot.farmId === Number(farmId));
    }
    
    if (status && typeof status === 'string') {
      lots = lots.filter(lot => lot.currentStatus === status);
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        lots = lots.filter(lot => {
          const harvestDate = new Date(lot.harvestDate);
          return harvestDate >= start && harvestDate <= end;
        });
      }
    }
    
    // Sort by creation date, newest first
    lots.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    res.json(lots);
  });

  app.get("/api/lots/:id", requireAuth, async (req, res) => {
    const lotId = parseInt(req.params.id, 10);
    const lot = await storage.getLot(lotId);
    
    if (!lot) {
      return res.status(404).json({ message: "Lot non trouvé" });
    }
    
    res.json(lot);
  });

  app.get("/api/lots/number/:lotNumber", requireAuth, async (req, res) => {
    const lotNumber = req.params.lotNumber;
    const lot = await storage.getLotByNumber(lotNumber);
    
    if (!lot) {
      return res.status(404).json({ message: "Lot non trouvé" });
    }
    
    res.json(lot);
  });

  app.post("/api/lots", requireAuth, async (req, res) => {
    try {
      // If not provided, generate lot number
      if (!req.body.lotNumber) {
        req.body.lotNumber = await storage.generateLotNumber(req.body.farmId);
      }
      
      const validatedData = insertLotSchema.parse(req.body);
      
      // Check if the farm exists
      const farm = await storage.getFarm(validatedData.farmId);
      if (!farm) {
        return res.status(400).json({ message: "Ferme non trouvée" });
      }
      
      const lot = await storage.createLot(validatedData);
      
      // Add an initial harvest activity
      if (validatedData.currentStatus === 'harvested') {
        await storage.createLotActivity({
          lotId: lot.id,
          activityType: 'harvest',
          datePerformed: validatedData.harvestDate,
          quantity: validatedData.initialQuantity,
          operatorName: req.user?.fullName || "Système",
          notes: "Création initiale du lot",
          attachments: [],
        });
      }
      
      res.status(201).json(lot);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Erreur du serveur" });
    }
  });

  // Lot activities
  app.get("/api/lots/:id/activities", requireAuth, async (req, res) => {
    const lotId = parseInt(req.params.id, 10);
    const lot = await storage.getLot(lotId);
    
    if (!lot) {
      return res.status(404).json({ message: "Lot non trouvé" });
    }
    
    const activities = await storage.getLotActivitiesByLot(lotId);
    res.json(activities);
  });

  app.post("/api/lots/:id/activities", requireAuth, async (req, res) => {
    try {
      const lotId = parseInt(req.params.id, 10);
      const lot = await storage.getLot(lotId);
      
      if (!lot) {
        return res.status(404).json({ message: "Lot non trouvé" });
      }
      
      const validatedData = insertLotActivitySchema.parse({
        ...req.body,
        lotId,
      });
      
      const activity = await storage.createLotActivity(validatedData);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Erreur du serveur" });
    }
  });

  // Barcode generation
  app.get("/api/lots/:id/barcode", requireAuth, async (req, res) => {
    const lotId = parseInt(req.params.id, 10);
    const lot = await storage.getLot(lotId);
    
    if (!lot) {
      return res.status(404).json({ message: "Lot non trouvé" });
    }
    
    const farm = await storage.getFarm(lot.farmId);
    if (!farm) {
      return res.status(404).json({ message: "Ferme non trouvée" });
    }
    
    try {
      const barcodeData = await generateBarcodeData(lot, farm.name);
      res.json(barcodeData);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la génération du code-barres" });
    }
  });

  // PDF generation
  app.get("/api/lots/:id/pdf", requireAuth, async (req, res) => {
    const lotId = parseInt(req.params.id, 10);
    const lot = await storage.getLot(lotId);
    
    if (!lot) {
      return res.status(404).json({ message: "Lot non trouvé" });
    }
    
    const farm = await storage.getFarm(lot.farmId);
    if (!farm) {
      return res.status(404).json({ message: "Ferme non trouvée" });
    }
    
    const activities = await storage.getLotActivitiesByLot(lotId);
    
    try {
      const pdfBuffer = await generateLotReport(lot, farm, activities);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=lot-${lot.lotNumber}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la génération du PDF" });
    }
  });

  // Admin-only routes
  app.get("/api/admin/users", requireAuth, async (req, res) => {
    // This will be protected by the isAdmin middleware in auth.ts
    const users = await storage.getAllUsers();
    // Don't send password hashes to client
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
  });

  app.post("/api/admin/users", requireAuth, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Nom d'utilisateur existe déjà" });
      }
      
      const user = await storage.createUser(validatedData);
      // Don't send password hash to client
      const { password, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Erreur du serveur" });
    }
  });

  // Stats for dashboard
  app.get("/api/stats", requireAuth, async (req, res) => {
    const lots = await storage.getAllLots();
    const farms = await storage.getAllFarms();
    
    // Calculate stats
    const totalLots = lots.length;
    const activeFarms = farms.filter(farm => farm.active).length;
    
    // Lots by status
    const inTransit = lots.filter(lot => lot.currentStatus === 'shipped').length;
    
    // Delivered today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deliveredToday = lots.filter(lot => {
      return lot.currentStatus === 'delivered' && new Date(lot.createdAt) >= today;
    }).length;
    
    res.json({
      totalLots,
      activeFarms,
      inTransit,
      deliveredToday,
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
