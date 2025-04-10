import bwipjs from 'bwip-js';
import { Lot } from '@shared/schema';

/**
 * Generate a barcode image for a lot
 * 
 * @param lot The lot to generate a barcode for
 * @returns Base64 string of the barcode image
 */
export async function generateBarcodeImage(lot: Lot): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Generate a CODE128 barcode
      const png = bwipjs.toBuffer({
        bcid: 'code128',
        text: lot.lotNumber,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center',
      });
      
      // Convert to base64
      const base64 = 'data:image/png;base64,' + png.toString('base64');
      resolve(base64);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate barcode data object with all necessary fields for display
 */
export async function generateBarcodeData(lot: Lot, farmName: string): Promise<{
  barcodeImage: string;
  lotNumber: string;
  farmName: string;
  harvestDate: string;
}> {
  const barcodeImage = await generateBarcodeImage(lot);
  const harvestDate = new Date(lot.harvestDate).toLocaleDateString('fr-FR');
  
  return {
    barcodeImage,
    lotNumber: lot.lotNumber,
    farmName,
    harvestDate,
  };
}
