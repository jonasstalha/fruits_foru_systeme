import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import BarcodeScanner from "@/components/scan/barcode-scanner";
import PDFViewer from "@/components/pdf/pdf-viewer";
import { Lot } from "@shared/schema";
import { Loader2 } from "lucide-react";
import MainLayout from "@/components/layout/main-layout";

export default function ScanPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [lotNumber, setLotNumber] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [scannedLot, setScannedLot] = useState<Lot | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Query for looking up a lot by number (when manually entered or scanned)
  const {
    data: lot,
    isLoading: queryLoading,
    refetch,
    isError,
    error
  } = useQuery<Lot>({
    queryKey: ["/api/lots/number", lotNumber],
    enabled: false, // Don't fetch automatically
  });

  // Handle barcode detection
  const handleBarcodeDetected = async (code: string) => {
    setIsLoading(true);
    try {
      // Here you would typically make an API call to process the scanned code
      console.log("Scanned code:", code);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLocation(`/lots/${code}`);
    } catch (error) {
      console.error("Error processing barcode:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle manual lookup
  const handleLookupLot = async (manualLotNumber?: string) => {
    const lotToLookup = manualLotNumber || lotNumber;
    if (!lotToLookup) {
      toast({
        title: "Veuillez entrer un numéro de lot",
        description: "Le numéro de lot est requis pour la recherche",
        variant: "destructive",
      });
      return;
    }

    // Use the refetch function with a custom query key
    const result = await refetch({
      queryKey: [`/api/lots/number/${lotToLookup}`]
    });

    if (result.data) {
      setScannedLot(result.data);
      toast({
        title: "Lot trouvé",
        description: `Lot ${result.data.lotNumber} trouvé avec succès`,
      });
    } else if (isError) {
      toast({
        title: "Erreur de recherche",
        description: error?.message || "Le lot n'a pas été trouvé",
        variant: "destructive",
      });
    }
  };

  // View details of scanned lot
  const viewLotDetails = () => {
    if (scannedLot) {
      setLocation(`/lots/${scannedLot.id}`);
    }
  };

  // Generate PDF for scanned lot
  const showPDF = () => {
    if (scannedLot) {
      setShowPdfPreview(true);
    }
  };

  return (
    <MainLayout title="Scanner Code" subtitle="Scanner un code QR pour traçabilité">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Barcode Card */}
        <Card>
          <CardHeader>
            <CardTitle>Scanner un Code-Barres</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {showScanner ? (
              <div className="mb-6">
                <BarcodeScanner onDetected={handleBarcodeDetected} />
                <Button 
                  className="w-full mt-4"
                  variant="outline"
                  onClick={() => setShowScanner(false)}
                >
                  Désactiver la Caméra
                </Button>
              </div>
            ) : (
              <div className="bg-neutral-800 h-48 rounded flex items-center justify-center mb-4">
                <Button 
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded flex items-center justify-center"
                  onClick={() => setShowScanner(true)}
                >
                  <span className="mr-2">Activer la Caméra</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Entry Card */}
        <Card>
          <CardHeader>
            <CardTitle>Entrer Manuellement</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Numéro de Lot
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  placeholder="Entrez le numéro de lot"
                />
              </div>
              <Button 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recherche...
                  </>
                ) : (
                  "Rechercher"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
