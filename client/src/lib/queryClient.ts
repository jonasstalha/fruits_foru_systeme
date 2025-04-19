import { QueryClient } from "@tanstack/react-query";
import { Farm, Lot, AvocadoTracking, StatsData } from "@shared/schema";
import * as firebaseService from "./firebaseService";

// Create a query client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Consider data stale immediately to allow refetching
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Helper function to create query functions
export function getQueryFn<T>(options: { queryKey: string[], queryFn: () => Promise<T> }) {
  return options.queryFn;
}

// API request function with proper typing and error handling
export async function apiRequest<T>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  endpoint: string,
  data?: any
): Promise<T> {
  try {
    console.log(`API Request: ${method} ${endpoint}`, data ? `with data: ${JSON.stringify(data)}` : '');
    
    // Use Firebase service instead of mock API
    switch (method) {
      case "GET":
        if (endpoint === "/api/avocado-tracking") {
          return await firebaseService.getAvocadoTrackingData();
        }
        if (endpoint.startsWith("/api/avocado-tracking/")) {
          const lotNumber = endpoint.split("/").pop();
          if (lotNumber) {
            const entries = await firebaseService.getAvocadoTrackingData();
            const entry = entries.find(
              (lot) => lot.harvest.lotNumber === lotNumber
            );
            if (!entry) {
              throw new Error(`Lot ${lotNumber} not found`);
            }
            return entry;
          }
        }
        if (endpoint === "/api/farms") {
          return await firebaseService.getFarms();
        }
        if (endpoint === "/api/lots") {
          return await firebaseService.getLots();
        }
        if (endpoint === "/api/stats") {
          return await firebaseService.getStats();
        }
        if (endpoint.startsWith("/pdf/")) {
          // PDF generation is not implemented in Firebase yet
          throw new Error("PDF generation is not implemented in Firebase yet");
        }
        throw new Error(`Endpoint ${endpoint} not implemented in Firebase service`);
      
      case "POST":
        if (endpoint === "/api/avocado-tracking") {
          return await firebaseService.addAvocadoTracking(data);
        }
        if (endpoint === "/api/farms") {
          console.log("API Request: Adding farm with data:", data);
          const result = await firebaseService.addFarm(data);
          console.log("API Request: Farm added successfully:", result);
          return result;
        }
        if (endpoint === "/api/lots") {
          return await firebaseService.addLot(data);
        }
        throw new Error(`Endpoint ${endpoint} not implemented in Firebase service`);
      
      case "PUT":
        if (endpoint.startsWith("/api/farms/")) {
          const id = endpoint.split("/").pop();
          if (!id) {
            throw new Error("Invalid farm ID");
          }
          return await firebaseService.updateFarm(id, data);
        }
        if (endpoint.startsWith("/api/lots/")) {
          const id = endpoint.split("/").pop();
          if (!id) {
            throw new Error("Invalid lot ID");
          }
          return await firebaseService.updateLot(id, data);
        }
        throw new Error(`Endpoint ${endpoint} not implemented in Firebase service`);
      
      case "DELETE":
        if (endpoint.startsWith("/api/farms/")) {
          const id = endpoint.split("/").pop();
          if (!id) {
            throw new Error("Invalid farm ID");
          }
          await firebaseService.deleteFarm(id);
          return null;
        }
        if (endpoint.startsWith("/api/lots/")) {
          const id = endpoint.split("/").pop();
          if (!id) {
            throw new Error("Invalid lot ID");
          }
          await firebaseService.deleteLot(id);
          return null;
        }
        throw new Error(`Endpoint ${endpoint} not implemented in Firebase service`);
      
      default:
        throw new Error(`Method ${method} not implemented in Firebase service`);
    }
  } catch (error) {
    console.error(`API Error (${method} ${endpoint}):`, error);
    throw error;
  }
}

// Helper functions for common API operations
export const api = {
  get: <T>(endpoint: string) => apiRequest<T>("GET", endpoint),
  post: <T>(endpoint: string, data: any) => apiRequest<T>("POST", endpoint, data),
  put: <T>(endpoint: string, data: any) => apiRequest<T>("PUT", endpoint, data),
  delete: <T>(endpoint: string) => apiRequest<T>("DELETE", endpoint),
  patch: <T>(endpoint: string, data: any) => apiRequest<T>("PATCH", endpoint, data),
};

export const getAvocadoTrackingData = () => {
  return getQueryFn<AvocadoTracking[]>({
    queryKey: ['avocadoTracking'],
    queryFn: () => apiRequest<AvocadoTracking[]>('GET', '/api/avocado-tracking')
  });
};

export const getFarms = () => {
  return getQueryFn<Farm[]>({
    queryKey: ['farms'],
    queryFn: () => apiRequest<Farm[]>('GET', '/api/farms')
  });
};

export const getLots = () => {
  return getQueryFn<Lot[]>({
    queryKey: ['lots'],
    queryFn: () => apiRequest<Lot[]>('GET', '/api/lots')
  });
};

export const getStats = () => {
  return getQueryFn<StatsData>({
    queryKey: ['stats'],
    queryFn: () => apiRequest<StatsData>('GET', '/api/stats')
  });
};

export const addAvocadoTracking = (data: AvocadoTracking) => {
  return getQueryFn<AvocadoTracking>({
    queryKey: ['avocadoTracking', 'add'],
    queryFn: async () => {
      const result = await apiRequest<AvocadoTracking>('POST', '/api/avocado-tracking', data);
      // Invalidate the avocadoTracking query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['avocadoTracking'] });
      return result;
    }
  });
};

export const addFarm = (data: Omit<Farm, 'id' | 'createdAt' | 'updatedAt'>) => {
  return getQueryFn<Farm>({
    queryKey: ['farms', 'add'],
    queryFn: () => apiRequest<Farm>('POST', '/api/farms', data)
  });
};

export const addLot = (data: Omit<Lot, 'id' | 'createdAt' | 'updatedAt'>) => {
  return getQueryFn<Lot>({
    queryKey: ['lots', 'add'],
    queryFn: () => apiRequest<Lot>('POST', '/api/lots', data)
  });
};

export const updateFarm = (id: number, data: Partial<Omit<Farm, 'id' | 'createdAt' | 'updatedAt'>>) => {
  return getQueryFn<Farm>({
    queryKey: ['farms', 'update', id],
    queryFn: () => apiRequest<Farm>('PUT', `/api/farms/${id}`, data)
  });
};

export const updateLot = (id: number, data: Partial<Omit<Lot, 'id' | 'createdAt' | 'updatedAt'>>) => {
  return getQueryFn<Lot>({
    queryKey: ['lots', 'update', id],
    queryFn: () => apiRequest<Lot>('PUT', `/api/lots/${id}`, data)
  });
};

export const deleteFarm = (id: number) => {
  return getQueryFn<void>({
    queryKey: ['farms', 'delete', id],
    queryFn: () => apiRequest<void>('DELETE', `/api/farms/${id}`)
  });
};

export const deleteLot = (id: number) => {
  return getQueryFn<void>({
    queryKey: ['lots', 'delete', id],
    queryFn: () => apiRequest<void>('DELETE', `/api/lots/${id}`)
  });
};

export const generatePDF = (lotId: string | number) => {
  return getQueryFn<string>({
    queryKey: ['pdf', lotId],
    queryFn: () => apiRequest<string>('GET', `/pdf/${lotId}`)
  });
};
