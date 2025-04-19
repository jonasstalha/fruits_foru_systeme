import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import BarcodeScanner from "@/components/scan/barcode-scanner";
import PDFViewer from "@/components/pdf/pdf-viewer";
import { AvocadoTracking } from "@shared/schema";
import { Loader2, QrCode, Search, Camera, X, FileText, ExternalLink, Download } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generatePDF, apiRequest } from '../lib/queryClient';

export default function ScanPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [lotNumber, setLotNumber] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [scannedLot, setScannedLot] = useState<AvocadoTracking | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lotId, setLotId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  
  // Query for looking up a lot by number (when manually entered or scanned)
  const {
    data: lot,
    isLoading: queryLoading,
    refetch,
    isError,
    error
  } = useQuery<AvocadoTracking>({
    queryKey: ["/api/avocado-tracking", lotNumber],
    queryFn: () => apiRequest<AvocadoTracking>('GET', `/api/avocado-tracking/${lotNumber}`),
    enabled: false, // Don't fetch automatically
  });

  const { data: pdfData, refetch: refetchPDF } = useQuery<Blob>({
    queryKey: ['pdf', lotId],
    queryFn: () => {
      // Only make the API request if we have a valid lotId
      if (!lotId) {
        throw new Error("Lot ID is required for PDF generation");
      }
      return apiRequest<Blob>('GET', `/pdf/${lotId}`);
    },
    enabled: false,
  });

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!lotId) return;
    
    setIsDownloading(true);
    try {
      await refetchPDF();
      if (pdfData) {
        // Create a URL for the HTML content
        const url = window.URL.createObjectURL(pdfData);
        
        // Open in a new window for printing
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      }
    } catch (error) {
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger le PDF. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
      setShowDownloadConfirm(false);
    }
  };

  // Handle barcode detection
  const handleBarcodeDetected = async (code: string) => {
    setIsLoading(true);
    try {
      // Here you would typically make an API call to process the scanned code
      console.log("Scanned code:", code);
      setLotNumber(code); // Set the lot number from scan
      await handleLookupLot(code); // Automatically look up the scanned code
      setShowScanner(false); // Close scanner after successful scan
    } catch (error) {
      console.error("Error processing barcode:", error);
      toast({
        title: "Erreur de scan",
        description: "Impossible de traiter le code scanné. Veuillez réessayer.",
        variant: "destructive",
      });
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

    setIsLoading(true);
    try {
      // Use the refetch function
      const result = await refetch();

      if (result.data) {
        setScannedLot(result.data);
        toast({
          title: "Lot trouvé",
          description: `Lot ${result.data.harvest.lotNumber} trouvé avec succès`,
        });
        if (result.data.harvest.lotNumber) {
          setLotId(result.data.harvest.lotNumber);
        }
      }
    } catch (err) {
      toast({
        title: "Erreur de recherche",
        description: error instanceof Error ? error.message : "Le lot n'a pas été trouvé",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // View details of scanned lot
  const viewLotDetails = () => {
    if (scannedLot) {
      setLocation(`/lots/${scannedLot.harvest.lotNumber}`);
    }
  };

  // Generate PDF for scanned lot
  const showPDF = () => {
    if (scannedLot) {
      setShowPdfPreview(true);
    }
  };

  // Handle download confirmation
  const handleDownloadClick = () => {
    setShowDownloadConfirm(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column: Scan & Search */}
      <div className="space-y-6">
        {/* Scanner Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Scanner un Code
            </CardTitle>
            <CardDescription>
              Utilisez la caméra pour scanner un code-barres ou QR code
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {showScanner ? (
              <div className="relative">
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <BarcodeScanner onDetected={handleBarcodeDetected} />
                </div>
                <Button 
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => setShowScanner(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button 
                className="w-full h-[200px]"
                variant="outline"
                onClick={() => setShowScanner(true)}
              >
                <Camera className="h-6 w-6 mr-2" />
                Activer la Caméra
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Manual Search Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Recherche Manuelle
            </CardTitle>
            <CardDescription>
              Entrez manuellement un numéro de lot
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={(e) => {
              e.preventDefault();
              handleLookupLot();
            }}>
              <div className="flex gap-2">
                <Input
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  placeholder="Entrez le numéro de lot"
                  disabled={isLoading}
                />
                <Button 
                  type="submit"
                  disabled={isLoading || !lotNumber}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Recherche
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Rechercher
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Results */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Résultats
            </CardTitle>
            <CardDescription>
              Informations sur le lot scanné ou recherché
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : scannedLot ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Numéro de Lot</div>
                    <div className="text-lg font-semibold">{scannedLot.harvest.lotNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Date de Récolte</div>
                    <div className="text-lg font-semibold">
                      {new Date(scannedLot.harvest.harvestDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Quantité</div>
                    <div className="text-lg font-semibold">{scannedLot.packaging.netWeight} kg</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Statut</div>
                    <div className="text-lg font-semibold capitalize">
                      {scannedLot.delivery.actualDeliveryDate ? 'Livré' : 'En cours'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-center text-muted-foreground">
                <Search className="h-8 w-8 mb-2" />
                <p>Scannez un code ou effectuez une recherche pour voir les résultats</p>
              </div>
            )}
          </CardContent>
          {scannedLot && (
            <CardFooter className="flex justify-end gap-2 p-6 pt-0">
              <Button variant="outline" onClick={showPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Voir PDF
              </Button>
              <Button onClick={viewLotDetails}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Voir Détails
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      {/* Download Confirmation Dialog */}
      {showDownloadConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Télécharger le PDF</CardTitle>
              <CardDescription>
                Voulez-vous télécharger le rapport PDF pour le lot {lotId} ?
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDownloadConfirm(false)}>
                Annuler
              </Button>
              <Button onClick={handleDownloadPDF} disabled={isDownloading}>
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Téléchargement...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* PDF Preview Modal */}
      {showPdfPreview && scannedLot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl h-[80vh]">
            <CardHeader>
              <CardTitle>Aperçu PDF - Lot {scannedLot?.harvest.lotNumber}</CardTitle>
            </CardHeader>
            <CardContent className="h-full">
              <PDFViewer 
                lotId={scannedLot?.harvest.lotNumber || ''} 
                onClose={() => setShowPdfPreview(false)}
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleDownloadClick}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
              <Button variant="outline" onClick={() => setShowPdfPreview(false)}>
                Fermer
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {isDownloading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <p className="text-lg font-medium">Generating PDF...</p>
          </div>
        </div>
      )}
    </div>
  );
}
