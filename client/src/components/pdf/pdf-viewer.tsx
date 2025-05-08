import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, X, Printer, Download, FileText, Calendar, MapPin, User, Truck, Thermometer, Package, Box, Truck as DeliveryTruck } from "lucide-react";
import { jsPDF } from 'jspdf';
import { AvocadoTracking } from '@shared/schema';

interface PDFViewerProps {
  lotId: string;
  lotData: AvocadoTracking;
  onClose: () => void;
}

function PDFViewer({ lotId, lotData, onClose }: PDFViewerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Generate PDF directly in the browser
  const generatePDF = () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      let y = 10;

      const addHeader = () => {
        doc.setFillColor(41, 128, 185); // Blue header
        doc.rect(0, 0, 210, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.text('Fruits For You - Lot Tracking Report', 105, 12, { align: 'center' });
      };

      const addFooter = (pageNumber: number) => {
        doc.setFillColor(41, 128, 185); // Blue footer
        doc.rect(0, 280, 210, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text(`Page ${pageNumber}`, 105, 290, { align: 'center' });
      };

      const addSectionTitle = (title: string) => {
        doc.setFillColor(236, 240, 241); // Light gray background
        doc.rect(0, y, 210, 10, 'F');
        doc.setTextColor(41, 128, 185);
        doc.setFontSize(14);
        doc.text(title, 10, y + 7);
        y += 15;
      };

      const addText = (label: string, value: string, x: number = 10) => {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text(`${label}: ${value}`, x, y);
        y += 7;
      };

      const checkPageOverflow = () => {
        if (y > 270) {
          addFooter(pageNumber);
          doc.addPage();
          pageNumber++;
          addHeader();
          y = 20;
        }
      };

      let pageNumber = 1;
      addHeader();

      // Harvest Information
      addSectionTitle('Harvest Information');
      addText('Lot Number', lotData.harvest.lotNumber);
      addText('Date', new Date(lotData.harvest.harvestDate).toLocaleDateString());
      addText('Location', lotData.harvest.farmLocation);
      addText('Farmer ID', lotData.harvest.farmerId);
      addText('Variety', lotData.harvest.variety);
      checkPageOverflow();

      // Transport Information
      addSectionTitle('Transport Information');
      addText('Company', lotData.transport.transportCompany);
      addText('Driver', lotData.transport.driverName);
      addText('Vehicle ID', lotData.transport.vehicleId);
      addText('Temperature', `${lotData.transport.temperature}°C`);
      addText('Departure', new Date(lotData.transport.departureDateTime).toLocaleString());
      addText('Arrival', new Date(lotData.transport.arrivalDateTime).toLocaleString());
      checkPageOverflow();

      // Quality Information
      addSectionTitle('Quality Information');
      addText('Grade', lotData.sorting.qualityGrade);
      addText('Rejected Count', lotData.sorting.rejectedCount.toString());
      addText('Notes', lotData.sorting.notes || 'N/A');
      checkPageOverflow();

      // Packaging Information
      addSectionTitle('Packaging Information');
      addText('Box ID', lotData.packaging.boxId);
      addText('Net Weight', `${lotData.packaging.netWeight} kg`);
      addText('Count', lotData.packaging.avocadoCount.toString());
      addText('Type', lotData.packaging.boxType);
      checkPageOverflow();

      // Delivery Information
      addSectionTitle('Delivery Information');
      addText('Client', lotData.delivery.clientName);
      addText('Location', lotData.delivery.clientLocation);
      addText('Status', lotData.delivery.actualDeliveryDate ? 'Delivered' : 'Pending');
      addText('Notes', lotData.delivery.notes || 'N/A');
      checkPageOverflow();

      // Add final footer
      addFooter(pageNumber);

      // Save the PDF
      doc.save(`lot-${lotId}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle print
  const handlePrint = () => {
    const doc = new jsPDF();
    // ... (same PDF generation code as above)
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };
  
  return (
    <div className="fixed inset-0 bg-neutral-900 bg-opacity-75 flex items-center justify-center z-50">
      <Card className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
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
          <div className="space-y-6">
            {/* Harvest Information */}
            <div className="border rounded-lg p-4 bg-neutral-50">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-lg">Harvest Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-500">Lot Number</p>
                  <p className="font-medium">{lotData.harvest.lotNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Date</p>
                  <p className="font-medium">{new Date(lotData.harvest.harvestDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Location</p>
                  <p className="font-medium">{lotData.harvest.farmLocation}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Farmer ID</p>
                  <p className="font-medium">{lotData.harvest.farmerId}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Variety</p>
                  <p className="font-medium">{lotData.harvest.variety}</p>
                </div>
              </div>
            </div>

            {/* Transport Information */}
            <div className="border rounded-lg p-4 bg-neutral-50">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold text-lg">Transport Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-500">Company</p>
                  <p className="font-medium">{lotData.transport.transportCompany}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Driver</p>
                  <p className="font-medium">{lotData.transport.driverName}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Vehicle ID</p>
                  <p className="font-medium">{lotData.transport.vehicleId}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Temperature</p>
                  <p className="font-medium">{lotData.transport.temperature}°C</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Departure</p>
                  <p className="font-medium">{new Date(lotData.transport.departureDateTime).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Arrival</p>
                  <p className="font-medium">{new Date(lotData.transport.arrivalDateTime).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Quality Information */}
            <div className="border rounded-lg p-4 bg-neutral-50">
              <div className="flex items-center gap-2 mb-3">
                <Thermometer className="h-5 w-5 text-orange-500" />
                <h3 className="font-semibold text-lg">Quality Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-500">Grade</p>
                  <p className="font-medium">{lotData.sorting.qualityGrade}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Rejected Count</p>
                  <p className="font-medium">{lotData.sorting.rejectedCount}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-neutral-500">Notes</p>
                  <p className="font-medium">{lotData.sorting.notes || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Packaging Information */}
            <div className="border rounded-lg p-4 bg-neutral-50">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold text-lg">Packaging Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-500">Box ID</p>
                  <p className="font-medium">{lotData.packaging.boxId}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Net Weight</p>
                  <p className="font-medium">{lotData.packaging.netWeight} kg</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Count</p>
                  <p className="font-medium">{lotData.packaging.avocadoCount}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Type</p>
                  <p className="font-medium">{lotData.packaging.boxType}</p>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="border rounded-lg p-4 bg-neutral-50">
              <div className="flex items-center gap-2 mb-3">
                <DeliveryTruck className="h-5 w-5 text-red-500" />
                <h3 className="font-semibold text-lg">Delivery Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-500">Client</p>
                  <p className="font-medium">{lotData.delivery.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Location</p>
                  <p className="font-medium">{lotData.delivery.clientLocation}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Status</p>
                  <p className="font-medium">{lotData.delivery.actualDeliveryDate ? 'Delivered' : 'Pending'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-neutral-500">Notes</p>
                  <p className="font-medium">{lotData.delivery.notes || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
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
                onClick={generatePDF}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Télécharger PDF
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default PDFViewer;
export { PDFViewer };
