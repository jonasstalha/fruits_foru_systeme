import { useState } from "react";
import { Link } from "wouter";
import StatusCards from "@/components/dashboard/status-cards";
import FilterBar from "@/components/dashboard/filter-bar";
import LotTable from "@/components/dashboard/lot-table";
import { Plus, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsData, Farm, Lot, FilterState, AvocadoTracking } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { api, getFarms } from "@/lib/queryClient";

// Constants
const DEFAULT_FILTERS: FilterState = {
  search: "",
  farmId: "all",
  status: "all",
  date: "",
};

export default function DashboardPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  
  // Fetch farms data
  const { data: farms = [], isLoading: isLoadingFarms } = useQuery({
    queryKey: ['farms'],
    queryFn: () => api.get<Farm[]>('/api/farms')
  });
  
  // Fetch avocado tracking data (instead of lots)
  const { data: avocadoTrackingData = [], isLoading: isLoadingAvocadoTracking, refetch: refetchAvocadoTracking } = useQuery({
    queryKey: ['avocadoTracking'],
    queryFn: () => api.get<AvocadoTracking[]>('/api/avocado-tracking'),
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });
  
  // Convert avocado tracking data to lots format for the table
  const lots: Lot[] = avocadoTrackingData.map((tracking, index) => ({
    id: index + 1,
    lotNumber: tracking.harvest.lotNumber,
    farmId: 1, // Default to first farm, since we don't have farmId in tracking data
    harvestDate: tracking.harvest.harvestDate,
    initialQuantity: 1000, // Default value
    currentStatus: "shipped", // Default value
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: `Lot from ${tracking.harvest.farmLocation}`
  }));
  
  // Fetch stats data
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get<StatsData>('/api/stats')
  });
  
  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  // Apply filters to lots
  const filteredLots = lots.filter(lot => {
    // Filter by search term
    if (filters.search && !lot.lotNumber.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Filter by farm
    if (filters.farmId !== 'all' && lot.farmId !== parseInt(filters.farmId)) {
      return false;
    }
    
    // Filter by status
    if (filters.status !== 'all' && lot.currentStatus !== filters.status) {
      return false;
    }
    
    // Filter by date
    if (filters.date) {
      const harvestDate = new Date(lot.harvestDate);
      const filterDate = new Date(filters.date);
      
      if (harvestDate.toDateString() !== filterDate.toDateString()) {
        return false;
      }
    }
    
    return true;
  });
  
  // Check if user can create entries (admin or operator)
  const canCreateEntries = true; // TODO: Replace with actual user role check
  
  // Determine if any data is loading
  const isLoading = isLoadingFarms || isLoadingAvocadoTracking || isLoadingStats;
  
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Status Cards Section */}
      <section>
        <StatusCards 
          stats={stats} 
          isLoading={isLoadingStats} 
        />
      </section>
      
      {/* Filter Bar Section */}
      <section>
        <FilterBar 
          filters={filters} 
          onFilterChange={handleFilterChange} 
          farms={farms} 
          isLoading={isLoadingFarms} 
        />
      </section>
      
      {/* Lots Table Section */}
      <section>
        <LotTable 
          lots={filteredLots} 
          isLoading={isLoadingAvocadoTracking} 
          farms={farms} 
        />
      </section>
      
      {/* Action Buttons */}
      {canCreateEntries && (
        <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
          <Button 
            asChild 
            className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary-600"
            title="Scanner un code-barres"
          >
            <Link href="/scan">
              <QrCode className="h-6 w-6" />
            </Link>
          </Button>
          <Button 
            asChild 
            className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary-600"
            title="Ajouter une nouvelle entrée"
          >
            <Link href="/new-entry">
              <Plus className="h-6 w-6" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}