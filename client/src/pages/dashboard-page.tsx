import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import TopBar from "@/components/layout/top-bar";
import StatusCards from "@/components/dashboard/status-cards";
import FilterBar from "@/components/dashboard/filter-bar";
import LotTable from "@/components/dashboard/lot-table";
import { Plus, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Lot, Farm } from "@shared/schema";

interface FilterState {
  search: string;
  farmId: string;
  status: string;
  date: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    farmId: "",
    status: "",
    date: "",
  });
  
  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });
  
  // Fetch farms for filter dropdown
  const { data: farms, isLoading: farmsLoading } = useQuery<Farm[]>({
    queryKey: ["/api/farms"],
  });
  
  // Construct query string from filters
  const getQueryString = () => {
    const params = new URLSearchParams();
    
    if (filters.farmId) params.append("farmId", filters.farmId);
    if (filters.status) params.append("status", filters.status);
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
