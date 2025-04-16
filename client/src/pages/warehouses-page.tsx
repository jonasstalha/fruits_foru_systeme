import { useState } from "react";
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

// Define warehouse schema
const warehouseSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  location: z.string().min(1, "La localisation est requise"),
  capacity: z.string().min(1, "La capacité est requise"),
  description: z.string().optional(),
});

type Warehouse = z.infer<typeof warehouseSchema> & {
  id: number;
  code: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

// Static data for warehouses
const STATIC_WAREHOUSES: Warehouse[] = [
  {
    id: 1,
    name: "Entrepôt Central",
    code: "WH-001",
    location: "Casablanca",
    capacity: "1000 tonnes",
    description: "Entrepôt principal pour le stockage des fruits",
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    name: "Entrepôt Nord",
    code: "WH-002",
    location: "Tanger",
    capacity: "500 tonnes",
    description: "Entrepôt pour la région nord",
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const WarehousesPage = () => {
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(STATIC_WAREHOUSES);
  
  // Add warehouse form
  const addWarehouseForm = useForm<z.infer<typeof warehouseSchema>>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: "",
      location: "",
      capacity: "",
      description: "",
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
    },
  });

  const onAddWarehouseSubmit = (values: z.infer<typeof warehouseSchema>) => {
    const newWarehouse: Warehouse = {
      ...values,
      id: warehouses.length + 1,
      code: `WH-${String(warehouses.length + 1).padStart(3, '0')}`,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setWarehouses(prevWarehouses => [...prevWarehouses, newWarehouse]);
    addWarehouseForm.reset();
    setOpenAddDialog(false);
  };

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    editWarehouseForm.reset({
      name: warehouse.name,
      location: warehouse.location,
      capacity: warehouse.capacity,
      description: warehouse.description,
    });
    setOpenEditDialog(true);
  };

  const onEditWarehouseSubmit = (values: z.infer<typeof warehouseSchema>) => {
    if (!selectedWarehouse) return;
    
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
  };

  const handleDeleteWarehouse = (warehouseId: number) => {
    setWarehouses(warehouses.filter(warehouse => warehouse.id !== warehouseId));
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {warehouses.map((warehouse) => (
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
              <span>Créé le {new Date(warehouse.createdAt || new Date()).toLocaleDateString()}</span>
              <span>Modifié le {new Date(warehouse.updatedAt || new Date()).toLocaleDateString()}</span>
            </CardFooter>
          </Card>
        ))}
      </div>

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