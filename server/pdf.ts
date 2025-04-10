import PDFDocument from 'pdfkit';
import { Lot, LotActivity, Farm } from '@shared/schema';
import { generateBarcodeImage } from './barcode';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Generate a PDF report for a lot, including all its activities
 * 
 * @param lot The lot to generate a report for
 * @param farm The farm that produced the lot
 * @param activities The activities that have been performed on the lot
 * @returns Buffer containing the PDF data
 */
export async function generateLotReport(
  lot: Lot,
  farm: Farm,
  activities: LotActivity[]
): Promise<Buffer> {
  return new Promise(async (resolve) => {
    // Create a new PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true
    });
    
    // Collect the PDF data chunks
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    
    // Generate the barcode image
    const barcodeImage = await generateBarcodeImage(lot);
    const barcodeBuffer = Buffer.from(
      barcodeImage.replace('data:image/png;base64,', ''),
      'base64'
    );
    
    // Format dates
    const harvestDate = format(new Date(lot.harvestDate), 'dd/MM/yyyy', { locale: fr });
    const generatedDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });
    
    // PDF Header
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('Convo Bio', { align: 'left' })
      .fontSize(12)
      .font('Helvetica')
      .text('Traçabilité d\'Avocat', { align: 'left' });
    
    doc
      .moveUp(2)
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('RAPPORT DE TRAÇABILITÉ', { align: 'right' })
      .fontSize(10)
      .font('Helvetica')
      .text(`Généré le: ${generatedDate}`, { align: 'right' });
    
    // Barcode
    doc
      .moveDown(2)
      .image(barcodeBuffer, {
        fit: [300, 100],
        align: 'center'
      });
    
    doc
      .moveDown(0.5)
      .fontSize(14)
      .font('Courier-Bold')
      .text(lot.lotNumber, { align: 'center' });
    
    // Lot Information
    doc
      .moveDown(2)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('INFORMATION DU LOT')
      .moveDown(0.5);
    
    // Create a 2-column grid for lot info
    const startX = doc.x;
    const colWidth = (doc.page.width - 100) / 2;
    
    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Ferme:', startX, doc.y)
      .font('Helvetica-Bold')
      .text(farm.name, startX, doc.y + 14);
    
    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Code Ferme:', startX + colWidth, doc.y - 14)
      .font('Helvetica-Bold')
      .text(farm.code, startX + colWidth, doc.y - 0);
    
    doc
      .moveDown(2)
      .fontSize(10)
      .font('Helvetica')
      .text('Date Récolte:', startX, doc.y)
      .font('Helvetica-Bold')
      .text(harvestDate, startX, doc.y + 14);
    
    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Quantité:', startX + colWidth, doc.y - 14)
      .font('Helvetica-Bold')
      .text(`${lot.initialQuantity} kg`, startX + colWidth, doc.y - 0);
    
    // Timeline of Activities
    doc
      .moveDown(2)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('CHRONOLOGIE DE TRAÇABILITÉ')
      .moveDown(0.5);
    
    // Table header
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Étape', startX, doc.y, { width: 100 })
      .text('Date', startX + 100, doc.y - 12, { width: 150 })
      .text('Opérateur', startX + 250, doc.y - 12, { width: 100 })
      .text('Notes', startX + 350, doc.y - 12);
    
    doc.moveDown(0.5);
    
    // Table rows for activities
    const activityTypes: Record<string, string> = {
      'harvest': 'Récolté',
      'package': 'Emballé',
      'cool': 'Refroidi',
      'ship': 'Expédié',
      'deliver': 'Livré'
    };
    
    activities.forEach((activity) => {
      const activityDate = format(
        new Date(activity.datePerformed),
        'dd/MM/yyyy HH:mm',
        { locale: fr }
      );
      
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(activityTypes[activity.activityType] || activity.activityType, startX, doc.y, { width: 100 })
        .font('Helvetica')
        .text(activityDate, startX + 100, doc.y - 12, { width: 150 })
        .text(activity.operatorName, startX + 250, doc.y - 12, { width: 100 })
        .text(activity.notes || '', startX + 350, doc.y - 12);
      
      doc.moveDown(0.5);
    });
    
    // Signature areas
    doc
      .moveDown(2)
      .moveTo(startX, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke()
      .moveDown(1);
    
    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Signature Opérateur:', startX, doc.y, { width: colWidth })
      .text('Signature Réception:', startX + colWidth, doc.y - 12);
    
    // Signature boxes
    doc
      .rect(startX, doc.y + 5, colWidth - 20, 60)
      .stroke();
    
    doc
      .rect(startX + colWidth, doc.y + 5, colWidth - 20, 60)
      .stroke();
    
    // Add names below signature boxes
    const lastActivity = activities[activities.length - 1];
    doc
      .moveDown(4.5)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(lastActivity?.operatorName || '', startX, doc.y, { width: colWidth, align: 'center' })
      .text('Client', startX + colWidth, doc.y - 12, { width: colWidth - 20, align: 'center' });
    
    // Footer
    doc
      .moveDown(2)
      .moveTo(startX, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke()
      .moveDown(1);
    
    doc
      .fontSize(8)
      .font('Helvetica')
      .text('Ce document est généré électroniquement et certifié conforme aux normes Convo Bio.', { align: 'center' })
      .text('Pour vérifier l\'authenticité, scanner le code-barres ou visiter www.convobio.com/verify', { align: 'center' });
    
    // Finalize the PDF
    doc.end();
  });
}
