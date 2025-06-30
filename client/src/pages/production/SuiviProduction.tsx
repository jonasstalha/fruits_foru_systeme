import React, { useState, useEffect } from 'react';
import { Save, FilePlus, RefreshCw, Check, Calendar, Package, User, Thermometer } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { firestore } from '../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const SuiviProduction = () => {
  const [headerData, setHeaderData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    produit: 'AVOCAT',
    numeroLotClient: '',
    typeProduction: 'CONVENTIONNEL' // or BIOLOGIQUE
  });

  const [calibreData, setCalibreData] = useState({
    12: 0, 14: 0, 16: 0, 18: 0, 20: 0, 22: 0, 24: 0, 26: 0, 28: 0, 30: 0, 32: 0
  });

  const [nombrePalettes, setNombrePalettes] = useState('');

  const [productionRows, setProductionRows] = useState(
    Array.from({ length: 26 }, (_, index) => ({
      numero: index + 1,
      date: '',
      heure: '',
      calibre: '',
      poidsBrut: '',
      poidsNet: '',
      numeroLotInterne: '',
      variete: '',
      nbrCP: '',
      chambreFroide: '',
      decision: ''
    }))
  );

  const [visas, setVisas] = useState({
    controleurQualite: '',
    responsableQualite: '',
    directeurOperationnel: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const varietesAvocat = [
    'Hass', 'Fuerte', 'Pinkerton', 'Reed', 'Zutano', 'Bacon', 'Gwen', 'Lamb Hass'
  ];

  const chambresFreides = [
    'CF-01', 'CF-02', 'CF-03', 'CF-04', 'CF-05', 'CF-06'
  ];

  const decisions = [
    'ACCEPTÉ', 'REFUSÉ', 'EN ATTENTE', 'CONDITIONNEL'
  ];

  const handleHeaderChange = (field, value) => {
    setHeaderData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCalibreChange = (calibre, value) => {
    setCalibreData(prev => ({
      ...prev,
      [calibre]: parseInt(value) || 0
    }));
  };

  const handleRowChange = (rowIndex, field, value) => {
    setProductionRows(prev => {
      const newRows = [...prev];
      newRows[rowIndex] = {
        ...newRows[rowIndex],
        [field]: value
      };
      return newRows;
    });
  };

  const handleVisaChange = (field, value) => {
    setVisas(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateTotals = () => {
    const totals = productionRows.reduce((acc, row) => {
      return {
        poidsBrut: acc.poidsBrut + (parseFloat(row.poidsBrut) || 0),
        poidsNet: acc.poidsNet + (parseFloat(row.poidsNet) || 0),
        nbrCP: acc.nbrCP + (parseInt(row.nbrCP) || 0)
      };
    }, { poidsBrut: 0, poidsNet: 0, nbrCP: 0 });

    return totals;
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Import jsPDF dynamically
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('Suivi de la production', 105, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.text('AVOCAT', 105, 30, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text('SMQ.ENR 23', 20, 45);
      doc.text('Version : 01', 20, 52);
      doc.text('Date : 19/05/2023', 20, 59);
      
      // Form data
      doc.text(`DATE : ${headerData.date}`, 20, 75);
      doc.text(`PRODUIT : ${headerData.produit}`, 20, 82);
      doc.text(`N° LOT CLIENT : ${headerData.numeroLotClient}`, 20, 89);
      
      // Production type
      doc.text('Type de production:', 20, 103);
      if (headerData.typeProduction === 'CONVENTIONNEL') {
        doc.text('☑ CONVENTIONNEL', 20, 110);
        doc.text('☐ BIOLOGIQUE', 80, 110);
      } else {
        doc.text('☐ CONVENTIONNEL', 20, 110);
        doc.text('☑ BIOLOGIQUE', 80, 110);
      }
      
      // Calibre section
      doc.text('Calibres:', 20, 125);
      let yPos = 132;
      const calibres = Object.keys(calibreData);
      for (let i = 0; i < calibres.length; i += 6) {
        let xPos = 20;
        for (let j = i; j < Math.min(i + 6, calibres.length); j++) {
          const calibre = calibres[j];
          doc.text(`${calibre}: ${calibreData[calibre]}`, xPos, yPos);
          xPos += 30;
        }
        yPos += 7;
      }
      
      doc.text(`Nombre des palettes: ${nombrePalettes}`, 20, yPos + 7);
      
      // Production table
      yPos += 20;
      doc.setFontSize(10);
      
      // Table headers
      const headers = ['N°', 'Date', 'Heure', 'Calibre', 'Poids brut (Kg)', 'Poids net (Kg)', 'N° lot Interne', 'Variété', 'Nbr C/P', 'Chambre froide', 'Décision'];
      const colWidths = [15, 20, 15, 15, 25, 25, 25, 20, 15, 25, 20];
      let xStart = 10;
      
      headers.forEach((header, index) => {
        doc.text(header, xStart, yPos);
        xStart += colWidths[index];
      });
      
      yPos += 5;
      
      // Table data
      productionRows.forEach((row, index) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        
        xStart = 10;
        const rowData = [
          row.numero.toString(),
          row.date,
          row.heure,
          row.calibre,
          row.poidsBrut,
          row.poidsNet,
          row.numeroLotInterne,
          row.variete,
          row.nbrCP,
          row.chambreFroide,
          row.decision
        ];
        
        rowData.forEach((data, colIndex) => {
          doc.text(data || '', xStart, yPos);
          xStart += colWidths[colIndex];
        });
        
        yPos += 5;
      });
      
      // Totals
      yPos += 10;
      const totals = calculateTotals();
      doc.setFontSize(12);
      doc.text(`TOTAL POIDS BRUT: ${totals.poidsBrut.toFixed(2)} Kg`, 20, yPos);
      doc.text(`POIDS NET: ${totals.poidsNet.toFixed(2)} Kg`, 80, yPos);
      doc.text(`NBR DE C/P: ${totals.nbrCP}`, 140, yPos);
      
      // Signatures
      yPos += 20;
      doc.text('Visa contrôleur de Qualité :', 20, yPos);
      doc.text('VISA Responsable Qualité :', 80, yPos);
      doc.text('Visa Directeur opérationnel :', 140, yPos);
      
      yPos += 20;
      doc.text(visas.controleurQualite || '_________________', 20, yPos);
      doc.text(visas.responsableQualite || '_________________', 80, yPos);
      doc.text(visas.directeurOperationnel || '_________________', 140, yPos);
      
      // Save PDF
      doc.save(`Suivi_Production_Avocat_${format(new Date(), 'yyyyMMdd')}.pdf`);
      
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const resetForm = () => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser le formulaire? Toutes les données seront perdues.")) {
      setHeaderData({
        date: format(new Date(), 'yyyy-MM-dd'),
        produit: 'AVOCAT',
        numeroLotClient: '',
        typeProduction: 'CONVENTIONNEL'
      });
      setCalibreData({
        12: 0, 14: 0, 16: 0, 18: 0, 20: 0, 22: 0, 24: 0, 26: 0, 28: 0, 30: 0, 32: 0
      });
      setNombrePalettes('');
      setProductionRows(
        Array.from({ length: 26 }, (_, index) => ({
          numero: index + 1,
          date: '',
          heure: '',
          calibre: '',
          poidsBrut: '',
          poidsNet: '',
          numeroLotInterne: '',
          variete: '',
          nbrCP: '',
          chambreFroide: '',
          decision: ''
        }))
      );
      setVisas({
        controleurQualite: '',
        responsableQualite: '',
        directeurOperationnel: ''
      });
    }
  };

  // Save production data for public viewing (now to Firestore)
  const handleSavePublic = async () => {
    setIsSaving(true);
    setError('');
    try {
      const data = {
        headerData,
        calibreData,
        nombrePalettes,
        productionRows,
        visas,
        savedAt: new Date().toISOString(),
      };
      // Use a fixed document ID for now (e.g., 'current')
      await setDoc(doc(firestore, 'production_suivi', 'current'), data);
      alert('Production enregistrée et visible publiquement !');
    } catch (e) {
      setError('Erreur lors de la sauvegarde Firestore');
    } finally {
      setIsSaving(false);
    }
  };

  // Load saved production data from Firestore on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const docRef = doc(firestore, 'production_suivi', 'current');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setHeaderData(data.headerData || headerData);
          setCalibreData(data.calibreData || calibreData);
          setNombrePalettes(data.nombrePalettes || '');
          setProductionRows(data.productionRows || productionRows);
          setVisas(data.visas || visas);
        }
      } catch (e) {
        console.error('Firestore load error:', e); // <-- log error
        setError('Erreur lors du chargement Firestore: ' + (e && e.message ? e.message : e));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, []);

  const totals = calculateTotals();

  if (loading) {
    return <div className="p-8 text-center text-lg text-gray-600">Chargement des données...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="bg-gradient-to-b from-green-50 to-white min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-xl p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-gray-200">
          <div className="space-y-4 w-full md:w-auto">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Suivi de la production</h1>
                <p className="text-lg font-semibold text-green-600">AVOCAT</p>
                <p className="text-sm text-gray-500 mt-1">
                  SMQ.ENR 23 - Version: 01 - Date: 19/05/2023
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl mt-6">
              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={headerData.date}
                    onChange={(e) => handleHeaderChange('date', e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produit
                  </label>
                  <input
                    type="text"
                    value={headerData.produit}
                    onChange={(e) => handleHeaderChange('produit', e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    N° LOT CLIENT
                  </label>
                  <input
                    type="text"
                    value={headerData.numeroLotClient}
                    onChange={(e) => handleHeaderChange('numeroLotClient', e.target.value)}
                    placeholder="Entrer le numéro de lot client"
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre des palettes
                  </label>
                  <input
                    type="number"
                    value={nombrePalettes}
                    onChange={(e) => setNombrePalettes(e.target.value)}
                    placeholder="Nombre de palettes"
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Type de production
                </label>
                <div className="space-y-2">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="CONVENTIONNEL"
                      checked={headerData.typeProduction === 'CONVENTIONNEL'}
                      onChange={(e) => handleHeaderChange('typeProduction', e.target.value)}
                      className="form-radio text-green-600 focus:ring-green-500 h-4 w-4"
                    />
                    <span className="ml-2">CONVENTIONNEL</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="BIOLOGIQUE"
                      checked={headerData.typeProduction === 'BIOLOGIQUE'}
                      onChange={(e) => handleHeaderChange('typeProduction', e.target.value)}
                      className="form-radio text-green-600 focus:ring-green-500 h-4 w-4"
                    />
                    <span className="ml-2">BIOLOGIQUE</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Calibre Section */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Calibres</h3>
              <div className="grid grid-cols-6 md:grid-cols-11 gap-3">
                {Object.keys(calibreData).map(calibre => (
                  <div key={calibre} className="text-center">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {calibre}
                    </label>
                    <input
                      type="number"
                      value={calibreData[calibre]}
                      onChange={(e) => handleCalibreChange(calibre, e.target.value)}
                      className="w-full p-2 text-center rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      min="0"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-3 mt-6 md:mt-0">
            <button
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all transform hover:scale-105 disabled:bg-gray-400 disabled:transform-none shadow-lg hover:shadow-xl"
            >
              {isGeneratingPDF ? (
                <>
                  <div className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full"></div>
                  Génération PDF...
                </>
              ) : (
                <>
                  <FilePlus size={20} />
                  Générer PDF
                </>
              )}
            </button>
            
            <button
              onClick={resetForm}
              className="flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <RefreshCw size={20} />
              Réinitialiser
            </button>
            <button
              onClick={handleSavePublic}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Save size={20} />
              Sauvegarder & Rendre Public
            </button>
          </div>
        </div>
        
        {showSuccessMessage && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-r-lg animate-fade-in flex items-center">
            <div className="bg-green-100 rounded-full p-1 mr-3">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <span>PDF généré avec succès!</span>
          </div>
        )}
        
        {/* Production Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">N° P</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Date</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Heure</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Calibre</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Poids brut (Kg)</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Poids net (Kg)</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">N° lot Interne</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Variété</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Nbr C/P</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">Chambre froide</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Décision</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productionRows.map((row, rowIndex) => (
                  <tr key={rowIndex} 
                      className={`group hover:bg-green-50 transition-colors ${
                        rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                      }`}>
                    <td className="px-3 py-2 border-r whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.numero}
                    </td>
                    <td className="px-3 py-2 border-r">
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) => handleRowChange(rowIndex, 'date', e.target.value)}
                        className="w-full p-1.5 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      />
                    </td>
                    <td className="px-3 py-2 border-r">
                      <input
                        type="time"
                        value={row.heure}
                        onChange={(e) => handleRowChange(rowIndex, 'heure', e.target.value)}
                        className="w-full p-1.5 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      />
                    </td>
                    <td className="px-3 py-2 border-r">
                      <input
                        type="text"
                        value={row.calibre}
                        onChange={(e) => handleRowChange(rowIndex, 'calibre', e.target.value)}
                        placeholder="ex: 14-16"
                        className="w-full p-1.5 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      />
                    </td>
                    <td className="px-3 py-2 border-r">
                      <input
                        type="number"
                        value={row.poidsBrut}
                        onChange={(e) => handleRowChange(rowIndex, 'poidsBrut', e.target.value)}
                        step="0.1"
                        className="w-full p-1.5 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      />
                    </td>
                    <td className="px-3 py-2 border-r">
                      <input
                        type="number"
                        value={row.poidsNet}
                        onChange={(e) => handleRowChange(rowIndex, 'poidsNet', e.target.value)}
                        step="0.1"
                        className="w-full p-1.5 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      />
                    </td>
                    <td className="px-3 py-2 border-r">
                      <input
                        type="text"
                        value={row.numeroLotInterne}
                        onChange={(e) => handleRowChange(rowIndex, 'numeroLotInterne', e.target.value)}
                        className="w-full p-1.5 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      />
                    </td>
                    <td className="px-3 py-2 border-r">
                      <select
                        value={row.variete}
                        onChange={(e) => handleRowChange(rowIndex, 'variete', e.target.value)}
                        className="w-full p-1.5 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Sélectionner</option>
                        {varietesAvocat.map((variete) => (
                          <option key={variete} value={variete}>{variete}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 border-r">
                      <input
                        type="number"
                        value={row.nbrCP}
                        onChange={(e) => handleRowChange(rowIndex, 'nbrCP', e.target.value)}
                        className="w-full p-1.5 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      />
                    </td>
                    <td className="px-3 py-2 border-r">
                      <select
                        value={row.chambreFroide}
                        onChange={(e) => handleRowChange(rowIndex, 'chambreFroide', e.target.value)}
                        className="w-full p-1.5 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Sélectionner</option>
                        {chambresFreides.map((chambre) => (
                          <option key={chambre} value={chambre}>{chambre}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.decision}
                        onChange={(e) => handleRowChange(rowIndex, 'decision', e.target.value)}
                        className="w-full p-1.5 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Sélectionner</option>
                        {decisions.map((decision) => (
                          <option key={decision} value={decision} className={
                            decision === 'ACCEPTÉ' ? 'text-green-600' : 
                            decision === 'REFUSÉ' ? 'text-red-600' : 'text-gray-600'
                          }>
                            {decision}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Totals and Visas */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Totals */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Totaux</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">TOTAL POIDS BRUT:</span>
                <span className="text-lg font-bold text-blue-600">{totals.poidsBrut.toFixed(2)} Kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">POIDS NET:</span>
                <span className="text-lg font-bold text-blue-600">{totals.poidsNet.toFixed(2)} Kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">NBR DE C/P:</span>
                <span className="text-lg font-bold text-blue-600">{totals.nbrCP}</span>
              </div>
            </div>
          </div>
          
          {/* Visas */}
          <div className="p-6 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Visas</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visa Directeur opérationnel
                </label>
                <input
                  type="text"
                  value={visas.directeurOperationnel}
                  onChange={(e) => handleVisaChange('directeurOperationnel', e.target.value)}
                  className="w-full p-2 rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visa contrôleur de Qualité
                </label>
                <input
                  type="text"
                  value={visas.controleurQualite}
                  onChange={(e) => handleVisaChange('controleurQualite', e.target.value)}
                  className="w-full p-2 rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VISA Responsable Qualité
                </label>
                <input
                  type="text"
                  value={visas.responsableQualite}
                  onChange={(e) => handleVisaChange('responsableQualite', e.target.value)}
                  className="w-full p-2 rounded border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-500">
            <Package className="h-4 w-4" />
            <span className="text-sm">Suivi de production automatique</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {productionRows.filter(r => r.date || r.poidsBrut || r.poidsNet).length} entrées
            </div>
            <span className="text-sm text-gray-500">avec données</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuiviProduction;