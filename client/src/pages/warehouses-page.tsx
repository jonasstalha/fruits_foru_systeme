// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Warehouse, Edit2, Trash2 } from "lucide-react";

// Firebase configuration - replace with your config
const firebaseConfig = {
  apiKey: "AIzaSyC0bMWINNGLLS6bfnK-hfRQwHFnBSJqMhI",
  authDomain: "fruitsforyou-10acc.firebaseapp.com",
  projectId: "fruitsforyou-10acc",
  storageBucket: "fruitsforyou-10acc.firebasestorage.app",
  messagingSenderId: "774475210821",
  appId: "1:774475210821:web:b70ceab6562385fa5f032c",
  measurementId: "G-6EMQ9TRW9N"
};

// Initialize Firebase outside of the component
// This prevents re-initialization on each render
let firebaseApp;
try {
  firebaseApp = initializeApp(firebaseConfig);
} catch (error) {
  // Use existing app instance if it was already initialized
  firebaseApp = initializeApp(firebaseConfig, "[DEFAULT]");
}
const db = getFirestore(firebaseApp);

// Define warehouse schema
const warehouseSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  location: z.string().min(1, "La localisation est requise"),
  capacity: z.string().min(1, "La capacité est requise"),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

type Warehouse = z.infer<typeof warehouseSchema> & {
  id: string;
  code: string;
  createdAt: string;
  updatedAt: string;
};

const WarehousesPage = () => {
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add warehouse form
  const addWarehouseForm = useForm<z.infer<typeof warehouseSchema>>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: "",
      location: "",
      capacity: "",
      description: "",
      active: true
    },
  });

  // Edit warehouse form
  const editWarehouseForm = useForm<z.infer<typeof warehouseSchema>>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: "",
      location: "",
      capacity: "",
      description: "",
      active: true
    },
  });

  // Fetch warehouses from Firebase on component mount
  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const warehousesCollection = collection(db, "entrepots");
      const warehouseQuery = query(warehousesCollection, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(warehouseQuery);
      
      const warehousesData: Warehouse[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          location: data.location,
          capacity: data.capacity,
          description: data.description || "",
          code: data.code || "",
          active: data.active,
          createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : new Date().toISOString()
        };
      });
      
      setWarehouses(warehousesData);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    } finally {
      setLoading(false);
    }
  };

  const onAddWarehouseSubmit = async (values: z.infer<typeof warehouseSchema>) => {
    try {
      // Generate warehouse code
      const warehouseCode = `WH-${String(warehouses.length + 1).padStart(3, '0')}`;
      
      // Add doc to Firebase
      const docRef = await addDoc(collection(db, "entrepots"), {
        ...values,
        code: warehouseCode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Add the new warehouse to the local state
      const newWarehouse: Warehouse = {
        ...values,
        id: docRef.id,
        code: warehouseCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setWarehouses(prevWarehouses => [newWarehouse, ...prevWarehouses]);
      addWarehouseForm.reset();
      setOpenAddDialog(false);
    } catch (error) {
      console.error("Error adding warehouse:", error);
    }
  };

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    editWarehouseForm.reset({
      name: warehouse.name,
      location: warehouse.location,
      capacity: warehouse.capacity,
      description: warehouse.description,
      active: warehouse.active
    });
    setOpenEditDialog(true);
  };

  const onEditWarehouseSubmit = async (values: z.infer<typeof warehouseSchema>) => {
    if (!selectedWarehouse) return;
    
    try {
      const warehouseRef = doc(db, "warehouses", selectedWarehouse.id);
      await updateDoc(warehouseRef, {
        ...values,
        updatedAt: serverTimestamp()
      });
      
      const updatedWarehouse: Warehouse = {
        ...selectedWarehouse,
        ...values,
        updatedAt: new Date().toISOString()
      };
      
      setWarehouses(warehouses.map(warehouse => 
        warehouse.id === selectedWarehouse.id ? updatedWarehouse : warehouse
      ));
      
      setOpenEditDialog(false);
      setSelectedWarehouse(null);
    } catch (error) {
      console.error("Error updating warehouse:", error);
    }
  };

  const handleDeleteWarehouse = async (warehouseId: string) => {
    try {
      await deleteDoc(doc(db, "warehouses", warehouseId));
      setWarehouses(warehouses.filter(warehouse => warehouse.id !== warehouseId));
    } catch (error) {
      console.error("Error deleting warehouse:", error);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Entrepôts</h2>
        <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un entrepôt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un entrepôt</DialogTitle>
            </DialogHeader>
            <Form {...addWarehouseForm}>
              <form onSubmit={addWarehouseForm.handleSubmit(onAddWarehouseSubmit)} className="space-y-4">
                <FormField
                  control={addWarehouseForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'entrepôt</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addWarehouseForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localisation</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addWarehouseForm.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacité</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addWarehouseForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addWarehouseForm.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Entrepôt actif</FormLabel>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">
                    Créer
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.length > 0 ? (
            warehouses.map((warehouse) => (
              <Card key={warehouse.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{warehouse.name}</CardTitle>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => handleEditWarehouse(warehouse)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteWarehouse(warehouse.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-neutral-500">
                    <Warehouse className="h-4 w-4 mr-1" />
                    {warehouse.location}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600">{warehouse.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-mono text-neutral-500">{warehouse.code}</span>
                    <span className="text-sm text-neutral-500">Capacité: {warehouse.capacity}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      warehouse.active 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {warehouse.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between text-sm text-neutral-500">
                  <span>Créé le {new Date(warehouse.createdAt).toLocaleDateString()}</span>
                  <span>Modifié le {new Date(warehouse.updatedAt).toLocaleDateString()}</span>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center p-12 text-neutral-500">
              Aucun entrepôt trouvé. Ajoutez un nouveau entrepôt en cliquant sur le bouton ci-dessus.
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'entrepôt</DialogTitle>
          </DialogHeader>
          <Form {...editWarehouseForm}>
            <form onSubmit={editWarehouseForm.handleSubmit(onEditWarehouseSubmit)} className="space-y-4">
              <FormField
                control={editWarehouseForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l'entrepôt</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editWarehouseForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localisation</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editWarehouseForm.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacité</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editWarehouseForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editWarehouseForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Entrepôt actif</FormLabel>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">
                  Enregistrer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WarehousesPage;