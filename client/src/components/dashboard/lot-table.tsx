import { useState } from "react";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Printer, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Lot, Farm } from "@shared/schema";

const PAGE_SIZE = 5;

interface LotTableProps {
  lots: Lot[];
  isLoading: boolean;
  farms: Farm[];
}

export default function LotTable({ lots, isLoading, farms }: LotTableProps) {
  const [page, setPage] = useState(1);
  
  // Calculate total pages
  const totalPages = Math.ceil(lots.length / PAGE_SIZE);
  
  // Get current page data
  const startIndex = (page - 1) * PAGE_SIZE;
  const currentLots = lots.slice(startIndex, startIndex + PAGE_SIZE);
  
  // Find farm name by id
  const getFarmName = (farmId: number) => {
    const farm = farms.find(f => f.id === farmId);
    return farm ? farm.name : "Ferme inconnue";
  };
  
  // Format harvest date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: fr });
  };
  
  // Get status badge class based on current status
  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'harvested':
        return "bg-neutral-100 text-neutral-800";
      case 'packaged':
        return "bg-neutral-100 text-neutral-800";
      case 'cooled':
        return "bg-yellow-100 text-yellow-800";
      case 'shipped':
        return "bg-blue-100 text-blue-800";
      case 'delivered':
        return "bg-green-100 text-green-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };
  
  // Get status text based on current status
  const getStatusText = (status: string) => {
    switch(status) {
      case 'harvested': return "Récolté";
      case 'packaged': return "Emballé";
      case 'cooled': return "Refroidi";
      case 'shipped': return "Expédié";
      case 'delivered': return "Livré";
      default: return status;
    }
  };
  
  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lot #</TableHead>
              <TableHead>Ferme</TableHead>
              <TableHead>Récolté</TableHead>
              <TableHead>Quantité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                </TableRow>
              ))
            ) : currentLots.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-neutral-500">
                  Aucun lot trouvé
                </TableCell>
              </TableRow>
            ) : (
              currentLots.map((lot) => (
                <TableRow key={lot.id}>
                  <TableCell className="font-mono">{lot.lotNumber}</TableCell>
                  <TableCell>{getFarmName(lot.farmId)}</TableCell>
                  <TableCell>{formatDate(lot.harvestDate)}</TableCell>
                  <TableCell>{lot.initialQuantity} kg</TableCell>
                  <TableCell>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(lot.currentStatus)}`}>
                      {getStatusText(lot.currentStatus)}
                    </span>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="text-blue-500 hover:text-blue-700"
                      title="Voir détails"
                    >
                      <Link href={`/lots/${lot.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-neutral-500 hover:text-neutral-700"
                      title="Imprimer code-barres"
                      asChild
                    >
                      <Link href={`/lots/${lot.id}/barcode`}>
                        <Printer className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      
      <CardFooter className="px-6 py-4 flex justify-between items-center border-t">
        <div className="text-sm text-neutral-500">
          {isLoading ? (
            <Skeleton className="h-4 w-52" />
          ) : (
            <>
              Affichage de <span className="font-medium">{startIndex + 1}</span> à{" "}
              <span className="font-medium">
                {Math.min(startIndex + PAGE_SIZE, lots.length)}
              </span>{" "}
              sur <span className="font-medium">{lots.length}</span> entrées
            </>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1 || isLoading}
          >
            Précédent
          </Button>
          
          {Array.from({ length: Math.min(totalPages, 3) }).map((_, i) => {
            const pageNumber = page <= 2 ? i + 1 : page - 1 + i;
            if (pageNumber <= totalPages) {
              return (
                <Button
                  key={i}
                  variant={pageNumber === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNumber)}
                  disabled={isLoading}
                >
                  {pageNumber}
                </Button>
              );
            }
            return null;
          })}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages || totalPages === 0 || isLoading}
          >
            Suivant
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
