import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { Farm, Lot, AvocadoTracking, StatsData } from "@shared/schema";

// Helper function to convert Firestore timestamp to ISO string
const timestampToISOString = (timestamp: any) => {
  if (!timestamp) return new Date().toISOString();
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

// Helper function to convert Firestore document to Farm type
const convertFarmDoc = (doc: any): Farm => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    location: data.location,
    description: data.description || "",
    code: data.code,
    active: data.active !== false, // Default to true if not specified
    createdAt: timestampToISOString(data.createdAt),
    updatedAt: timestampToISOString(data.updatedAt)
  };
};

// Helper function to convert Firestore document to Lot type
const convertLotDoc = (doc: any): Lot => {
  const data = doc.data();
  return {
    id: doc.id,
    lotNumber: data.lotNumber,
    farmId: data.farmId,
    harvestDate: timestampToISOString(data.harvestDate),
    initialQuantity: data.initialQuantity,
    currentStatus: data.currentStatus,
    createdAt: timestampToISOString(data.createdAt),
    updatedAt: timestampToISOString(data.updatedAt),
    notes: data.notes || ""
  };
};

// Helper function to convert Firestore document to AvocadoTracking type
const convertAvocadoTrackingDoc = (doc: any): AvocadoTracking => {
  const data = doc.data();
  return {
    id: doc.id,
    harvest: {
      harvestDate: timestampToISOString(data.harvest.harvestDate),
      farmLocation: data.harvest.farmLocation,
      farmerId: data.harvest.farmerId,
      lotNumber: data.harvest.lotNumber,
      variety: data.harvest.variety
    },
    transport: {
      transportCompany: data.transport.transportCompany,
      driverName: data.transport.driverName,
      vehicleId: data.transport.vehicleId,
      departureDateTime: timestampToISOString(data.transport.departureDateTime),
      arrivalDateTime: timestampToISOString(data.transport.arrivalDateTime),
      temperature: data.transport.temperature
    },
    sorting: {
      sortingDate: timestampToISOString(data.sorting.sortingDate),
      staffInvolved: data.sorting.staffInvolved || [],
      qualityGrade: data.sorting.qualityGrade,
      rejectedCount: data.sorting.rejectedCount,
      notes: data.sorting.notes || ""
    },
    packaging: {
      packagingDate: timestampToISOString(data.packaging.packagingDate),
      boxId: data.packaging.boxId,
      workerIds: data.packaging.workerIds || [],
      netWeight: data.packaging.netWeight,
      avocadoCount: data.packaging.avocadoCount,
      boxType: data.packaging.boxType || "case"
    },
    storage: {
      entryDate: timestampToISOString(data.storage.entryDate),
      storageTemperature: data.storage.storageTemperature,
      storageRoomId: data.storage.storageRoomId,
      exitDate: timestampToISOString(data.storage.exitDate)
    },
    export: {
      loadingDate: timestampToISOString(data.export.loadingDate),
      containerId: data.export.containerId,
      driverName: data.export.driverName,
      vehicleId: data.export.vehicleId,
      destination: data.export.destination
    },
    delivery: {
      estimatedDeliveryDate: timestampToISOString(data.delivery.estimatedDeliveryDate),
      actualDeliveryDate: timestampToISOString(data.delivery.actualDeliveryDate),
      clientName: data.delivery.clientName,
      clientLocation: data.delivery.clientLocation,
      notes: data.delivery.notes || ""
    },
    createdAt: timestampToISOString(data.createdAt),
    updatedAt: timestampToISOString(data.updatedAt)
  };
};

