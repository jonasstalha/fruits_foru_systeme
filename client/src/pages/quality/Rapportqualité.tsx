import React, { useState, useRef } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Camera, 
  Save, 
  Eye,
  X,
  Plus,
  FileText,
  Scale,
  Target
} from 'lucide-react';

const Rapportqualité = () => {
  const [selectedLot, setSelectedLot] = useState(null);
  const [selectedCalibre, setSelectedCalibre] = useState(null);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    calibre: '',
    lotId: ''
  });
  const [uploadedImages, setUploadedImages] = useState({});
  const [testResults, setTestResults] = useState({});
  const [inputMode, setInputMode] = useState('manual'); // 'manual' or 'image'
  
  const fileInputRef = useRef(null);

  // Mock data for submitted lots
  const submittedLots = [
    {
      id: 'LOT-2024-001',
      date: '2024-05-18',
      controller: 'John Smith',
      palletNumber: 'PAL-001',
      calibres: [12, 16, 18, 20, 22],
      status: 'pending'
    },
    {
      id: 'LOT-2024-002',
      date: '2024-05-19',
      controller: 'Sarah Johnson',
      palletNumber: 'PAL-002',
      calibres: [14, 16, 18, 20],
      status: 'complete'
    },
    {
      id: 'LOT-2024-003',
      date: '2024-05-20',
      controller: 'Mike Davis',
      palletNumber: 'PAL-003',
      calibres: [12, 14, 16, 18, 20, 22, 24,],
      status: 'needs_revision'
    }
  ];

  const filteredLots = submittedLots.filter(lot => {
    const matchesDateFrom = !filters.dateFrom || lot.date >= filters.dateFrom;
    const matchesDateTo = !filters.dateTo || lot.date <= filters.dateTo;
    const matchesCalibre = !filters.calibre || lot.calibres.includes(parseInt(filters.calibre));
    const matchesLotId = !filters.lotId || lot.id.toLowerCase().includes(filters.lotId.toLowerCase());
    
    return matchesDateFrom && matchesDateTo && matchesCalibre && matchesLotId;
  });

  const handleImageUpload = (calibre, files) => {
    const fileArray = Array.from(files);
    if (fileArray.length > 12) {
      alert('Maximum 12 images allowed per calibre');
      return;
    }
    
    setUploadedImages(prev => ({
      ...prev,
      [calibre]: fileArray
    }));
  };

  const handleTestResultChange = (calibre, field, value) => {
    setTestResults(prev => ({
      ...prev,
      [calibre]: {
        ...prev[calibre],
        [field]: value
      }
    }));
  };

  const handleTestImageUpload = (calibre, testType, file) => {
    setTestResults(prev => ({
      ...prev,
      [calibre]: {
        ...prev[calibre],
        [`${testType}_image`]: file
      }
    }));
  };

  const saveCaliberData = (calibre) => {
    const images = uploadedImages[calibre] || [];
    const results = testResults[calibre] || {};
    
    if (images.length !== 12) {
      alert('Please upload exactly 12 images for this calibre');
      return;
    }
    
    // Validation for test results
    if (inputMode === 'manual') {
      if (!results.poids || !results.firmness || !results.puree_image) {
        alert('Please complete all test results');
        return;
      }
    } else {
      if (!results.poids_image || !results.firmness_image || !results.puree_image) {
        alert('Please upload all test result images');
        return;
      }
    }
    
    // Here you would save to your backend
    console.log('Saving calibre data:', { calibre, images, results });
    alert(`Data saved for calibre ${calibre}`);
  };

  const updateLotStatus = (status) => {
    // Here you would update the lot status in your backend
    console.log('Updating lot status:', selectedLot.id, status);
    setSelectedLot(prev => ({ ...prev, status }));
    alert(`Lot ${selectedLot.id} marked as ${status}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'complete':
        return 'text-green-600 bg-green-100';
      case 'needs_revision':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-4 h-4" />;
      case 'needs_revision':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  if (selectedCalibre && selectedLot) {
    const calibreImages = uploadedImages[selectedCalibre] || [];
    const calibreResults = testResults[selectedCalibre] || {};
    
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => setSelectedCalibre(null)}
              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-2"
            >
              ← Back to Lot {selectedLot.id}
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Calibre {selectedCalibre} - Quality Control
            </h1>
            <p className="text-gray-600">Lot: {selectedLot.id} | Pallet: {selectedLot.palletNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Upload Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Unit Images (12 required)
            </h3>
            
            <div className="mb-4">
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(selectedCalibre, e.target.files)}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Upload className="w-4 h-4" />
                Upload Images ({calibreImages.length}/12)
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {calibreImages.map((file, index) => (
                <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Unit ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {Array.from({ length: 12 - calibreImages.length }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-gray-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Test Results Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Test Results
            </h3>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Input Mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setInputMode('manual')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    inputMode === 'manual'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Manual Input
                </button>
                <button
                  onClick={() => setInputMode('image')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    inputMode === 'image'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Image Upload
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Poids (Weight) */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Poids (Weight)
                </label>
                {inputMode === 'manual' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="240"
                      value={calibreResults.poids || ''}
                      onChange={(e) => handleTestResultChange(selectedCalibre, 'poids', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-gray-500">g</span>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleTestImageUpload(selectedCalibre, 'poids', e.target.files[0])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              </div>

              {/* Firmness */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Firmness
                </label>
                {inputMode === 'manual' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.7"
                      value={calibreResults.firmness || ''}
                      onChange={(e) => handleTestResultChange(selectedCalibre, 'firmness', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-gray-500">kg/cm²</span>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleTestImageUpload(selectedCalibre, 'firmness', e.target.files[0])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              </div>

              {/* Purée (Always image) */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Purée Test Result (Image)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleTestImageUpload(selectedCalibre, 'puree', e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              onClick={() => saveCaliberData(selectedCalibre)}
              className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              <Save className="w-4 h-4" />
              Save Calibre Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedLot) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => setSelectedLot(null)}
              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-2"
            >
              ← Back to Lots
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Lot Details</h1>
            <p className="text-gray-600">Quality Control - Chief Phase</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => updateLotStatus('complete')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4" />
              Mark Complete
            </button>
            <button
              onClick={() => updateLotStatus('needs_revision')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <AlertCircle className="w-4 h-4" />
              Needs Revision
            </button>
          </div>
        </div>

        {/* Lot Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Lot Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Lot ID</label>
              <p className="text-lg font-semibold">{selectedLot.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Date</label>
              <p className="text-lg font-semibold">{selectedLot.date}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Controller</label>
              <p className="text-lg font-semibold">{selectedLot.controller}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Pallet Number</label>
              <p className="text-lg font-semibold">{selectedLot.palletNumber}</p>
            </div>
          </div>
        </div>

        {/* Calibres */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Calibres</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {selectedLot.calibres.map((calibre) => {
              const images = uploadedImages[calibre] || [];
              const results = testResults[calibre] || {};
              const isComplete = images.length === 12 && 
                (inputMode === 'manual' 
                  ? results.poids && results.firmness && results.puree_image
                  : results.poids_image && results.firmness_image && results.puree_image);
              
              return (
                <button
                  key={calibre}
                  onClick={() => setSelectedCalibre(calibre)}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <div className="text-2xl font-bold mb-2">{calibre}</div>
                  <div className="text-sm text-gray-600 mb-2">
                    Images: {images.length}/12
                  </div>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    isComplete ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isComplete ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Complete
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3" />
                        Pending
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quality Control - Chief Phase</h1>
          <p className="text-gray-600">Review and process submitted lots</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Calibre</label>
            <select
              value={filters.calibre}
              onChange={(e) => setFilters(prev => ({ ...prev, calibre: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Calibres</option>
              <option value="12">12</option>
              <option value="14">14</option>
              <option value="16">16</option>
              <option value="18">18</option>
              <option value="20">20</option>
              <option value="22">22</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lot ID</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search lot ID..."
                value={filters.lotId}
                onChange={(e) => setFilters(prev => ({ ...prev, lotId: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lots Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Submitted Lots ({filteredLots.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lot ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Controller</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pallet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calibres</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLots.map((lot) => (
                <tr key={lot.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {lot.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lot.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lot.controller}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lot.palletNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lot.calibres.join(', ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lot.status)}`}>
                      {getStatusIcon(lot.status)}
                      {lot.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => setSelectedLot(lot)}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Rapportqualité;