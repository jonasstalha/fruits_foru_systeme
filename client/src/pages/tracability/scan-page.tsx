import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import BarcodeScanner from "@/components/scan/barcode-scanner";
import PDFViewer from "@/components/pdf/pdf-viewer";
import { AvocadoTracking } from "@shared/schema";
import { Loader2, QrCode, Search, Camera, X, FileText, ExternalLink, Download, Share2, Copy } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from '../../lib/queryClient';

// Simple QR code component that doesn't rely on Firebase
const SimpleQRCode = ({ value, size = 200 }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: `url(https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}) center/cover`,
        border: '1px solid #ddd',
        borderRadius: '4px'
      }}
    />
  );
};

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
  // New states for QR code functionality
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [generatedQRData, setGeneratedQRData] = useState<string>("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrType, setQrType] = useState<'view' | 'download'>('download');

  // Helper function to safely get trimmed lot number
  const getTrimmedLotNumber = (lot?: string) => {
    return (lot || lotNumber || "").toString().trim();
  };

  // Generate unique QR data for the lot
  const generateQRData = (lot: AvocadoTracking, type: 'view' | 'download' = 'download') => {
    const baseUrl = window.location.origin;

    if (type === 'download') {
      // Create a direct download URL with a data attribute that will be recognized by the scanner
      // Use a special format that will be detected by handleBarcodeDetected
      return `${baseUrl}/direct-download:${lot.harvest.lotNumber}`;
    } else {
      // View lot details URL
      return `${baseUrl}/lots/${lot.harvest.lotNumber}`;
    }
  };

  // Handle direct download from URL or hash
  useEffect(() => {
    const handleDirectDownload = async () => {
      // Check URL hash for direct download instructions
      const hash = window.location.hash;
      const currentPath = window.location.pathname;
      let lotIdFromUrl = null;
      
      // Check for direct-download in hash (for compatibility with QR scanners that modify URLs)
      if (hash && hash.includes('direct-download:')) {
        lotIdFromUrl = hash.split('direct-download:')[1];
      } 
      // Check URL path for direct-download format
      else if (currentPath.includes('/direct-download:')) {
        lotIdFromUrl = currentPath.split('/direct-download:')[1];
      }
      
      if (lotIdFromUrl) {
        try {
          setIsDownloading(true);
          toast({
            title: "Téléchargement automatique",
            description: `Téléchargement du PDF pour le lot ${lotIdFromUrl}`,
          });

          // Direct PDF download
          const pdfBlob = await apiRequest<Blob>('GET', `/pdf/${lotIdFromUrl}`);
          if (pdfBlob) {
            downloadPDFBlob(pdfBlob, lotIdFromUrl);
            // Redirect to home or lots page after download to clean up URL
            setTimeout(() => {
              setLocation('/scan');
            }, 1000);
          }
        } catch (error) {
          console.error("Error auto-downloading PDF:", error);
          toast({
            title: "Erreur de téléchargement",
            description: "Impossible de télécharger le PDF automatiquement.",
            variant: "destructive",
          });
        } finally {
          setIsDownloading(false);
        }
      }
    };

    handleDirectDownload();
    
    // Also listen for hash changes (some QR scanners modify the hash instead of the path)
    const handleHashChange = () => handleDirectDownload();
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Helper function to download PDF blob
  const downloadPDFBlob = (blob: Blob, lotNumber: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lot-${lotNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Handle QR code generation - Fixed version
  const handleGenerateQR = (type: 'view' | 'download' = 'download') => {
    if (!scannedLot) {
      toast({
        title: "Erreur",
        description: "Aucun lot sélectionné pour générer le QR code",
        variant: "destructive",
      });
      return;
    }

    try {
      const qrData = generateQRData(scannedLot, type);
      setGeneratedQRData(qrData);
      setQrType(type);
      setShowQRModal(true);

      toast({
        title: "QR Code généré",
        description: `QR Code ${type === 'download' ? 'de téléchargement' : 'de consultation'} créé pour le lot ${scannedLot.harvest.lotNumber}`,
      });
    } catch (error) {
      console.error('Error generating QR:', error);
      toast({
        title: "Erreur QR Code",
        description: "Impossible de générer le QR Code. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  // Handle QR code sharing
  const handleShareQR = async () => {
    if (!scannedLot) return;

    const shareData = {
      title: `Lot d'Avocat ${scannedLot.harvest.lotNumber}`,
      text: `Informations de traçabilité pour le lot ${scannedLot.harvest.lotNumber}`,
      url: generatedQRData || `${window.location.origin}/lots/${scannedLot.harvest.lotNumber}`
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast({
          title: "Partagé avec succès",
          description: "Le lien du lot a été partagé",
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Lien copié",
          description: "Le lien du lot a été copié dans le presse-papiers",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Erreur de partage",
        description: "Impossible de partager le lien",
        variant: "destructive",
      });
    }
  };

  // Copy QR data to clipboard
  const handleCopyQRData = async () => {
    try {
      await navigator.clipboard.writeText(generatedQRData);
      toast({
        title: "Lien copié",
        description: "Le lien du QR code a été copié dans le presse-papiers",
      });
    } catch (error) {
      toast({
        title: "Erreur de copie",
        description: "Impossible de copier le lien",
        variant: "destructive",
      });
    }
  };

  // Handle PDF download - Fixed version
  const handleDownloadPDF = async () => {
    if (!scannedLot || !scannedLot.harvest.lotNumber) {
      toast({
        title: "Erreur",
        description: "Aucun lot sélectionné pour télécharger le PDF",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    try {
      const lotNumber = scannedLot.harvest.lotNumber;

      // Make direct API call to get PDF
      const pdfBlob = await apiRequest<Blob>('GET', `/pdf/${lotNumber}`);

      if (pdfBlob) {
        downloadPDFBlob(pdfBlob, lotNumber);
        toast({
          title: "PDF téléchargé",
          description: `Le PDF du lot ${lotNumber} a été téléchargé avec succès`,
        });
      } else {
        throw new Error("PDF data is empty");
      }
    } catch (error) {
      console.error("PDF download error:", error);
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

  // Handle barcode detection - Updated version for direct downloads
  const handleBarcodeDetected = async (code: string) => {
    setIsLoading(true);
    try {
      console.log("Scanned code:", code);

      // Check if the scanned code is a direct download URL
      if (code.includes('/direct-download:')) {
        // Extract lot ID from the special format
        const lotIdFromUrl = code.split('/direct-download:')[1];

        if (lotIdFromUrl) {
          toast({
            title: "Téléchargement du PDF",
            description: `Téléchargement du PDF pour le lot ${lotIdFromUrl}`,
          });

          // Trigger immediate PDF download
          const pdfResult = await apiRequest<Blob>('GET', `/pdf/${lotIdFromUrl}`);
          if (pdfResult) {
            downloadPDFBlob(pdfResult, lotIdFromUrl);
          }
        }
      } else if (code.includes('/lots/')) {
        // Handle lot view URL
        const urlObj = new URL(code);
        const pathParts = urlObj.pathname.split('/');
        const lotIdFromUrl = pathParts[pathParts.length - 1];

        if (lotIdFromUrl) {
          setLotNumber(lotIdFromUrl);
          await handleLookupLot(lotIdFromUrl);
        }
      } else {
        // Handle regular lot number scan
        setLotNumber(code);
        await handleLookupLot(code);
      }

      setShowScanner(false);
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

  // Handle manual lookup - Fixed version with direct API calls
  const handleLookupLot = async (manualLotNumber?: string) => {
    const lotToLookup = getTrimmedLotNumber(manualLotNumber);

    if (!lotToLookup) {
      toast({
        title: "Numéro de lot requis",
        description: "Veuillez entrer un numéro de lot pour la recherche",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Update lotNumber state if using manual input
      if (manualLotNumber) {
        setLotNumber(manualLotNumber);
      }

      // Make direct API request to find the lot
      const result = await apiRequest<AvocadoTracking>('GET', `/api/avocado-tracking/${lotToLookup}`);

      if (result) {
        setScannedLot(result);
        setLotId(result.harvest.lotNumber);

        toast({
          title: "Lot trouvé",
          description: `Lot ${result.harvest.lotNumber} trouvé avec succès`,
        });
      } else {
        throw new Error("Lot non trouvé");
      }
    } catch (err) {
      console.error("Lookup error:", err);
      setScannedLot(null);
      setLotId(null);

      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";

      toast({
        title: "Lot non trouvé",
        description: `Le lot ${lotToLookup} n'existe pas dans la base de données. ${errorMessage}`,
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

  // Safe check for lot number validity
  const isValidLotNumber = () => {
    const trimmed = getTrimmedLotNumber();
    return trimmed.length > 0;
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
            <div className="flex gap-2">
              <Input
                value={lotNumber || ""}
                onChange={(e) => setLotNumber(e.target.value || "")}
                placeholder="Entrez le numéro de lot"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isValidLotNumber()) {
                    handleLookupLot();
                  }
                }}
              />
              <Button
                onClick={() => handleLookupLot()}
                disabled={isLoading || !isValidLotNumber()}
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
              <Button variant="outline" onClick={() => handleGenerateQR('view')}>
                <QrCode className="h-4 w-4 mr-2" />
                QR Consultation
              </Button>
              <Button variant="outline" onClick={() => handleGenerateQR('download')}>
                <Download className="h-4 w-4 mr-2" />
                QR Téléchargement
              </Button>
              <Button variant="outline" onClick={handleShareQR}>
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </Button>
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

      {/* QR Code Modal */}
      {showQRModal && scannedLot && generatedQRData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code - Lot {scannedLot.harvest.lotNumber}
              </CardTitle>
              <CardDescription>
                {qrType === 'download'
                  ? 'QR Code de téléchargement PDF pour ce lot'
                  : 'QR Code de consultation pour ce lot'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg border">
                  <SimpleQRCode
                    value={generatedQRData}
                    size={200}
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {qrType === 'download'
                      ? 'Scannez ce code pour télécharger automatiquement le PDF'
                      : 'Scannez ce code pour accéder aux informations du lot'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground break-all px-2">
                    {generatedQRData}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleCopyQRData}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copier Lien
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleShareQR}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Partager
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowQRModal(false)}>
                Fermer
              </Button>
              <Button onClick={handleDownloadClick} disabled={isDownloading}>
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Téléchargement...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger PDF
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Download Confirmation Dialog */}
      {showDownloadConfirm && scannedLot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Télécharger le PDF</CardTitle>
              <CardDescription>
                Voulez-vous télécharger le rapport PDF pour le lot {scannedLot.harvest.lotNumber} ?
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl h-[80vh]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Aperçu PDF - Lot {scannedLot.harvest.lotNumber}</span>
                <Button variant="outline" size="sm" onClick={() => setShowPdfPreview(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full overflow-auto">
              <PDFViewer
                lotId={scannedLot.harvest.lotNumber}
                lotData={scannedLot}
                onClose={() => setShowPdfPreview(false)}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Global Loading Overlay */}
      {isDownloading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-lg font-medium">Génération du PDF...</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}