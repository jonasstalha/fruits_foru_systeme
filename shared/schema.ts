import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for auth
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("operator"), // admin, operator, client
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
});

// Farms table
export const farms = pgTable("farms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  active: boolean("active").notNull().default(true),
});

export const insertFarmSchema = createInsertSchema(farms).pick({
  name: true,
  code: true,
  active: true,
});

// Lots table
export const lots = pgTable("lots", {
  id: serial("id").primaryKey(),
  lotNumber: text("lot_number").notNull().unique(),
  farmId: integer("farm_id").notNull(),
  harvestDate: timestamp("harvest_date").notNull(),
  initialQuantity: integer("initial_quantity").notNull(), // in kg
  currentStatus: text("current_status").notNull().default("harvested"), // harvested, packaged, cooled, shipped, delivered
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLotSchema = createInsertSchema(lots).pick({
  lotNumber: true,
  farmId: true,
  harvestDate: true,
  initialQuantity: true,
  currentStatus: true,
});

// Lot activities table
export const lotActivities = pgTable("lot_activities", {
  id: serial("id").primaryKey(),
  lotId: integer("lot_id").notNull(),
  activityType: text("activity_type").notNull(), // harvest, package, cool, ship, deliver
  datePerformed: timestamp("date_performed").notNull(),
  quantity: integer("quantity"), // in kg, may change at different stages
  operatorName: text("operator_name").notNull(),
  notes: text("notes"),
  attachments: text("attachments").array(), // File paths/URLs
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLotActivitySchema = createInsertSchema(lotActivities).pick({
  lotId: true,
  activityType: true,
  datePerformed: true,
  quantity: true,
  operatorName: true,
  notes: true,
  attachments: true,
});

// Define types from schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFarm = z.infer<typeof insertFarmSchema>;
export type Farm = typeof farms.$inferSelect;

export type InsertLot = z.infer<typeof insertLotSchema>;
export type Lot = typeof lots.$inferSelect;

export type InsertLotActivity = z.infer<typeof insertLotActivitySchema>;
export type LotActivity = typeof lotActivities.$inferSelect;

// Enhanced validation schema for forms
export const loginSchema = z.object({
  username: z.string().min(3, "Nom d'utilisateur doit contenir au moins 3 caractères"),
  password: z.string().min(6, "Mot de passe doit contenir au moins 6 caractères"),
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export const farmSchema = insertFarmSchema.extend({
  code: z.string().regex(/^[A-Z0-9]{2,10}$/, "Code doit être entre 2-10 caractères alphanumériques"),
});

export const lotActivitySchema = insertLotActivitySchema.extend({
  activityType: z.enum(['harvest', 'package', 'cool', 'ship', 'deliver'], {
    errorMap: () => ({ message: "Type d'activité invalide" }),
  }),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
