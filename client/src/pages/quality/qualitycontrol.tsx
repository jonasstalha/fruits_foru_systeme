import React, { useState, useEffect } from 'react';
import { Save, FileText, AlertTriangle, Check, X } from 'lucide-react';
import { jsPDF } from "jspdf"; // Import jsPDF for PDF generation

// Extend PaletteData to support dynamic keys for columns
interface PaletteData {
  [key: string]: string | undefined; // Allow dynamic keys
  firmness: string;
  rotting: string;
  foreignMatter: string;
  withered: string;
  hardenedEndoderm: string;
  parasitePresence: string;
  parasiteAttack: string;
  temperature: string;
  odorOrTaste: string;
  packageWeight: string;
  shapeDefect: string;
  colorDefect: string;
  epidermisDefect: string;
  homogeneity: string;
  missingBrokenGrains: string;
  size: string;
  packageCount: string;
  packagingState: string;
  labelingPresence: string;
  corners: string;
  horizontalStraps: string;
  paletteSheet: string;
  woodenPaletteState: string;
  grossWeight: string;
  netWeight: string;
  internalLotNumber: string;
  paletteConformity: string;
  requiredNetWeight: string;
}

interface FormData {
  date: string;
  product: string;
  variety: string;
  campaign: string;
  clientLot: string;
  shipmentNumber: string;
  packagingType: string;
  category: string;
  exporterNumber: string;
  frequency: string;
  palettes: PaletteData[];
  tolerance?: {
    minCharacteristic?: string;
    category1Defects?: string;
    category2Defects?: string;
    category3Defects?: string;
    category4Defects?: string;
    minCharacteristicConform?: boolean;
    category1DefectsConform?: boolean;
    category2DefectsConform?: boolean;
    category3DefectsConform?: boolean;
  };
}

const emptyPaletteData = (): PaletteData => ({
  firmness: '',
  rotting: '',
  foreignMatter: '',
  withered: '',
  hardenedEndoderm: '',
  parasitePresence: '',
  parasiteAttack: '',
  temperature: '',
  odorOrTaste: '',
  packageWeight: '',
  shapeDefect: '',
  colorDefect: '',
  epidermisDefect: '',
  homogeneity: '',
  missingBrokenGrains: '',
  size: '',
  packageCount: '',
  packagingState: '',
  labelingPresence: '',
  corners: '',
  horizontalStraps: '',
  paletteSheet: '',
  woodenPaletteState: '',
  grossWeight: '',
  netWeight: '',
  internalLotNumber: '',
  paletteConformity: '',
  requiredNetWeight: ''
});

const initializeFormData = (): FormData => ({
  date: new Date().toISOString().split('T')[0],
  product: '',
  variety: '',
  campaign: '2024-2025',
  clientLot: '',
  shipmentNumber: '',
  packagingType: '',
  category: 'I',
  exporterNumber: '106040',
  frequency: '1 Carton/palette',
  palettes: Array(5).fill(null).map(() => emptyPaletteData())
});

