import { QueryClient } from "@tanstack/react-query";

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
export function getQueryFn<T>(endpoint: string) {
  return async () => {
    const response = await api.get<T>(endpoint);
    if (!response.data) {
      throw new Error("No data received from endpoint");
    }
    return response.data;
  };
}

// API request function with proper typing and error handling
export async function apiRequest<T>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  endpoint: string,
  data?: any
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: data ? JSON.stringify(data) : undefined,
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || "Une erreur est survenue");
    }

    // Ensure the response has the expected structure
    if (!responseData || typeof responseData !== 'object') {
      throw new Error("Invalid response format");
    }

    return responseData;
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
