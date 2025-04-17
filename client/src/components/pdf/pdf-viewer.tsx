import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, X, Printer, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PDFViewerProps {
  lotId: string;
  onClose: () => void;
}

export default function PDFViewer({ lotId, onClose }: PDFViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Fetch PDF data using the mock API
  const { data: pdfUrl, isLoading, isError } = useQuery({
    queryKey: ['pdf', lotId],
    queryFn: async () => {
      // Check if lotId is valid
      if (!lotId) {
        throw new Error("Lot ID is required for PDF generation");
      }
      const blob = await apiRequest<Blob>('GET', `/pdf/${lotId}`);
      return URL.createObjectURL(blob);
    },
    enabled: !!lotId, // Only run the query if lotId is truthy
  });
  
  // Handle print
  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
    }
  };
  
  // Handle download
  const handleDownload = () => {
    if (pdfUrl) {
      setIsDownloading(true);
      
      try {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `lot-${lotId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Erreur lors du téléchargement:", error);
      }
      
      setIsDownloading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-neutral-900 bg-opacity-75 flex items-center justify-center z-50">
      <Card className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-bold">Aperçu du Rapport PDF</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-neutral-500">Génération du PDF en cours...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-neutral-700 font-medium mb-2">Erreur lors de la génération du PDF</p>
              <p className="text-neutral-500">Veuillez réessayer ultérieurement</p>
            </div>
          ) : pdfUrl ? (
            <div>
              <div className="border rounded p-1 bg-neutral-50 mb-4">
                <iframe
                  src={pdfUrl}
                  className="w-full h-[60vh]"
                  title="PDF Preview"
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Fermer
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center"
                  onClick={handlePrint}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimer
                </Button>
                <Button
                  className="flex items-center bg-blue-500 hover:bg-blue-600"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Télécharger
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-500">Aucun aperçu disponible</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
