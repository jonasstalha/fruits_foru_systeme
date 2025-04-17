import { AvocadoTracking, Farm } from "@shared/schema";

// Mock data for avocado tracking
export let mockAvocadoTrackingData: AvocadoTracking[] = [
  {
    harvest: {
      harvestDate: new Date().toISOString(),
      farmLocation: "Ferme Atlas, Marrakech",
      farmerId: "FARM-001",
      lotNumber: "LOT-2024-001",
      variety: "hass"
    },
    transport: {
      lotNumber: "LOT-2024-001",
      transportCompany: "Transport Express",
      driverName: "Mohammed Alami",
      vehicleId: "VEH-001",
      departureDateTime: new Date().toISOString(),
      arrivalDateTime: new Date().toISOString(),
      temperature: 4.5
    },
    sorting: {
      lotNumber: "LOT-2024-001",
      sortingDate: new Date().toISOString(),
      staffInvolved: ["STAFF-001", "STAFF-002"],
      qualityGrade: "A",
      rejectedCount: 5,
      notes: "Quality check completed successfully"
    },
    packaging: {
      lotNumber: "LOT-2024-001",
      packagingDate: new Date().toISOString(),
      boxId: "BOX-001",
      workerIds: ["WORK-001", "WORK-002"],
      netWeight: 25.5,
      avocadoCount: 120,
      boxType: "case"
    },
    storage: {
      boxId: "BOX-001",
      entryDate: new Date().toISOString(),
      storageTemperature: 3.5,
      storageRoomId: "ROOM-001",
      exitDate: new Date().toISOString()
    },
    export: {
      boxId: "BOX-001",
      loadingDate: new Date().toISOString(),
      containerId: "CONT-001",
      driverName: "Ahmed Benali",
      vehicleId: "VEH-002",
      destination: "Paris, France"
    },
    delivery: {
      boxId: "BOX-001",
      estimatedDeliveryDate: new Date().toISOString(),
      actualDeliveryDate: new Date().toISOString(),
      clientName: "Fruits & Co",
      received: true,
      receivedBy: "Jean Dupont"
    }
  },
  {
    harvest: {
      harvestDate: "2023-04-20T07:30:00",
      farmLocation: "Ferme Sahara, Agadir",
      farmerId: "FARM-002",
      lotNumber: "LOT-2023-002",
      variety: "fuerte"
    },
    transport: {
      lotNumber: "LOT-2023-002",
      transportCompany: "Transport Express",
      driverName: "Karim Idrissi",
      vehicleId: "VEH-003",
      departureDateTime: "2023-04-21T05:00:00",
      arrivalDateTime: "2023-04-21T13:45:00",
      temperature: 4.2
    },
    sorting: {
      lotNumber: "LOT-2023-002",
      sortingDate: "2023-04-22T08:30:00",
      qualityGrade: "B",
      rejectedCount: 12
    },
    packaging: {
      lotNumber: "LOT-2023-002",
      packagingDate: "2023-04-23T11:00:00",
      boxId: "BOX-002",
      workerIds: ["WORK-003", "WORK-004"],
      netWeight: 22.8,
      avocadoCount: 110,
      boxType: "carton"
    },
    storage: {
      boxId: "BOX-002",
      entryDate: "2023-04-24T09:00:00",
      storageTemperature: 3.8,
      storageRoomId: "ROOM-002",
      exitDate: "2023-04-28T11:00:00"
    },
    export: {
      boxId: "BOX-002",
      loadingDate: "2023-04-29T10:00:00",
      containerId: "CONT-002",
      driverName: "Youssef Alami",
      vehicleId: "VEH-004",
      destination: "London, UK"
    },
    delivery: {
      boxId: "BOX-002",
      estimatedDeliveryDate: "2023-05-03T00:00:00",
      actualDeliveryDate: "",
      clientName: "Fresh Foods Ltd",
      received: false
    }
  }
];

