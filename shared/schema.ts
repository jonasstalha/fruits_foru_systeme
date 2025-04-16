import { z } from "zod";

// Base types for common fields
export const baseSchema = {
  id: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
};

// User related schemas
export const userRoleSchema = z.enum(["admin", "operator", "client"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userSchema = z.object({
  ...baseSchema,
  username: z.string().min(3).max(50),
  fullName: z.string().min(2).max(100),
  role: userRoleSchema,
  password: z.string().min(6),
});

export const registerSchema = userSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export type User = z.infer<typeof userSchema>;

// Farm related schemas
export const farmSchema = z.object({
  ...baseSchema,
  name: z.string().min(2).max(100),
  location: z.string().min(2).max(200),
  description: z.string().max(500).optional(),
  code: z.string().min(2).max(20),
  active: z.boolean().default(true),
});

export const insertFarmSchema = farmSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type Farm = z.infer<typeof farmSchema>;

// Lot related schemas
export const lotStatusSchema = z.enum([
  "harvested",
  "packaged",
  "cooled",
  "shipped",
  "delivered"
]);
export type LotStatus = z.infer<typeof lotStatusSchema>;

export const lotSchema = z.object({
  ...baseSchema,
  lotNumber: z.string().min(1).max(50),
  farmId: z.number(),
  harvestDate: z.string().datetime(),
  initialQuantity: z.number().positive(),
  currentStatus: lotStatusSchema,
  notes: z.string().max(1000).optional(),
});

export const insertLotSchema = lotSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type Lot = z.infer<typeof lotSchema>;

// Lot Activity related schemas
export const activityTypeSchema = z.enum([
  "harvest",
  "package",
  "cool",
  "ship",
  "deliver"
]);
export type ActivityType = z.infer<typeof activityTypeSchema>;

export const lotActivitySchema = z.object({
  ...baseSchema,
  lotId: z.number(),
  activityType: activityTypeSchema,
  datePerformed: z.string().datetime(),
  quantity: z.number().positive(),
  operatorName: z.string().min(2).max(100),
  notes: z.string().max(1000).optional(),
  attachments: z.array(z.string()).default([]),
});

export const insertLotActivitySchema = lotActivitySchema.omit({ id: true, createdAt: true, updatedAt: true });
export type LotActivity = z.infer<typeof lotActivitySchema>;

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Stats types
export interface StatsData {
  totalLots: number;
  activeFarms: number;
  inTransit: number;
  deliveredToday: number;
}

// Filter types
export interface FilterState {
  search: string;
  farmId: string;
  status: string;
  date: string;
}

// Avocado Tracking Schemas
export const avocadoVarietySchema = z.enum([
  "hass",
  "fuerte",
  "bacon",
  "zutano",
  "other"
]);
export type AvocadoVariety = z.infer<typeof avocadoVarietySchema>;

export const qualityGradeSchema = z.enum(["A", "B", "C"]);
export type QualityGrade = z.infer<typeof qualityGradeSchema>;

// Harvest Form Schema
export const harvestFormSchema = z.object({
  harvestDate: z.string().datetime(),
  farmLocation: z.string().min(1),
  farmerId: z.string().min(1),
  lotNumber: z.string().min(1),
  variety: avocadoVarietySchema,
});

// Transport Form Schema
export const transportFormSchema = z.object({
  lotNumber: z.string().min(1),
  transportCompany: z.string().min(1),
  driverName: z.string().min(1),
  vehicleId: z.string().min(1),
  departureDateTime: z.string().datetime(),
  arrivalDateTime: z.string().datetime(),
  temperature: z.number().optional(),
});

// Sorting Form Schema
export const sortingFormSchema = z.object({
  lotNumber: z.string().min(1),
  sortingDate: z.string().datetime(),
  staffInvolved: z.array(z.string()).optional(),
  qualityGrade: qualityGradeSchema,
  rejectedCount: z.number().min(0),
  notes: z.string().optional(),
});

// Packaging Form Schema
export const packagingFormSchema = z.object({
  lotNumber: z.string().min(1),
  packagingDate: z.string().datetime(),
  boxId: z.string().min(1),
  workerIds: z.array(z.string()),
  netWeight: z.number().positive(),
  avocadoCount: z.number().positive(),
});

// Storage Form Schema
export const storageFormSchema = z.object({
  boxId: z.string().min(1),
  entryDate: z.string().datetime(),
  storageTemperature: z.number(),
  storageRoomId: z.string().min(1),
  exitDate: z.string().datetime(),
});

// Export Form Schema
export const exportFormSchema = z.object({
  boxId: z.string().min(1),
  loadingDate: z.string().datetime(),
  containerId: z.string().min(1),
  driverName: z.string().min(1),
  vehicleId: z.string().min(1),
  destination: z.string().min(1),
});

// Delivery Form Schema
export const deliveryFormSchema = z.object({
  boxId: z.string().min(1),
  estimatedDeliveryDate: z.string().datetime(),
  actualDeliveryDate: z.string().datetime(),
  clientName: z.string().min(1),
  received: z.boolean(),
  receivedBy: z.string().optional(),
});

// Combined Avocado Tracking Schema
export const avocadoTrackingSchema = z.object({
  harvest: harvestFormSchema,
  transport: transportFormSchema,
  sorting: sortingFormSchema,
  packaging: packagingFormSchema,
  storage: storageFormSchema,
  export: exportFormSchema,
  delivery: deliveryFormSchema,
});

export type AvocadoTracking = z.infer<typeof avocadoTrackingSchema>;
