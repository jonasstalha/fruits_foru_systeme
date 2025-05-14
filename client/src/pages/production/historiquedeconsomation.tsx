import { useState, useEffect } from 'react';
import { AlertCircle, Check, AlertTriangle, Save, Calendar } from 'lucide-react';

export default function historiquedeconsomation() {
  const [selectedDate, setSelectedDate] = useState('');
  const [materials, setMaterials] = useState([]);
  const [consumption, setConsumption] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);

  // Fetch materials from API when component mounts
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        // In a real app, replace with actual API endpoint
        // const response = await fetch('/api/materials');
        // const data = await response.json();
        
        // Using mock data for now
        const mockData = [
          { id: 1, name: "Palettes", current_stock: 250, alert_threshold: 50 },
          { id: 2, name: "Ruban Adhésif", current_stock: 75, alert_threshold: 10 },
          { id: 3, name: "Film plastique", current_stock: 30, alert_threshold: 15 },
          { id: 4, name: "Cartons", current_stock: 500, alert_threshold: 100 },
          { id: 5, name: "Étiquettes", current_stock: 1000, alert_threshold: 200 }
        ];
        
        setMaterials(mockData);
        
        // Initialize consumption with zeros
        const initialConsumption = {};
        mockData.forEach(material => {
          initialConsumption[material.id] = 0;
        });
        setConsumption(initialConsumption);
      } catch (error) {
        console.error("Failed to fetch materials:", error);
      }
    };

    fetchMaterials();
  }, []);

  // Calculate remaining stock for a material
  const calculateRemainingStock = (material) => {
    const consumed = consumption[material.id] || 0;
    return material.current_stock - consumed;
  };

  // Check for low stock when consumption changes
  useEffect(() => {
    const alerts = materials.filter(material => {
      const remaining = calculateRemainingStock(material);
      return remaining <= material.alert_threshold;
    }).map(material => material.name);
    
    setLowStockAlerts(alerts);
  }, [consumption, materials]);

  // Handle consumption input change
  const handleConsumptionChange = (materialId, value) => {
    const numValue = parseInt(value, 10) || 0;
    
    // Ensure consumption doesn't exceed current stock
    const material = materials.find(m => m.id === materialId);
    if (material && numValue > material.current_stock) {
      return;
    }
    
    setConsumption(prev => ({
      ...prev,
      [materialId]: numValue
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedDate) {
      alert("Veuillez sélectionner une date");
      return;
    }
    
    // Create payload with consumed materials
    const payload = {
      date: selectedDate,
      consumed_materials: Object.entries(consumption)
        .filter(([_, value]) => value > 0)
        .map(([materialId, value]) => ({
          material_id: parseInt(materialId, 10),
          consumed_qty: value
        }))
    };
    
    if (payload.consumed_materials.length === 0) {
      alert("Aucune consommation à enregistrer");
      return;
    }
    
    setLoading(true);
    try {
      // In a real app, send to actual API endpoint
      // const response = await fetch('/api/consumption', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(payload),
      // });
      
      // Mock successful submission
      console.log("Submitting consumption:", payload);
      
      // Simulate API response
      setTimeout(() => {
        setSubmitStatus({
          success: true,
          message: "Consommation enregistrée avec succès"
        });
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setSubmitStatus(null);
          
          // In a real app, we would refetch materials to get updated stock
          // For now, we'll update the stock in our local state
          const updatedMaterials = materials.map(material => {
            const consumedQty = consumption[material.id] || 0;
            return {
              ...material,
              current_stock: material.current_stock - consumedQty
            };
          });
          
          setMaterials(updatedMaterials);
          
          // Reset consumption
          const resetConsumption = {};
          updatedMaterials.forEach(material => {
            resetConsumption[material.id] = 0;
          });
          setConsumption(resetConsumption);
        }, 3000);
      }, 1000);
    } catch (error) {
      console.error("Failed to submit consumption:", error);
      setSubmitStatus({
        success: false,
        message: "Erreur lors de l'enregistrement de la consommation"
      });
    } finally {
      setLoading(false);
    }
  };

  // Get stock status for styling and icon
  const getStockStatus = (material) => {
    const remaining = calculateRemainingStock(material);
    if (remaining <= 0) return "danger";
    if (remaining <= material.alert_threshold) return "warning";
    return "normal";
  };

  // Render stock status icon
  const renderStockIcon = (status) => {
    switch (status) {
      case "danger":
        return <AlertCircle className="text-red-500" />;
      case "warning":
        return <AlertTriangle className="text-yellow-500" />;
      default:
        return <Check className="text-green-500" />;
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Consommation des Matériaux</h1>
        
        {/* Date Selection */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="text-gray-500" />
              <label htmlFor="date" className="font-medium">Date de consommation:</label>
            </div>
            <input
              type="date"
              id="date"
              className="border border-gray-300 rounded p-2 w-full sm:w-auto"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
        
        {/* Low Stock Alerts */}
        {lowStockAlerts.length > 0 && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <span className="font-medium">Attention!</span> Les stocks suivants sont presque épuisés:
                </p>
                <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                  {lowStockAlerts.map((name, index) => (
                    <li key={index}>Le stock de {name} est presque épuisé</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* Submit Status Message */}
        {submitStatus && (
          <div 
            className={`mb-6 p-4 rounded ${
              submitStatus.success ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
            } border-l-4`}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                {submitStatus.success ? (
                  <Check className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm ${submitStatus.success ? 'text-green-700' : 'text-red-700'}`}>
                  {submitStatus.message}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Materials Table */}
        {selectedDate ? (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Matériau
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock Actuel
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Consommation
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock Restant
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {materials.map((material) => {
                      const status = getStockStatus(material);
                      const remaining = calculateRemainingStock(material);
                      
                      return (
                        <tr 
                          key={material.id}
                          className={`${
                            status === "danger" ? "bg-red-50" : 
                            status === "warning" ? "bg-yellow-50" : ""
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{material.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{material.current_stock}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              min="0"
                              max={material.current_stock}
                              value={consumption[material.id] || 0}
                              onChange={(e) => handleConsumptionChange(material.id, e.target.value)}
                              className="border border-gray-300 rounded p-2 w-20"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${
                              status === "danger" ? "text-red-700" :
                              status === "warning" ? "text-yellow-700" :
                              "text-gray-900"
                            }`}>
                              {remaining}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {renderStockIcon(status)}
                              <span className="ml-2 text-sm text-gray-500">
                                {status === "danger" ? "Critique" : 
                                 status === "warning" ? "Alerte" : "Normal"}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Mobile View for Materials */}
            <div className="md:hidden space-y-4 mb-6">
              {materials.map((material) => {
                const status = getStockStatus(material);
                const remaining = calculateRemainingStock(material);
                
                return (
                  <div 
                    key={material.id} 
                    className={`bg-white rounded-lg shadow p-4 ${
                      status === "danger" ? "border-l-4 border-red-500" : 
                      status === "warning" ? "border-l-4 border-yellow-500" : ""
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{material.name}</h3>
                      <div className="flex items-center">
                        {renderStockIcon(status)}
                        <span className="ml-1 text-xs">
                          {status === "danger" ? "Critique" : 
                           status === "warning" ? "Alerte" : "Normal"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-gray-500">Stock Actuel</p>
                        <p>{material.current_stock}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Stock Restant</p>
                        <p className={`font-medium ${
                          status === "danger" ? "text-red-700" :
                          status === "warning" ? "text-yellow-700" :
                          "text-gray-900"
                        }`}>{remaining}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 mb-1">Consommation</p>
                        <input
                          type="number"
                          min="0"
                          max={material.current_stock}
                          value={consumption[material.id] || 0}
                          onChange={(e) => handleConsumptionChange(material.id, e.target.value)}
                          className="border border-gray-300 rounded p-2 w-full"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow ${
                  loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
                }`}
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Enregistrement..." : "Enregistrer la Consommation"}
              </button>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Calendar className="mx-auto text-gray-400 h-12 w-12 mb-4" />
            <p className="text-gray-600 mb-2">Veuillez sélectionner une date pour afficher la liste des matériaux</p>
          </div>
        )}
      </div>
    </div>
  );
}