// Farms API
export const getFarms = async (): Promise<Farm[]> => {
  try {
    const farmsRef = collection(db, "farms");
    const q = query(farmsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(convertFarmDoc);
  } catch (error) {
    console.error("Error getting farms:", error);
    throw error;
  }
};

export const addFarm = async (data: Omit<Farm, 'id' | 'createdAt' | 'updatedAt'>): Promise<Farm> => {
  try {
    const farmsRef = collection(db, "farms");
    const newFarm = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(farmsRef, newFarm);
    const docSnap = await getDoc(docRef);
    return convertFarmDoc(docSnap);
  } catch (error) {
    console.error("Error adding farm:", error);
    throw error;
  }
};

export const updateFarm = async (id: string, data: Partial<Omit<Farm, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Farm> => {
  try {
    const farmRef = doc(db, "farms", id);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    await updateDoc(farmRef, updateData);
    const docSnap = await getDoc(farmRef);
    return convertFarmDoc(docSnap);
  } catch (error) {
    console.error("Error updating farm:", error);
    throw error;
  }
};

export const deleteFarm = async (id: string): Promise<void> => {
  try {
    const farmRef = doc(db, "farms", id);
    await deleteDoc(farmRef);
  } catch (error) {
    console.error("Error deleting farm:", error);
    throw error;
  }
};

// Lots API
export const getLots = async (): Promise<Lot[]> => {
  try {
    const lotsRef = collection(db, "lots");
    const q = query(lotsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(convertLotDoc);
  } catch (error) {
    console.error("Error getting lots:", error);
    throw error;
  }
};

export const addLot = async (data: Omit<Lot, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lot> => {
  try {
    const lotsRef = collection(db, "lots");
    const newLot = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(lotsRef, newLot);
    const docSnap = await getDoc(docRef);
    return convertLotDoc(docSnap);
  } catch (error) {
    console.error("Error adding lot:", error);
    throw error;
  }
};

export const updateLot = async (id: string, data: Partial<Omit<Lot, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Lot> => {
  try {
    const lotRef = doc(db, "lots", id);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    await updateDoc(lotRef, updateData);
    const docSnap = await getDoc(lotRef);
    return convertLotDoc(docSnap);
  } catch (error) {
    console.error("Error updating lot:", error);
    throw error;
  }
};

export const deleteLot = async (id: string): Promise<void> => {
  try {
    const lotRef = doc(db, "lots", id);
    await deleteDoc(lotRef);
  } catch (error) {
    console.error("Error deleting lot:", error);
    throw error;
  }
};

// Avocado Tracking API
export const getAvocadoTrackingData = async (): Promise<AvocadoTracking[]> => {
  try {
    const trackingRef = collection(db, "avocadoTracking");
    const q = query(trackingRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(convertAvocadoTrackingDoc);
  } catch (error) {
    console.error("Error getting avocado tracking data:", error);
    throw error;
  }
};

export const addAvocadoTracking = async (data: Omit<AvocadoTracking, 'id' | 'createdAt' | 'updatedAt'>): Promise<AvocadoTracking> => {
  try {
    const trackingRef = collection(db, "avocadoTracking");
    const newTracking = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(trackingRef, newTracking);
    const docSnap = await getDoc(docRef);
    return convertAvocadoTrackingDoc(docSnap);
  } catch (error) {
    console.error("Error adding avocado tracking:", error);
    throw error;
  }
};

export const updateAvocadoTracking = async (id: string, data: Partial<Omit<AvocadoTracking, 'id' | 'createdAt' | 'updatedAt'>>): Promise<AvocadoTracking> => {
  try {
    const trackingRef = doc(db, "avocadoTracking", id);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    await updateDoc(trackingRef, updateData);
    const docSnap = await getDoc(trackingRef);
    return convertAvocadoTrackingDoc(docSnap);
  } catch (error) {
    console.error("Error updating avocado tracking:", error);
    throw error;
  }
};

export const deleteAvocadoTracking = async (id: string): Promise<void> => {
  try {
    const trackingRef = doc(db, "avocadoTracking", id);
    await deleteDoc(trackingRef);
  } catch (error) {
    console.error("Error deleting avocado tracking:", error);
    throw error;
  }
};

// Stats API
export const getStats = async (): Promise<StatsData> => {
  try {
    // Get active farms count
    const farmsRef = collection(db, "farms");
    const activeFarmsQuery = query(farmsRef, where("active", "==", true));
    const activeFarmsSnapshot = await getDocs(activeFarmsQuery);
    const activeFarmsCount = activeFarmsSnapshot.size;
    
    // Get total lots count
    const lotsRef = collection(db, "lots");
    const lotsSnapshot = await getDocs(lotsRef);
    const totalLotsCount = lotsSnapshot.size;
    
    // Get in transit lots count
    const inTransitQuery = query(lotsRef, where("currentStatus", "==", "shipped"));
    const inTransitSnapshot = await getDocs(inTransitQuery);
    const inTransitCount = inTransitSnapshot.size;
    
    // Get delivered today lots count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const deliveredTodayQuery = query(
      lotsRef, 
      where("currentStatus", "==", "delivered"),
      where("updatedAt", ">=", Timestamp.fromDate(today)),
      where("updatedAt", "<", Timestamp.fromDate(tomorrow))
    );
    const deliveredTodaySnapshot = await getDocs(deliveredTodayQuery);
    const deliveredTodayCount = deliveredTodaySnapshot.size;
    
    return {
      totalLots: totalLotsCount,
      activeFarms: activeFarmsCount,
      inTransit: inTransitCount,
      deliveredToday: deliveredTodayCount
    };
  } catch (error) {
    console.error("Error getting stats:", error);
    throw error;
  }
}; 