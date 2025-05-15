import { useState, useEffect } from 'react';
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
  requiredNetWeight: string;
  palettes: PaletteData[];
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
  paletteConformity: ''
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
  requiredNetWeight: '',
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

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handlePaletteChange = (paletteIndex: number, field: keyof PaletteData, value: string) => {
    const newPalettes = [...formData.palettes];
    newPalettes[paletteIndex] = { ...newPalettes[paletteIndex], [field]: value };
    setFormData({ ...formData, palettes: newPalettes });
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
        if (palette.packageWeight && formData.requiredNetWeight) {
          const requiredWeight = parseFloat(formData.requiredNetWeight);
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

  const calculateAverages = (field: keyof PaletteData): string => {
    const values = formData.palettes.map(p => parseFloat(p[field] as string) || 0);
    if (values.length === 0) return '0';
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    return avg.toFixed(2);
  };

  const handleGenerateReport = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text("Product Quality Control Report", 10, 10);

    // Add date
    doc.setFontSize(12);
    doc.text(`Date: ${formData.date}`, 10, 20);

    // Add product details
    doc.text(`Product: ${formData.product}`, 10, 30);
    doc.text(`Variety: ${formData.variety}`, 10, 40);
    doc.text(`Campaign: ${formData.campaign}`, 10, 50);
    doc.text(`Client Lot: ${formData.clientLot}`, 10, 60);
    doc.text(`Shipment Number: ${formData.shipmentNumber}`, 10, 70);
    doc.text(`Packaging Type: ${formData.packagingType}`, 10, 80);
    doc.text(`Category: ${formData.category}`, 10, 90);
    doc.text(`Exporter Number: ${formData.exporterNumber}`, 10, 100);
    doc.text(`Frequency: ${formData.frequency}`, 10, 110);

    // Add palette details
    doc.text("Palette Details:", 10, 120);
    formData.palettes.forEach((palette, index) => {
      doc.text(`Palette ${index + 1}:`, 10, 130 + index * 10);
      doc.text(`  Package Count: ${palette.packageCount || "N/A"}`, 20, 140 + index * 10);
      doc.text(`  Package Weight: ${palette.packageWeight || "N/A"}`, 20, 150 + index * 10);
      doc.text(`  Shape Defect: ${palette.shapeDefect || "N/A"}%`, 20, 160 + index * 10);
      doc.text(`  Color Defect: ${palette.colorDefect || "N/A"}%`, 20, 170 + index * 10);
    });

    // Add results
    doc.text("Results:", 10, 200);
    doc.text(`Minimum Characteristics: ${results.minCharacteristics}`, 10, 210);
    doc.text(`Total Defects: ${results.totalDefects}`, 10, 220);
    doc.text(`Missing/Broken Grains: ${results.missingBrokenGrains}`, 10, 230);
    doc.text(`Weight Conformity: ${results.weightConformity}`, 10, 240);
    doc.text(`Is Conform: ${results.isConform ? "Yes" : "No"}`, 10, 250);

    // Save the PDF
    doc.save("Quality_Control_Report.pdf");
  };

  const tabTitles = [
    "Basic Info",
    "Minimum Characteristics",
    "Category Parameters",
    "Palette Details",
    "Results"
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
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
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
                
                <div className="md:col-span-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Required Net Weight (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.requiredNetWeight}
                      onChange={(e) => handleInputChange('requiredNetWeight', e.target.value)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Minimum Characteristics Tab */}
            {activeTab === 1 && (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-3 border sticky left-0 bg-gray-100 z-10">Parameter</th>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <th key={i} className="py-2 px-3 border">Palette {i + 1}</th>
                      ))}
                      <th className="py-2 px-3 border">Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Phase 1: Already Correct */}
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Firmness (kgf) [13-14]</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={formData.palettes[i]?.missingBrokenGrains || ''}
                            onChange={(e) => handlePaletteChange(i, 'missingBrokenGrains', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('missingBrokenGrains')}</td>
                    </tr>

                    {/* Phase 2: Contrôle Poids */}
                    {Array.from({ length: Math.min(paletteCount, 27) }).map((_, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Row {rowIndex + 1}</td>
                        {Array.from({ length: 4 }).map((_, colIndex) => (
                          <td key={colIndex} className="py-1 px-2 border">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={formData.palettes[rowIndex]?.[`weightCol${colIndex}`] || ''}
                              onChange={(e) => handlePaletteChange(rowIndex, `weightCol${colIndex}`, e.target.value)}
                              className="w-full p-1 border border-gray-200 rounded text-center"
                            />
                          </td>
                        ))}
                        <td className="py-2 px-3 border font-medium">{calculateAverages(`weightCol${rowIndex}`)}</td>
                      </tr>
                    ))}

                    {/* Phase 3: Contrôle des Caractéristiques */}
                    {Array.from({ length: Math.min(paletteCount, 27) }).map((_, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Row {rowIndex + 1}</td>
                        {Array.from({ length: 10 }).map((_, colIndex) => (
                          <td key={colIndex} className="py-1 px-2 border">
                            <input
                              type="text"
                              value={formData.palettes[rowIndex]?.[`characteristicCol${colIndex}`] || ''}
                              onChange={(e) => handlePaletteChange(rowIndex, `characteristicCol${colIndex}`, e.target.value)}
                              className="w-full p-1 border border-gray-200 rounded text-center"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}

                    {/* Phase 4: Contrôle des Paramètres */}
                    {Array.from({ length: Math.min(paletteCount, 27) }).map((_, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Row {rowIndex + 1}</td>
                        {Array.from({ length: 7 }).map((_, colIndex) => (
                          <td key={colIndex} className="py-1 px-2 border">
                            <input
                              type="text"
                              value={formData.palettes[rowIndex]?.[`parameterCol${colIndex}`] || ''}
                              onChange={(e) => handlePaletteChange(rowIndex, `parameterCol${colIndex}`, e.target.value)}
                              className="w-full p-1 border border-gray-200 rounded text-center"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}

                    {/* Phase 5: Contrôle Produit Fini */}
                    {Array.from({ length: Math.min(paletteCount, 27) }).map((_, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Row {rowIndex + 1}</td>
                        {Array.from({ length: 13 }).map((_, colIndex) => (
                          <td key={colIndex} className="py-1 px-2 border">
                            <input
                              type="text"
                              value={formData.palettes[rowIndex]?.[`finishedProductCol${colIndex}`] || ''}
                              onChange={(e) => handlePaletteChange(rowIndex, `finishedProductCol${colIndex}`, e.target.value)}
                              className="w-full p-1 border border-gray-200 rounded text-center"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}

                    {/* Phase 6: Tolerance Table */}
                    {Array.from({ length: Math.min(paletteCount, 27) }).map((_, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Row {rowIndex + 1}</td>
                        {Array.from({ length: 5 }).map((_, colIndex) => (
                          <td key={colIndex} className="py-1 px-2 border">
                            <input
                              type="text"
                              value={formData.palettes[rowIndex]?.[`toleranceCol${colIndex}`] || ''}
                              onChange={(e) => handlePaletteChange(rowIndex, `toleranceCol${colIndex}`, e.target.value)}
                              className="w-full p-1 border border-gray-200 rounded text-center"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Palette Details Tab */}
            {activeTab === 3 && (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-3 border sticky left-0 bg-gray-100 z-10">Parameter</th>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <th key={i} className="py-2 px-3 border">Palette {i + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Package Count</td>
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
                    </tr>
                    
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Packaging State</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <select
                            value={formData.palettes[i]?.packagingState || ''}
                            onChange={(e) => handlePaletteChange(i, 'packagingState', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          >
                            <option value="">Select</option>
                            <option value="C">C</option>
                            <option value="NC">NC</option>
                          </select>
                        </td>
                      ))}
                    </tr>
                    
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Labeling Presence</td>
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
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Shape Defect (%)</td>
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
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Color Defect (sunburn) (%)</td>
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
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Epidermis Defect (%)</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={formData.palettes[i]?.epidermisDefect || ''}
                            onChange={(e) => handlePaletteChange(i, 'epidermisDefect', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">{calculateAverages('epidermisDefect')}</td>
                    </tr>
                    
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Homogeneity</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <select
                            value={formData.palettes[i]?.homogeneity || ''}
                            onChange={(e) => handlePaletteChange(i, 'homogeneity', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          >
                            <option value="">Select</option>
                            <option value="Good">Good</option>
                            <option value="Average">Average</option>
                            <option value="Poor">Poor</option>
                          </select>
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">-</td>
                    </tr>
                    
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Missing/Broken Grains (%)</td>
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
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Rotting (anthracnose) (%)</td>
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
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Foreign Matter (%)</td>
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
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Withered (%)</td>
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
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Hardened Endoderm (%)</td>
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
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Parasite Presence (%)</td>
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
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Parasite Attack (%)</td>
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
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Temperature (°C)</td>
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
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Foreign Odor/Taste</td>
                      {Array.from({ length: paletteCount }).map((_, i) => (
                        <td key={i} className="py-1 px-2 border">
                          <select
                            value={formData.palettes[i]?.odorOrTaste || ''}
                            onChange={(e) => handlePaletteChange(i, 'odorOrTaste', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </td>
                      ))}
                      <td className="py-2 px-3 border font-medium">-</td>
                    </tr>
                    
                    <tr>
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Package Weight (kg)</td>
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
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Firmness (kgf)</td>
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
                      <td className="py-2 px-3 border sticky left-0 bg-white z-10 font-medium">Color Defect (%)</td>
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