// Mock data for farms
let mockFarms: Farm[] = [
  {
    id: 1,
    name: "Ferme Atlas",
    location: "Marrakech, Morocco",
    description: "Large avocado farm in the Atlas Mountains",
    code: "FARM-001",
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    name: "Ferme Souss",
    location: "Agadir, Morocco",
    description: "Coastal avocado farm in the Souss region",
    code: "FARM-002",
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Export mock API
export const mockApi = {
  getAvocadoTrackingData: () => Promise.resolve(mockAvocadoTrackingData),
  getFarms: () => Promise.resolve(mockFarms),
  addAvocadoTracking: (data: AvocadoTracking) => {
    mockAvocadoTrackingData = [...mockAvocadoTrackingData, data];
    return Promise.resolve(data);
  },
  addFarm: (data: Omit<Farm, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newFarm: Farm = {
      ...data,
      id: mockFarms.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockFarms.push(newFarm);
    return Promise.resolve(newFarm);
  },
  updateFarm: (id: number, data: Partial<Omit<Farm, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const index = mockFarms.findIndex(f => f.id === id);
    if (index === -1) {
      return Promise.reject(new Error(`Farm with id ${id} not found`));
    }
    const updatedFarm: Farm = {
      ...mockFarms[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    mockFarms[index] = updatedFarm;
    return Promise.resolve(updatedFarm);
  },
  deleteFarm: (id: number) => {
    const index = mockFarms.findIndex(f => f.id === id);
    if (index === -1) {
      return Promise.reject(new Error(`Farm with id ${id} not found`));
    }
    mockFarms = mockFarms.filter(f => f.id !== id);
    return Promise.resolve();
  },
  generatePDF: (lotId: string | number) => {
    // Check if lotId is valid
    if (!lotId) {
      return Promise.reject(new Error("Lot ID is required for PDF generation"));
    }
    
    const lotNumber = typeof lotId === 'number' ? `LOT-${lotId}` : lotId;
    const lot = mockAvocadoTrackingData.find(lot => lot.harvest.lotNumber === lotNumber);
    if (!lot) {
      return Promise.reject(new Error(`Lot with ID ${lotNumber} not found`));
    }

    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Rapport de Suivi - ${lot.harvest.lotNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { text-align: center; color: #333; }
            h2 { color: #666; border-bottom: 1px solid #ccc; }
            .section { margin-bottom: 20px; }
            .info { margin: 5px 0; }
          </style>
        </head>
        <body>
          <h1>RAPPORT DE SUIVI DES AVOCATS</h1>
          <h2>Lot: ${lot.harvest.lotNumber}</h2>

          <div class="section">
            <h2>INFORMATIONS DE RÉCOLTE</h2>
            <div class="info">Date de récolte: ${new Date(lot.harvest.harvestDate).toLocaleDateString('fr-FR')}</div>
            <div class="info">Localisation: ${lot.harvest.farmLocation}</div>
            <div class="info">Variété: ${lot.harvest.variety.toUpperCase()}</div>
            <div class="info">ID Agriculteur: ${lot.harvest.farmerId}</div>
          </div>

          <div class="section">
            <h2>INFORMATIONS DE TRANSPORT</h2>
            <div class="info">Société de transport: ${lot.transport.transportCompany}</div>
            <div class="info">Chauffeur: ${lot.transport.driverName}</div>
            <div class="info">ID Véhicule: ${lot.transport.vehicleId}</div>
            <div class="info">Température: ${lot.transport.temperature}°C</div>
            <div class="info">Départ: ${new Date(lot.transport.departureDateTime).toLocaleString('fr-FR')}</div>
            <div class="info">Arrivée: ${new Date(lot.transport.arrivalDateTime).toLocaleString('fr-FR')}</div>
          </div>

          <div class="section">
            <h2>INFORMATIONS DE TRI</h2>
            <div class="info">Date de tri: ${new Date(lot.sorting.sortingDate).toLocaleDateString('fr-FR')}</div>
            <div class="info">Grade de qualité: ${lot.sorting.qualityGrade}</div>
            <div class="info">Nombre rejeté: ${lot.sorting.rejectedCount}</div>
            <div class="info">Personnel impliqué: ${lot.sorting.staffInvolved?.join(', ') || 'Non spécifié'}</div>
            ${lot.sorting.notes ? `<div class="info">Notes: ${lot.sorting.notes}</div>` : ''}
          </div>

          <div class="section">
            <h2>INFORMATIONS D'EMBALLAGE</h2>
            <div class="info">Date d'emballage: ${new Date(lot.packaging.packagingDate).toLocaleDateString('fr-FR')}</div>
            <div class="info">ID Boîte: ${lot.packaging.boxId}</div>
            <div class="info">Poids net: ${lot.packaging.netWeight} kg</div>
            <div class="info">Nombre d'avocats: ${lot.packaging.avocadoCount}</div>
            <div class="info">Type de boîte: ${lot.packaging.boxType.toUpperCase()}</div>
            <div class="info">Personnel: ${lot.packaging.workerIds.join(', ')}</div>
          </div>

          <div class="section">
            <h2>INFORMATIONS DE STOCKAGE</h2>
            <div class="info">Date d'entrée: ${new Date(lot.storage.entryDate).toLocaleDateString('fr-FR')}</div>
            <div class="info">Température: ${lot.storage.storageTemperature}°C</div>
            <div class="info">ID Salle: ${lot.storage.storageRoomId}</div>
            <div class="info">Date de sortie: ${new Date(lot.storage.exitDate).toLocaleDateString('fr-FR')}</div>
          </div>

          <div class="section">
            <h2>INFORMATIONS D'EXPORT</h2>
            <div class="info">Date de chargement: ${new Date(lot.export.loadingDate).toLocaleDateString('fr-FR')}</div>
            <div class="info">ID Conteneur: ${lot.export.containerId}</div>
            <div class="info">Chauffeur: ${lot.export.driverName}</div>
            <div class="info">ID Véhicule: ${lot.export.vehicleId}</div>
            <div class="info">Destination: ${lot.export.destination}</div>
          </div>

          <div class="section">
            <h2>INFORMATIONS DE LIVRAISON</h2>
            <div class="info">Date de livraison estimée: ${new Date(lot.delivery.estimatedDeliveryDate).toLocaleDateString('fr-FR')}</div>
            <div class="info">Date de livraison réelle: ${lot.delivery.actualDeliveryDate ? new Date(lot.delivery.actualDeliveryDate).toLocaleDateString('fr-FR') : 'Non livré'}</div>
            <div class="info">Client: ${lot.delivery.clientName}</div>
            <div class="info">Statut: ${lot.delivery.received ? 'Livré' : 'En cours'}</div>
            <div class="info">Reçu par: ${lot.delivery.receivedBy || 'N/A'}</div>
          </div>

          <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
            Rapport généré le: ${new Date().toLocaleString('fr-FR')}
          </div>
        </body>
      </html>
    `;

    // Create a Blob with the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    return Promise.resolve(blob);
  }
}; 