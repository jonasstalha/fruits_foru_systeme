import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import TopBar from "@/components/layout/top-bar";
import StatusCards from "@/components/dashboard/status-cards";
import FilterBar from "@/components/dashboard/filter-bar";
import LotTable from "@/components/dashboard/lot-table";
import { Plus, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Lot, Farm } from "@shared/schema";

// Define StatsData interface
interface StatsData {
  totalLots: number;
  activeFarms: number;
  inTransit: number;
  deliveredToday: number;
}

interface FilterState {
  search: string;
  farmId: string;
  status: string;
  date: string;
}

export default function DashboardPage() {
  // Create a fake admin user since we have removed authentication
  const user = { id: 1, username: 'admin', role: 'admin', fullName: 'Admin User' };
  
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    farmId: "all",
    status: "all",
    date: "",
  });
  
  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery<StatsData>({
    queryKey: ["/api/stats"],
  });
  
  // Fetch farms for filter dropdown
  const { data: farms, isLoading: farmsLoading } = useQuery<Farm[]>({
    queryKey: ["/api/farms"],
  });
  
  // Construct query string from filters
  const getQueryString = () => {
    const params = new URLSearchParams();
    
    // Only add farmId if it's a valid id (not "all")
    if (filters.farmId && filters.farmId !== "all") params.append("farmId", filters.farmId);
    
    // Only add status if it's a valid status (not "all")
    if (filters.status && filters.status !== "all") params.append("status", filters.status);
    
    if (filters.date) params.append("date", filters.date);
    
    return params.toString();
  };
  
  // Fetch lots with filters
  const { data: lots, isLoading: lotsLoading } = useQuery<Lot[]>({
    queryKey: [`/api/lots?${getQueryString()}`],
  });
  
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters({ ...filters, ...newFilters });
  };
  
  const canCreateEntries = user?.role === 'admin' || user?.role === 'operator';
  
  return (
    <>
      <TopBar title="Tableau de Bord" subtitle="Vue d'ensemble de la traçabilité" />
      
      <div className="p-4 md:p-6">
        {/* Status Cards */}
        <StatusCards stats={stats} isLoading={statsLoading} />
        
        {/* Filter Bar */}
        <FilterBar 
          filters={filters} 
          onFilterChange={handleFilterChange} 
          farms={farms || []} 
          isLoading={farmsLoading} 
        />
        
        {/* Lots Table */}
        <LotTable 
          lots={lots || []} 
          isLoading={lotsLoading} 
          farms={farms || []} 
        />
        
        {/* Action Buttons */}
        {canCreateEntries && (
          <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
            <Button asChild className="h-14 w-14 rounded-full shadow-lg">
              <Link href="/scan">
                <QrCode className="h-6 w-6" />
              </Link>
            </Button>
            <Button asChild className="h-14 w-14 rounded-full shadow-lg">
              <Link href="/new-entry">
                <Plus className="h-6 w-6" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
