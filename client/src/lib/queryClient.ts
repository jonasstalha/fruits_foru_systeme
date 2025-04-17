import { QueryClient } from "@tanstack/react-query";
import { mockApi, mockAvocadoTrackingData } from "./mockData";
import { AvocadoTracking, Farm } from "@shared/schema";

const API_BASE_URL = 'http://localhost:3000';

// Create a query client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Never consider data stale
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
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
    // Use mock API instead of real API calls
    switch (method) {
      case "GET":
        if (endpoint === "/api/avocado-tracking") {
          return await mockApi.getAvocadoTrackingData();
        }
        if (endpoint.startsWith("/api/avocado-tracking/")) {
          const lotNumber = endpoint.split("/").pop();
          if (lotNumber) {
            const entry = mockAvocadoTrackingData.find(
              (lot) => lot.harvest.lotNumber === lotNumber
            );
            if (!entry) {
              throw new Error(`Lot ${lotNumber} not found`);
            }
            return entry;
          }
        }
        if (endpoint === "/api/farms") {
          return await mockApi.getFarms();
        }
        if (endpoint.startsWith("/pdf/")) {
          const lotId = endpoint.split("/").pop();
          if (lotId) {
            return await mockApi.generatePDF(lotId);
          }
        }
        throw new Error(`Endpoint ${endpoint} not implemented in mock API`);
      
      case "POST":
        if (endpoint === "/api/avocado-tracking") {
          return await mockApi.addAvocadoTracking(data);
        }
        if (endpoint === "/api/farms") {
          return await mockApi.addFarm(data);
        }
        throw new Error(`Endpoint ${endpoint} not implemented in mock API`);
      
      case "PUT":
        if (endpoint.startsWith("/api/farms/")) {
          const id = parseInt(endpoint.split("/").pop() || "0");
          if (isNaN(id)) {
            throw new Error("Invalid farm ID");
          }
          return await mockApi.updateFarm(id, data);
        }
        throw new Error(`Endpoint ${endpoint} not implemented in mock API`);
      
      case "DELETE":
        if (endpoint.startsWith("/api/farms/")) {
          const id = parseInt(endpoint.split("/").pop() || "0");
          if (isNaN(id)) {
            throw new Error("Invalid farm ID");
          }
          await mockApi.deleteFarm(id);
          return null;
        }
        throw new Error(`Endpoint ${endpoint} not implemented in mock API`);
      
      default:
        throw new Error(`Method ${method} not implemented in mock API`);
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

export const addAvocadoTracking = (data: AvocadoTracking) => {
  return getQueryFn<AvocadoTracking>({
    queryKey: ['avocadoTracking', 'add'],
    queryFn: () => apiRequest<AvocadoTracking>('POST', '/api/avocado-tracking', data)
  });
};

export const addFarm = (data: Omit<Farm, 'id' | 'createdAt' | 'updatedAt'>) => {
  return getQueryFn<Farm>({
    queryKey: ['farms', 'add'],
    queryFn: () => apiRequest<Farm>('POST', '/api/farms', data)
  });
};

export const updateFarm = (id: number, data: Partial<Omit<Farm, 'id' | 'createdAt' | 'updatedAt'>>) => {
  return getQueryFn<Farm>({
    queryKey: ['farms', 'update', id],
    queryFn: () => apiRequest<Farm>('PUT', `/api/farms/${id}`, data)
  });
};

export const deleteFarm = (id: number) => {
  return getQueryFn<void>({
    queryKey: ['farms', 'delete', id],
    queryFn: () => apiRequest<void>('DELETE', `/api/farms/${id}`)
  });
};

// Add PDF generation function
export const generatePDF = (lotId: string | number) => {
  return getQueryFn<Blob>({
    queryKey: ['pdf', lotId],
    queryFn: () => apiRequest<Blob>('GET', `/pdf/${lotId}`)
  });
};
