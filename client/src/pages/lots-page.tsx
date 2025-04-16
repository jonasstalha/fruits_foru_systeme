import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Link } from "wouter";

// Static data for lots
const STATIC_LOTS = [
  {
    id: 1,
    lotNumber: "LOT-001",
    farmName: "Ferme Atlas",
    harvestDate: "2024-03-15",
    quantity: 1000,
    status: "shipped",
  },
  {
    id: 2,
    lotNumber: "LOT-002",
    farmName: "Ferme Sahara",
    harvestDate: "2024-03-16",
    quantity: 500,
    status: "delivered",
  },
];

export default function LotsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLots = STATIC_LOTS.filter(
    (lot) =>
      lot.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.farmName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Lots</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Rechercher un lot..."
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button asChild>
            <Link href="/new-entry">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Lot
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLots.map((lot) => (
          <Card key={lot.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">{lot.lotNumber}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-neutral-500">
                  <span className="font-medium">Ferme:</span> {lot.farmName}
                </p>
                <p className="text-sm text-neutral-500">
                  <span className="font-medium">Date de récolte:</span>{" "}
                  {new Date(lot.harvestDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-neutral-500">
                  <span className="font-medium">Quantité:</span> {lot.quantity} kg
                </p>
                <div className="flex items-center">
                  <span className="text-sm font-medium">Statut:</span>
                  <span
                    className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      lot.status === "shipped"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {lot.status === "shipped" ? "Expédié" : "Livré"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 