import { users, farms, lots, lotActivities } from "@shared/schema";
import type { 
  User, InsertUser, 
  Farm, InsertFarm, 
  Lot, InsertLot, 
  LotActivity, InsertLotActivity 
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Define interface for storage operations
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Farm methods
  getFarm(id: number): Promise<Farm | undefined>;
  getFarmByCode(code: string): Promise<Farm | undefined>;
  createFarm(farm: InsertFarm): Promise<Farm>;
  updateFarm(id: number, farm: Partial<InsertFarm>): Promise<Farm | undefined>;
  getAllFarms(): Promise<Farm[]>;
  
  // Lot methods
  getLot(id: number): Promise<Lot | undefined>;
  getLotByNumber(lotNumber: string): Promise<Lot | undefined>;
  createLot(lot: InsertLot): Promise<Lot>;
  updateLot(id: number, lot: Partial<InsertLot>): Promise<Lot | undefined>;
  getAllLots(): Promise<Lot[]>;
  getLotsByFarm(farmId: number): Promise<Lot[]>;
  getLotsByStatus(status: string): Promise<Lot[]>;
  getLotsByDateRange(startDate: Date, endDate: Date): Promise<Lot[]>;
  
  // Lot activity methods
  getLotActivity(id: number): Promise<LotActivity | undefined>;
  createLotActivity(activity: InsertLotActivity): Promise<LotActivity>;
  getLotActivitiesByLot(lotId: number): Promise<LotActivity[]>;
  
  // Generate a new lot number (format: AV-YYMMDD-XXX)
  generateLotNumber(farmId: number): Promise<string>;
  
  // Session storage
  sessionStore: session.SessionStore;
}

// In-memory implementation
export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private farmsData: Map<number, Farm>;
  private lotsData: Map<number, Lot>;
  private lotActivitiesData: Map<number, LotActivity>;
  sessionStore: session.SessionStore;
  
  currentUserId: number;
  currentFarmId: number;
  currentLotId: number;
  currentLotActivityId: number;
  
  constructor() {
    this.usersData = new Map();
    this.farmsData = new Map();
    this.lotsData = new Map();
    this.lotActivitiesData = new Map();
    
    this.currentUserId = 1;
    this.currentFarmId = 1;
    this.currentLotId = 1;
    this.currentLotActivityId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Seed initial admin user
    this.createUser({
      username: "admin",
      password: "$2b$10$zQAKFBYNyDzxCBXbe1lUxOu6YZe.mQVFbkJQvBXhQFRGiZJR9n8yi", // password: admin123
      fullName: "Administrator",
      role: "admin",
    });
    
    // Seed initial farm
    this.createFarm({
      name: "Ferme Atlas",
      code: "FA-001",
      active: true,
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { id, ...userData };
    this.usersData.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.usersData.values());
  }
  
  // Farm methods
  async getFarm(id: number): Promise<Farm | undefined> {
    return this.farmsData.get(id);
  }
  
  async getFarmByCode(code: string): Promise<Farm | undefined> {
    return Array.from(this.farmsData.values()).find(
      (farm) => farm.code.toLowerCase() === code.toLowerCase(),
    );
  }
  
  async createFarm(farmData: InsertFarm): Promise<Farm> {
    const id = this.currentFarmId++;
    const farm: Farm = { id, ...farmData };
    this.farmsData.set(id, farm);
    return farm;
  }
  
  async updateFarm(id: number, farmData: Partial<InsertFarm>): Promise<Farm | undefined> {
    const farm = this.farmsData.get(id);
    if (!farm) return undefined;
    
    const updatedFarm: Farm = { ...farm, ...farmData };
    this.farmsData.set(id, updatedFarm);
    return updatedFarm;
  }
  
  async getAllFarms(): Promise<Farm[]> {
    return Array.from(this.farmsData.values());
  }
  
  // Lot methods
  async getLot(id: number): Promise<Lot | undefined> {
    return this.lotsData.get(id);
  }
  
  async getLotByNumber(lotNumber: string): Promise<Lot | undefined> {
    return Array.from(this.lotsData.values()).find(
      (lot) => lot.lotNumber === lotNumber,
    );
  }
  
  async createLot(lotData: InsertLot): Promise<Lot> {
    const id = this.currentLotId++;
    const lot: Lot = { id, ...lotData };
    this.lotsData.set(id, lot);
    return lot;
  }
  
  async updateLot(id: number, lotData: Partial<InsertLot>): Promise<Lot | undefined> {
    const lot = this.lotsData.get(id);
    if (!lot) return undefined;
    
    const updatedLot: Lot = { ...lot, ...lotData };
    this.lotsData.set(id, updatedLot);
    return updatedLot;
  }
  
  async getAllLots(): Promise<Lot[]> {
    return Array.from(this.lotsData.values());
  }
  
  async getLotsByFarm(farmId: number): Promise<Lot[]> {
    return Array.from(this.lotsData.values()).filter(
      (lot) => lot.farmId === farmId,
    );
  }
  
  async getLotsByStatus(status: string): Promise<Lot[]> {
    return Array.from(this.lotsData.values()).filter(
      (lot) => lot.currentStatus === status,
    );
  }
  
  async getLotsByDateRange(startDate: Date, endDate: Date): Promise<Lot[]> {
    return Array.from(this.lotsData.values()).filter(
      (lot) => {
        const harvestDate = new Date(lot.harvestDate);
        return harvestDate >= startDate && harvestDate <= endDate;
      },
    );
  }
  
  // Lot activity methods
  async getLotActivity(id: number): Promise<LotActivity | undefined> {
    return this.lotActivitiesData.get(id);
  }
  
  async createLotActivity(activityData: InsertLotActivity): Promise<LotActivity> {
    const id = this.currentLotActivityId++;
    const activity: LotActivity = { id, ...activityData };
    this.lotActivitiesData.set(id, activity);
    
    // Update lot status based on activity type
    const lot = this.lotsData.get(activityData.lotId);
    if (lot) {
      let status = '';
      switch (activityData.activityType) {
        case 'harvest': status = 'harvested'; break;
        case 'package': status = 'packaged'; break;
        case 'cool': status = 'cooled'; break;
        case 'ship': status = 'shipped'; break;
        case 'deliver': status = 'delivered'; break;
      }
      
      if (status) {
        this.updateLot(lot.id, { currentStatus: status });
      }
    }
    
    return activity;
  }
  
  async getLotActivitiesByLot(lotId: number): Promise<LotActivity[]> {
    return Array.from(this.lotActivitiesData.values())
      .filter((activity) => activity.lotId === lotId)
      .sort((a, b) => {
        // Sort by date performed
        return new Date(a.datePerformed).getTime() - new Date(b.datePerformed).getTime();
      });
  }
  
  // Generate a lot number: AV-YYMMDD-XXX
  async generateLotNumber(farmId: number): Promise<string> {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // Count existing lots with today's date
    const todaysLots = Array.from(this.lotsData.values()).filter(
      (lot) => lot.lotNumber.includes(`AV-${dateStr}`)
    );
    
    const sequenceNumber = (todaysLots.length + 1).toString().padStart(3, '0');
    return `AV-${dateStr}-${sequenceNumber}`;
  }
}

export const storage = new MemStorage();