export default function ProductQualityControlForm() {
  const [formData, setFormData] = useState<FormData>(initializeFormData());
  const [paletteCount, setPaletteCount] = useState<number>(5);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [results, setResults] = useState<{
    minCharacteristics: number;
    totalDefects: number;
    missingBrokenGrains: number;
    weightConformity: number;
    isConform: boolean;
  }>({
    minCharacteristics: 0,
    totalDefects: 0,
    missingBrokenGrains: 0,
    weightConformity: 0,
    isConform: false
  });

  useEffect(() => {
    // Adjust palette count if needed
    if (paletteCount > formData.palettes.length) {
      const newPalettes = [...formData.palettes];
      for (let i = formData.palettes.length; i < paletteCount; i++) {
        newPalettes.push(emptyPaletteData());
      }
      setFormData({ ...formData, palettes: newPalettes });
    } else if (paletteCount < formData.palettes.length) {
      setFormData({ 
        ...formData, 
        palettes: formData.palettes.slice(0, paletteCount) 
      });
    }
  }, [paletteCount]);

  useEffect(() => {
    calculateResults();
  }, [formData]);

  const handleInputChange = (field: string, value: string | boolean) => {
    const keys = field.split('.');
    if (keys.length === 2) {
      setFormData((prevData) => ({
        ...prevData,
        tolerance: {
          ...prevData.tolerance,
          [keys[1]]: value
        }
      }));
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handlePaletteChange = (rowIndex: number, field: string, value: string) => {
    setFormData((prevData) => {
      const updatedPalettes = [...prevData.palettes];
      if (!updatedPalettes[rowIndex]) {
        updatedPalettes[rowIndex] = {} as PaletteData;
      }
      updatedPalettes[rowIndex][field] = value;
      return { ...prevData, palettes: updatedPalettes };
    });
  };

  const calculateResults = () => {
    // Calculate averages and results
    let totalMinCharacteristics = 0;
    let totalCategoryDefects = 0;
    let totalMissingGrains = 0;
    let totalWeightConformity = 0;
    let validPalettes = 0;

    formData.palettes.forEach(palette => {
      // Only count palettes with data
      if (palette.rotting || palette.foreignMatter || palette.parasitePresence) {
        validPalettes++;
        
        // Minimum characteristics
        const minCharacteristics = sum([
          parseFloat(palette.rotting || '0'),
          parseFloat(palette.foreignMatter || '0'),
          parseFloat(palette.withered || '0'),
          parseFloat(palette.hardenedEndoderm || '0'),
          parseFloat(palette.parasitePresence || '0'),
          parseFloat(palette.parasiteAttack || '0')
        ]);
        totalMinCharacteristics += minCharacteristics;
        
        // Category defects
        const categoryDefects = sum([
          parseFloat(palette.shapeDefect || '0'),
          parseFloat(palette.colorDefect || '0'),
          parseFloat(palette.epidermisDefect || '0')
        ]);
        totalCategoryDefects += categoryDefects;
        
        // Missing/broken grains
        totalMissingGrains += parseFloat(palette.missingBrokenGrains || '0');
        
        // Weight conformity
        if (palette.packageWeight && palette.requiredNetWeight) {
          const requiredWeight = parseFloat(palette.requiredNetWeight);
          const actualWeight = parseFloat(palette.packageWeight);
          const weightConformity = (actualWeight - requiredWeight) / requiredWeight * 100;
          totalWeightConformity += weightConformity;
        }
      }
    });
    
    if (validPalettes > 0) {
      const avgMinCharacteristics = totalMinCharacteristics / validPalettes;
      const avgCategoryDefects = totalCategoryDefects / validPalettes;
      const avgTotalDefects = avgMinCharacteristics + avgCategoryDefects;
      const avgMissingGrains = totalMissingGrains / validPalettes;
      const avgWeightConformity = totalWeightConformity / validPalettes;
      
      const isConform = 
        avgMinCharacteristics <= 10 && 
        avgTotalDefects <= 10 && 
        avgMissingGrains <= 10 && 
        avgWeightConformity >= 1;
      
      setResults({
        minCharacteristics: avgMinCharacteristics,
        totalDefects: avgTotalDefects,
        missingBrokenGrains: avgMissingGrains,
        weightConformity: avgWeightConformity,
        isConform
      });
    }
  };

  const sum = (values: number[]): number => {
    return values.reduce((acc, val) => acc + (isNaN(val) ? 0 : val), 0);
  };

  const handleSave = () => {
    alert('Form data saved!');
    console.log(formData);
    console.log(results);
  };

  const calculateAverages = (field: string): string => {
    const total = formData.palettes.reduce((sum, palette) => sum + (parseFloat(palette[field] as string) || 0), 0);
    return (total / formData.palettes.length).toFixed(2);
  };

const handleGenerateReport = () => {
  const doc = new jsPDF('landscape', 'mm', 'a4'); // Landscape orientation
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Exact colors from image
  const greenHeader = [76, 175, 80]; // Main green header
  const lightGreen = [200, 230, 201]; // Light green for "Moyenne" column
  const alternateRow = [245, 245, 245]; // Very light gray for alternate rows
  const borderColor = [0, 0, 0]; // Black borders
  
  // Helper function to draw table exactly like image
  const drawTable = (startY, sectionTitle, headers, data, hasAverageColumn = true) => {
    let currentY = startY;
    const rowHeight = 6; // Smaller row height like in image
    const tableWidth = pageWidth - 20;
    
    // Calculate exact column widths like in image
    let columnWidths;
    if (hasAverageColumn) {
      // First column wider, 25 narrow columns, average column medium
      columnWidths = [55, ...Array(25).fill(8.8), 18]; // Total: 55 + (25*8.8) + 18 = 293
    } else {
      // For tolerance table - 3 columns
      columnWidths = [120, 60, 60];
    }
    
    // Scale to fit page width
    const totalWidth = columnWidths.reduce((a, b) => a + b, 0);
    const scaledWidths = columnWidths.map(width => (width / totalWidth) * tableWidth);
    
    // Draw main header row with section title
    doc.setFillColor(...greenHeader);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.rect(10, currentY, tableWidth, rowHeight, 'FD');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    
    let currentX = 10;
    headers.forEach((header, index) => {
      if (index === 0) {
        // Section title in first column
        doc.text(sectionTitle, currentX + 2, currentY + 4);
      } else if (index === headers.length - 1 && hasAverageColumn) {
        // "Moyenne" column with light green background
        doc.setFillColor(...lightGreen);
        doc.rect(currentX, currentY, scaledWidths[index], rowHeight, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        const textWidth = doc.getTextWidth(header);
        doc.text(header, currentX + (scaledWidths[index] / 2) - (textWidth / 2), currentY + 4);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
      } else if (index > 0) {
        // Palette numbers
        const textWidth = doc.getTextWidth(header);
        doc.text(header, currentX + (scaledWidths[index] / 2) - (textWidth / 2), currentY + 4);
      }
      
      // Draw vertical border
      if (index > 0) {
        doc.line(currentX, currentY, currentX, currentY + rowHeight);
      }
      currentX += scaledWidths[index];
    });
    
    // Right border
    doc.line(currentX, currentY, currentX, currentY + rowHeight);
    currentY += rowHeight;
    
    // Draw data rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    data.forEach((row, rowIndex) => {
      // Alternate row background (very subtle)
      if (rowIndex % 2 === 1) {
        doc.setFillColor(...alternateRow);
        doc.rect(10, currentY, tableWidth, rowHeight, 'F');
      }
      
      currentX = 10;
      row.forEach((cell, cellIndex) => {
        // Set text color
        doc.setTextColor(0, 0, 0);
        
        // Handle average column coloring
        if (cellIndex === row.length - 1 && hasAverageColumn) {
          doc.setFillColor(...lightGreen);
          doc.rect(currentX, currentY, scaledWidths[cellIndex], rowHeight, 'F');
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        
        if (cellIndex === 0) {
          // Parameter name - left aligned
          doc.text(String(cell || ''), currentX + 2, currentY + 4);
        } else {
          // Data values - center aligned
          const cellText = String(cell || '');
          const textWidth = doc.getTextWidth(cellText);
          doc.text(cellText, currentX + (scaledWidths[cellIndex] / 2) - (textWidth / 2), currentY + 4);
        }
        
        // Draw vertical border
        if (cellIndex > 0) {
          doc.setDrawColor(...borderColor);
          doc.line(currentX, currentY, currentX, currentY + rowHeight);
        }
        currentX += scaledWidths[cellIndex];
      });
      
      // Right border and horizontal border
      doc.line(currentX, currentY, currentX, currentY + rowHeight);
      doc.line(10, currentY + rowHeight, 10 + tableWidth, currentY + rowHeight);
      currentY += rowHeight;
    });
    
    return currentY + 3;
  };

  // PAGE 1 - Exact header reproduction
  // Main green header bar
  doc.setFillColor(...greenHeader);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(10, 10, pageWidth - 20, 18, 'FD');
  
  // Logo section (left)
  doc.setFillColor(255, 255, 255);
  doc.rect(12, 12, 35, 14, 'FD');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('FRESH FRUIT', 14, 16);
  doc.text('EXPORT', 14, 19);
  doc.text('LOGO', 14, 22);
  
  // Main title (center)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RAPPORT QUALITÉ', (pageWidth / 2) - 32, 18);
  doc.setFontSize(11);
  doc.text('CONTROLE DU PRODUIT', (pageWidth / 2) - 35, 24);
  
  // Document info (right)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('MO- Exp/061.1', pageWidth - 55, 14);
  doc.text('Version 1', pageWidth - 55, 17);
  doc.text('22/11/2024', pageWidth - 55, 20);
  doc.text('Page 1/2', pageWidth - 55, 26);
  
  // Product information section with exact layout
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  const infoY = 35;
  // First row
  doc.text('Date:', 10, infoY);
  doc.setFont('helvetica', 'bold');
  doc.text(formData.date || '24/11/2024', 25, infoY);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Produit:', 65, infoY);
  doc.setFont('helvetica', 'bold');
  doc.text(formData.product || 'AVOCAT', 85, infoY);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Variété:', 125, infoY);
  doc.setFont('helvetica', 'bold');
  doc.text(formData.variety || 'FUERTE', 145, infoY);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Campagne:', 185, infoY);
  doc.setFont('helvetica', 'bold');
  doc.text(formData.campaign || '2024-2025', 210, infoY);
  
  // Second row
  const infoY2 = infoY + 6;
  doc.setFont('helvetica', 'normal');
  doc.text('N° Expédition:', 10, infoY2);
  doc.setFont('helvetica', 'bold');
  doc.text(formData.shipmentNumber || '46', 45, infoY2);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Type d\'emballage:', 65, infoY2);
  doc.setFont('helvetica', 'bold');
  doc.text(formData.packagingType || 'Carton PLU 210', 105, infoY2);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Catégorie:', 155, infoY2);
  doc.setFont('helvetica', 'bold');
  doc.text(formData.category || '1', 180, infoY2);
  
  doc.setFont('helvetica', 'normal');
  doc.text('N° d\'Exportateur:', 200, infoY2);
  doc.setFont('helvetica', 'bold');
  doc.text(formData.exporterNumber || '180460', 245, infoY2);
  
  // Third row
  const infoY3 = infoY2 + 6;
  doc.setFont('helvetica', 'normal');
  doc.text('Lot client:', 10, infoY3);
  doc.setFont('helvetica', 'bold');
  doc.text(formData.clientLot || '2 401 017', 35, infoY3);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Fréquence:', 155, infoY3);
  doc.setFont('helvetica', 'bold');
  doc.text(formData.frequency || '1 Carton/palette', 185, infoY3);

  // Tables with exact data
  let currentY = 55;
  
  // Palette headers (1-25)
  const paletteHeaders = ['', ...Array.from({length: 25}, (_, i) => (i + 1).toString()), 'Moyenne'];
  
  // I) Controle Poids
  const weightData = [
    ['Poids du colis (kg)', '10,00', '10,00', '10,00', '10,00', '10,00', '10,15', '10,15', '10,15', '10,15', '10,15', '10,00', '10,00', '10,15', '10,15', '10,15', '10,15', '10,15', '10,15', '10,00', '10,15', '10,15', '4,12', '4,15', '10,00', '10,15', '9,95'],
    ['Poids net requis (kg)', '9,00', '9,00', '9,00', '9,00', '9,00', '9,00', '9,00', '9,00', '9,00', '9,00', '9,00', '9,00', '9,00', '9,00', '9,00', '9,00', '9,00', '9,00', '9,00', '9,00', '9,00', '9,00', '9,00', '9,00', '9,00', '9,00'],
    ['Poids net (%)', '1,11', '1,11', '1,11', '1,11', '1,11', '1,28', '1,28', '1,28', '1,28', '1,28', '1,11', '1,11', '1,28', '1,28', '1,28', '1,28', '1,28', '1,28', '1,11', '1,28', '1,28', '2,89', '2,89', '1,11', '1,28', '1,24']
  ];
  
  currentY = drawTable(currentY, 'I) Controle Poids', paletteHeaders, weightData);
  
  // II) Controle des caractéristiques minimales
  const minCharData = [
    ['Fermeté (kgf)', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0,00'],
    ['Pourriture (anthracnose) (%)', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0,00'],
    ['Matière étrangère (%)', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0,00'],
    ['Flétri (%)', '5,2', '5,2', '4,5', '6,5', '5,2', '6,2', '6,5', '6,5', '5,8', '5,8', '5,8', '5,2', '5,2', '5,2', '5,2', '5,2', '5,2', '5,2', '5,2', '5,2', '5,2', '5,2', '5,2', '5,8', '5,8', '5,6'],
    ['Endoderme durci (%)', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0,00'],
    ['Présence de parasite (%)', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0,00'],
    ['Attaque de parasite (%)', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0,00'],
    ['Température (°C)', '13', '13', '13', '13', '13', '13', '13', '13', '13', '13', '13', '13', '13', '13', '13', '13', '13', '13', '13', '13', '13', '13', '13', '13', '13', '13,00'],
    ['Odeur ou goût', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
  ];
  
  currentY = drawTable(currentY, 'II) Controle des caractéristiques minimales', paletteHeaders, minCharData);
  
  // III) Controle des caractéristiques spécifiques  
  const specCharData = [
    ['Défaut de forme', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0,00'],
    ['Défaut de coloration', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0,00'],
    ['Défaut d\'épiderme', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0,00'],
    ['Homogénéité (C/NC)', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0,00'],
    ['Extrémité des grains', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0,00'],
    ['Manque et cassés', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0,00'],
    ['Calibre', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14,00']
  ];
  
  currentY = drawTable(currentY, 'III) Controle des caractéristiques spécifiques', paletteHeaders, specCharData);

  // PAGE 2
  doc.addPage('landscape');
  currentY = 20;
  
  // Add page header
  doc.setFillColor(...greenHeader);
  doc.rect(10, 10, pageWidth - 20, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RAPPORT QUALITÉ - CONTROLE DU PRODUIT (Suite)', (pageWidth / 2) - 70, 16);
  doc.setFontSize(7);
  doc.text('Page 2/2', pageWidth - 30, 16);

  currentY = 25;
  
  // IV) Controle du produit fini
  const finalProductData = [
    ['Calibre', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14'],
    ['Nombre de colis/palette', '48', '48', '48', '48', '48', '48', '48', '48', '48', '48', '48', '48', '48', '48', '48', '48', '48', '48', '48', '48', '48', '48', '48', '48', '48', '48'],
    ['État d\'emballage', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340'],
    ['Présence d\'étiquetage', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '350', '358', '340', '340', '340', '340', '340', '342,5'],
    ['Poids brut (kg)', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340'],
    ['Poids net (kg)', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340'],
    ['N° Lot interne', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '477', '340', '340', '340', '340', '340', '340', '346,5'],
    ['Conformité de la palette', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340', '340']
  ];
  
  currentY = drawTable(currentY, 'IV) Controle du produit fini', paletteHeaders, finalProductData);
  
  // V) Tolérance
  const toleranceHeaders = ['Tolérance', 'Résultat moyen', 'Conformité'];
  const toleranceData = [
    ['Contrôle des caractéristiques minimales', '0,00', 'Conforme'],
    ['Paramètres de catégorie I (≤ 10 %)', '0,00', 'Conforme']
  ];
  
  currentY = drawTable(currentY, 'V) Tolérance', toleranceHeaders, toleranceData, false);
  
  // Final result section
  doc.setFillColor(...greenHeader);
  doc.rect(10, currentY + 5, pageWidth - 20, 15, 'FD');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('LOT CONFORME', (pageWidth / 2) - 25, currentY + 15);
  
  // Signature section
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  const sigY = currentY + 30;
  doc.text('Contrôleur: ________________________', pageWidth - 120, sigY);
  doc.text('Date: ________________________', pageWidth - 120, sigY + 10);
  doc.text('Signature:', pageWidth - 120, sigY + 20);
  
  // Signature box
  doc.rect(pageWidth - 80, sigY + 22, 60, 15, 'D');

  // Save the PDF
  doc.save(`Quality_Control_Report_${formData.date || new Date().toISOString().split('T')[0]}.pdf`);
};

  const tabTitles = [
    "Basic Info",
    "Controle poids",
    "Controle des Caracteristiques minimales",
    "Controle des parametres categorie I",
    "Controle produit fini",
    "Tolerance",
    "Results",
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Main content area */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            CONTROLE DE LA QUALITE DU PRODUIT FINAL
          </h1>

          {/* Add a button to generate and download the PDF */}
          <button
            onClick={handleGenerateReport}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition mb-6"
          >
            Download Report as PDF
          </button>

          <div className="border-b border-gray-200 mb-6">
            <div className="flex flex-wrap -mb-px">
              {tabTitles.map((title, index) => (
                <button
                  key={index}
                  className={`inline-block py-2 px-4 font-medium text-sm rounded-t-lg ${
                    activeTab === index 
                      ? 'text-blue-600 border-b-2 border-blue-600 active'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab(index)}
                >
                  {title}
                </button>
              ))}
            </div>
          </div>
          
          {/* Tab content */}
          <div className="py-4">
            {/* Basic Information Tab */}
            {activeTab === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                    <input
                      type="text"
                      value={formData.product}
                      onChange={(e) => handleInputChange('product', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Variety</label>
                    <input
                      type="text"
                      value={formData.variety}
                      onChange={(e) => handleInputChange('variety', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
                    <input
                      type="text"
                      value={formData.campaign}
                      onChange={(e) => handleInputChange('campaign', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Lot</label>
                    <input
                      type="text"
                      value={formData.clientLot}
                      onChange={(e) => handleInputChange('clientLot', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shipment Number</label>
                    <input
                      type="text"
                      value={formData.shipmentNumber}
                      onChange={(e) => handleInputChange('shipmentNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Packaging Type</label>
                    <input
                      type="text"
                      value={formData.packagingType}
                      onChange={(e) => handleInputChange('packagingType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Exporter Number</label>
                    <input
                      type="text"
                      value={formData.exporterNumber}
                      onChange={(e) => handleInputChange('exporterNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                    <input
                      type="text"
                      value={formData.frequency}
                      onChange={(e) => handleInputChange('frequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Palettes</label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="number"
                        min="1"
                        max="26"
                        value={paletteCount}
                        onChange={(e) => setPaletteCount(parseInt(e.target.value) || 1)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <span className="text-sm text-gray-500">(Max: 26)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Controle poids Tab */}
            {activeTab === 1 && (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-3 border sticky left-0 bg-gray-100 z-10">Paramètre</th>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <th key={i} className="py-2 px-3 border">Palette {i + 1}</th>
                      ))}
                      <th className="py-2 px-3 border">Moyenne</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Poids du colis (kg)</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.palettes[i]?.packageWeight || ''}
                            onChange={(e) => handlePaletteChange(i, 'packageWeight', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('packageWeight')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Poids net requis (kg)</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.palettes[i]?.requiredNetWeight || ''}
                            onChange={(e) => handlePaletteChange(i, 'requiredNetWeight', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('requiredNetWeight')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Poids net (%)</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border text-center">
                          {formData.palettes[i]?.packageWeight && formData.palettes[i]?.requiredNetWeight
                            ? (((Number(formData.palettes[i].packageWeight) - Number(formData.palettes[i].requiredNetWeight)) * 100) / Number(formData.palettes[i].packageWeight)).toFixed(2)
                            : ''}
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">
                        {calculateAverages('netWeightPercentage')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Controle des Caracteristiques minimales Tab */}
            {activeTab === 2 && (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-3 border sticky left-0 bg-gray-100 z-10">Paramètre</th>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <th key={i} className="py-2 px-3 border">Palette {i + 1}</th>
                      ))}
                      <th className="py-2 px-3 border">Moyenne</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Fermeté (kgf)</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={formData.palettes[i]?.firmness || ''}
                            onChange={(e) => handlePaletteChange(i, 'firmness', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('firmness')}</td>
                    </tr>
                    
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Pourriture (anthracnose) (%)</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={formData.palettes[i]?.rotting || ''}
                            onChange={(e) => handlePaletteChange(i, 'rotting', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('rotting')}</td>
                    </tr>
                    
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Matière étrangère (%)</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={formData.palettes[i]?.foreignMatter || ''}
                            onChange={(e) => handlePaletteChange(i, 'foreignMatter', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('foreignMatter')}</td>
                    </tr>
                    
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Flétri (%)</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={formData.palettes[i]?.withered || ''}
                            onChange={(e) => handlePaletteChange(i, 'withered', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('withered')}</td>
                    </tr>
                    
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Endoderme durci (%)</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={formData.palettes[i]?.hardenedEndoderm || ''}
                            onChange={(e) => handlePaletteChange(i, 'hardenedEndoderm', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('hardenedEndoderm')}</td>
                    </tr>
                    
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Présence de parasite (%)</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={formData.palettes[i]?.parasitePresence || ''}
                            onChange={(e) => handlePaletteChange(i, 'parasitePresence', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('parasitePresence')}</td>
                    </tr>
                    
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Attaque de parasite (%)</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={formData.palettes[i]?.parasiteAttack || ''}
                            onChange={(e) => handlePaletteChange(i, 'parasiteAttack', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('parasiteAttack')}</td>
                    </tr>
                    
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Température (°C)</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            value={formData.palettes[i]?.temperature || ''}
                            onChange={(e) => handlePaletteChange(i, 'temperature', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('temperature')}</td>
                    </tr>
                    
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Odeur ou goût</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="text"
                            value={formData.palettes[i]?.odorOrTaste || ''}
                            onChange={(e) => handlePaletteChange(i, 'odorOrTaste', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('odorOrTaste')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Controle des Parametres Categorie I Tab */}
            {activeTab === 3 && (
              <div className="overflow-x-auto mt-8">
                <h2 className="text-lg font-semibold mb-4">Controle des Parametres Categorie I</h2>
                <table className="min-w-full bg-white border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-3 border">Paramètre</th>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <th key={i} className="py-2 px-3 border">Palette {i + 1}</th>
                      ))}
                      <th className="py-2 px-3 border">Moyenne</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 px-3 border">Défaut de forma</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={formData.palettes[i]?.shapeDefect || ''}
                            onChange={(e) => handlePaletteChange(i, 'shapeDefect', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('shapeDefect')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border">Défaut de coloration</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={formData.palettes[i]?.colorDefect || ''}
                            onChange={(e) => handlePaletteChange(i, 'colorDefect', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('colorDefect')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border">Défaut d'épiderme</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={formData.palettes[i]?.epidermDefect || ''}
                            onChange={(e) => handlePaletteChange(i, 'epidermDefect', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('epidermDefect')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border">Homogénéité (C/NC)</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="text"
                            value={formData.palettes[i]?.homogeneity || ''}
                            onChange={(e) => handlePaletteChange(i, 'homogeneity', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('homogeneity')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border">Extrémité des grains</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="text"
                            value={formData.palettes[i]?.grainEnds || ''}
                            onChange={(e) => handlePaletteChange(i, 'grainEnds', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('grainEnds')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border">Manque et cassés</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={formData.palettes[i]?.missingBroken || ''}
                            onChange={(e) => handlePaletteChange(i, 'missingBroken', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('missingBroken')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border">Calibre</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={formData.palettes[i]?.size || ''}
                            onChange={(e) => handlePaletteChange(i, 'size', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('size')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Controle Produit Fini Tab */}
            {activeTab === 4 && (
              <div className="overflow-x-auto mt-8">
                <h2 className="text-lg font-semibold mb-4">Controle Produit Fini</h2>
                <table className="min-w-full bg-white border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-3 border">Paramètre</th>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <th key={i} className="py-2 px-3 border">Palette {i + 1}</th>
                      ))}
                      <th className="py-2 px-3 border">Moyenne</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 px-3 border">Calibre</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={formData.palettes[i]?.size || ''}
                            onChange={(e) => handlePaletteChange(i, 'size', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('size')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border">Nombre de colis/palette</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            min="0"
                            value={formData.palettes[i]?.packageCount || ''}
                            onChange={(e) => handlePaletteChange(i, 'packageCount', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('packageCount')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border">État d'emballage</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="text"
                            value={formData.palettes[i]?.packagingState || ''}
                            onChange={(e) => handlePaletteChange(i, 'packagingState', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('packagingState')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border">Présence d'étiquetage</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="text"
                            value={formData.palettes[i]?.labelingPresence || ''}
                            onChange={(e) => handlePaletteChange(i, 'labelingPresence', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('labelingPresence')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border">Coiners</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="text"
                            value={formData.palettes[i]?.corners || ''}
                            onChange={(e) => handlePaletteChange(i, 'corners', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('corners')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border">Feuillard horizontal</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="text"
                            value={formData.palettes[i]?.horizontalStraps || ''}
                            onChange={(e) => handlePaletteChange(i, 'horizontalStraps', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('horizontalStraps')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border">Fiche palette</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="text"
                            value={formData.palettes[i]?.paletteSheet || ''}
                            onChange={(e) => handlePaletteChange(i, 'paletteSheet', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('paletteSheet')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border">État de la palette en bois</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="text"
                            value={formData.palettes[i]?.woodenPaletteState || ''}
                            onChange={(e) => handlePaletteChange(i, 'woodenPaletteState', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('woodenPaletteState')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border">Poids brut</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={formData.palettes[i]?.grossWeight || ''}
                            onChange={(e) => handlePaletteChange(i, 'grossWeight', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('grossWeight')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border">Poids net</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={formData.palettes[i]?.netWeight || ''}
                            onChange={(e) => handlePaletteChange(i, 'netWeight', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('netWeight')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border">N° Lot interne</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="text"
                            value={formData.palettes[i]?.internalLotNumber || ''}
                            onChange={(e) => handlePaletteChange(i, 'internalLotNumber', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('internalLotNumber')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border">Conformité de la palette</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="text"
                            value={formData.palettes[i]?.paletteConformity || ''}
                            onChange={(e) => handlePaletteChange(i, 'paletteConformity', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('paletteConformity')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

          {/* Tolerance Tab */}
{activeTab === 5 && (
  <div className="overflow-x-auto mt-8">
    <h2 className="text-lg font-semibold mb-4">Tolerance</h2>
    <table className="min-w-full bg-white border-collapse">
      <thead>
        <tr className="bg-gray-100">
          <th className="py-2 px-3 border">Paramètre</th>
          <th className="py-2 px-3 border">Résultat</th>
          <th className="py-2 px-3 border">Conforme</th>
          <th className="py-2 px-3 border">Non Conforme</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="py-2 px-3 border">Caractéristique minimale</td>
          <td className="py-2 px-3 border">
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.tolerance?.minCharacteristic || ''}
              onChange={(e) => handleInputChange('tolerance.minCharacteristic', e.target.value)}
              className="w-full p-1 border border-gray-200 rounded text-center"
            />
          </td>
          <td className="py-2 px-3 border text-center">
            <input
              type="checkbox"
              checked={formData.tolerance?.minCharacteristicConform || false}
              onChange={(e) => handleInputChange('tolerance.minCharacteristicConform', e.target.checked)}
            />
          </td>
          <td className="py-2 px-3 border text-center">
            <input
              type="checkbox"
              checked={formData.tolerance?.minCharacteristicNonConform || false}
              onChange={(e) => handleInputChange('tolerance.minCharacteristicNonConform', e.target.checked)}
            />
          </td>
        </tr>

        <tr>
          <td className="py-2 px-3 border">Total des défauts catégorie 1</td>
          <td className="py-2 px-3 border">
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.tolerance?.category1Defects || ''}
              onChange={(e) => handleInputChange('tolerance.category1Defects', e.target.value)}
              className="w-full p-1 border border-gray-200 rounded text-center"
            />
          </td>
          <td className="py-2 px-3 border text-center">
            <input
              type="checkbox"
              checked={formData.tolerance?.category1DefectsConform || false}
              onChange={(e) => handleInputChange('tolerance.category1DefectsConform', e.target.checked)}
            />
          </td>
          <td className="py-2 px-3 border text-center">
            <input
              type="checkbox"
              checked={formData.tolerance?.category1DefectsNonConform || false}
              onChange={(e) => handleInputChange('tolerance.category1DefectsNonConform', e.target.checked)}
            />
          </td>
        </tr>

        <tr>
          <td className="py-2 px-3 border">Total des défauts catégorie 2</td>
          <td className="py-2 px-3 border">
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.tolerance?.category2Defects || ''}
              onChange={(e) => handleInputChange('tolerance.category2Defects', e.target.value)}
              className="w-full p-1 border border-gray-200 rounded text-center"
            />
          </td>
          <td className="py-2 px-3 border text-center">
            <input
              type="checkbox"
              checked={formData.tolerance?.category2DefectsConform || false}
              onChange={(e) => handleInputChange('tolerance.category2DefectsConform', e.target.checked)}
            />
          </td>
          <td className="py-2 px-3 border text-center">
            <input
              type="checkbox"
              checked={formData.tolerance?.category2DefectsNonConform || false}
              onChange={(e) => handleInputChange('tolerance.category2DefectsNonConform', e.target.checked)}
            />
          </td>
        </tr>

        <tr>
          <td className="py-2 px-3 border">Total des défauts catégorie 3</td>
          <td className="py-2 px-3 border">
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.tolerance?.category3Defects || ''}
              onChange={(e) => handleInputChange('tolerance.category3Defects', e.target.value)}
              className="w-full p-1 border border-gray-200 rounded text-center"
            />
          </td>
          <td className="py-2 px-3 border text-center">
            <input
              type="checkbox"
              checked={formData.tolerance?.category3DefectsConform || false}
              onChange={(e) => handleInputChange('tolerance.category3DefectsConform', e.target.checked)}
            />
          </td>
          <td className="py-2 px-3 border text-center">
            <input
              type="checkbox"
              checked={formData.tolerance?.category3DefectsNonConform || false}
              onChange={(e) => handleInputChange('tolerance.category3DefectsNonConform', e.target.checked)}
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
)}


            {/* Final Table Tab */}
            {activeTab === 6 && (
              <div className="overflow-x-auto mt-8">
                <h2 className="text-lg font-semibold mb-4">Final Table</h2>
                <table className="min-w-full bg-white border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-3 border">Paramètre</th>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <th key={i} className="py-2 px-3 border">Palette {i + 1}</th>
                      ))}
                      <th className="py-2 px-3 border">Moyenne</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Add rows as per requirements */}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}