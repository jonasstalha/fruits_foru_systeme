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

export default function ScanPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [lotNumber, setLotNumber] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [scannedLot, setScannedLot] = useState<Lot | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  
  // Query for looking up a lot by number (when manually entered or scanned)
  const {
    data: lot,
    isLoading,
    refetch,
    isError,
    error
  } = useQuery<Lot>({
    queryKey: ["/api/lots/number", lotNumber],
    enabled: false, // Don't fetch automatically
  });

  // Handle barcode detection
  const handleBarcodeDetected = (barcode: string) => {
    setLotNumber(barcode);
    handleLookupLot(barcode);
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
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      <main className="flex-grow">
        <TopBar title="Scanner Code-Barres" subtitle="Scanner ou entrer un code-barres de lot" />
        
        <div className="p-4 md:p-6">
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
                      <span className="mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1v-2a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                      </span>
                      Activer la Caméra
                    </Button>
                  </div>
                )}

                <h3 className="font-medium mb-4">Ou Entrez le Code Manuellement</h3>
                <div className="flex">
                  <Input
                    type="text"
                    placeholder="AV-YYMMDD-XXX"
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                    className="flex-grow"
                  />
                  <Button
                    onClick={() => handleLookupLot()}
                    disabled={isLoading}
                    className="ml-2"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Rechercher"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Result Card */}
            <Card>
              <CardHeader>
                <CardTitle>Résultat de Recherche</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-neutral-500">Recherche en cours...</p>
                  </div>
                ) : scannedLot ? (
                  <div className="space-y-6">
                    <div className="p-4 border rounded bg-neutral-50">
                      <h3 className="font-bold text-lg mb-4 text-center">Lot trouvé</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-neutral-500">Numéro de Lot</p>
                          <p className="font-mono font-bold">{scannedLot.lotNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">Statut</p>
                          <p className="font-medium">
                            <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full 
                              ${scannedLot.currentStatus === 'delivered' ? 'bg-green-100 text-green-800' : 
                                scannedLot.currentStatus === 'shipped' ? 'bg-blue-100 text-blue-800' : 
                                scannedLot.currentStatus === 'cooled' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-neutral-100 text-neutral-800'}`}
                            >
                              {scannedLot.currentStatus === 'harvested' && 'Récolté'}
                              {scannedLot.currentStatus === 'packaged' && 'Emballé'}
                              {scannedLot.currentStatus === 'cooled' && 'Refroidi'}
                              {scannedLot.currentStatus === 'shipped' && 'Expédié'}
                              {scannedLot.currentStatus === 'delivered' && 'Livré'}
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">Date de Récolte</p>
                          <p className="font-medium">
                            {new Date(scannedLot.harvestDate).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">Quantité</p>
                          <p className="font-medium">{scannedLot.initialQuantity} kg</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                      <Button className="bg-primary-500 text-white flex-1 flex items-center justify-center" onClick={viewLotDetails}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Voir Détails
                      </Button>
                      <Button className="flex-1 flex items-center justify-center" onClick={showPDF}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Générer PDF
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-neutral-500">
                      {isError ? 
                        "Erreur lors de la recherche. Veuillez réessayer." : 
                        "Scannez un code-barres ou entrez un numéro de lot pour afficher les détails"
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* PDF Preview Modal */}
      {showPdfPreview && scannedLot && (
        <PDFViewer 
          lotId={scannedLot.id}
          onClose={() => setShowPdfPreview(false)}
        />
      )}
    </div>
  );
}
