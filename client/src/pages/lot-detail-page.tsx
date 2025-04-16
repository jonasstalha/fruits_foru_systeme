import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, FileText, Printer, History } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import LotDetails from "@/components/lot/lot-details";
import BarcodeDisplay from "@/components/lot/barcode-display";
import ProgressTracker from "@/components/lot/progress-tracker";
import PDFViewer from "@/components/pdf/pdf-viewer";
import { Lot, Farm, LotActivity } from "@shared/schema";

export default function LotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  
  // Fetch lot details
  const { 
    data: lot, 
    isLoading: lotLoading,
    isError: lotError 
  } = useQuery<Lot>({
    queryKey: [`/api/lots/${id}`],
  });
  
  // Fetch farm details
  const { 
    data: farm, 
    isLoading: farmLoading 
  } = useQuery<Farm>({
    queryKey: [`/api/farms/${lot?.farmId}`],
    enabled: !!lot?.farmId, // Only fetch if we have a farmId
  });
  
  // Fetch lot activities
  const { 
    data: activities, 
    isLoading: activitiesLoading 
  } = useQuery<LotActivity[]>({
    queryKey: [`/api/lots/${id}/activities`],
    enabled: !!id,
  });
  
  // Fetch barcode data
  const { 
    data: barcodeData, 
    isLoading: barcodeLoading 
  } = useQuery({
    queryKey: [`/api/lots/${id}/barcode`],
    enabled: !!id,
  });
  
  // If there's an error fetching the lot, go back to the dashboard
  useEffect(() => {
    if (lotError) {
      setTimeout(() => navigate("/"), 3000);
    }
  }, [lotError, navigate]);
  
  // Check if everything is still loading
  const isLoading = lotLoading || farmLoading || activitiesLoading;
  
  // Handle PDF preview
  const handleShowPdf = () => {
    setShowPdfPreview(true);
  };
  
  // Go back to previous page
  const handleGoBack = () => {
    navigate("/");
  };
  
  // Handle print barcode label
  const handlePrintBarcode = () => {
    window.print();
  };
  
  if (lotError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-bold mb-2">Lot non trouvé</h2>
              <p className="text-neutral-500 mb-6">Le lot que vous recherchez n'existe pas ou a été supprimé.</p>
              <p className="text-sm text-neutral-400">Redirection vers le tableau de bord...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      <main className="flex-grow">
        <TopBar title="Détails du Lot" subtitle="Informations complètes sur ce lot" />
        
        <div className="p-4 md:p-6">
          {/* Back button */}
          <Button
            variant="ghost"
            className="mb-4"
            onClick={handleGoBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-neutral-500">Chargement des données du lot...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lot Info Card */}
              <Card>
                <CardHeader className="border-b px-6 py-4">
                  <CardTitle>Détails du Lot</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {lot && farm && (
                    <>
                      <LotDetails lot={lot} farm={farm} />
                      
                      <Separator className="my-6" />
                      
                      {activities && activities.length > 0 && (
                        <ProgressTracker activities={activities} />
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-6">
                        <Button
                          className="bg-primary-500 text-white flex items-center"
                          onClick={handleShowPdf}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Rapport PDF
                        </Button>
                        <Button
                          variant="outline"
                          className="flex items-center"
                          onClick={handlePrintBarcode}
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          Imprimer Étiquette
                        </Button>
                        <Button
                          variant="outline"
                          className="text-blue-500 border-blue-500 flex items-center"
                        >
                          <History className="mr-2 h-4 w-4" />
                          Historique
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              {/* Barcode Card */}
              <Card>
                <CardHeader className="border-b px-6 py-4">
                  <CardTitle>Code-barres</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {barcodeLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                      <p className="text-sm text-neutral-500">Génération du code-barres...</p>
                    </div>
                  ) : barcodeData ? (
                    <BarcodeDisplay 
                      barcodeData={barcodeData}
                      lot={lot!}
                      farmName={farm?.name || ''}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-neutral-500">Impossible de générer le code-barres</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      
      {/* PDF Preview Modal */}
      {showPdfPreview && (
        <PDFViewer 
          lotId={parseInt(id)}
          onClose={() => setShowPdfPreview(false)}
        />
      )}
    </div>
  );
}
