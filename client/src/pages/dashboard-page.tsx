import { useState } from "react";
import { Link } from "wouter";
import StatusCards from "@/components/dashboard/status-cards";
import FilterBar from "@/components/dashboard/filter-bar";
import LotTable from "@/components/dashboard/lot-table";
import { Plus, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsData, Farm, Lot, FilterState } from "@shared/schema";

// Static data
const STATIC_STATS: StatsData = {
  totalLots: 10,
  activeFarms: 3,
  inTransit: 5,
  deliveredToday: 2
};

const STATIC_FARMS: Farm[] = [
  {
    id: 1,
    name: "Ferme Atlas",
    code: "FA-001",
    location: "Marrakech",
    active: true,
    description: "Ferme spécialisée dans les avocats",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    name: "Ferme Sahara",
    code: "FS-002",
    location: "Agadir",
    active: true,
    description: "Ferme spécialisée dans les oranges",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const STATIC_LOTS: Lot[] = [
  {
    id: 1,
    lotNumber: "LOT-001",
    farmId: 1,
    harvestDate: new Date().toISOString(),
    initialQuantity: 1000,
    currentStatus: "shipped",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: "Lot d'avocats de première qualité"
  },
  {
    id: 2,
    lotNumber: "LOT-002",
    farmId: 2,
    harvestDate: new Date().toISOString(),
    initialQuantity: 500,
    currentStatus: "delivered",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: "Lot d'oranges bio"
  }
];

// Constants
const DEFAULT_FILTERS: FilterState = {
  search: "",
  farmId: "all",
  status: "all",
  date: "",
};

export default function DashboardPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  
  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  // Check if user can create entries (admin or operator)
  const canCreateEntries = true; // TODO: Replace with actual user role check
  
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Status Cards Section */}
      <section>
        <StatusCards 
          stats={STATIC_STATS} 
          isLoading={false} 
        />
      </section>
      
      {/* Filter Bar Section */}
      <section>
        <FilterBar 
          filters={filters} 
          onFilterChange={handleFilterChange} 
          farms={STATIC_FARMS} 
          isLoading={false} 
        />
      </section>
      
      {/* Lots Table Section */}
      <section>
        <LotTable 
          lots={STATIC_LOTS} 
          isLoading={false} 
          farms={STATIC_FARMS} 
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