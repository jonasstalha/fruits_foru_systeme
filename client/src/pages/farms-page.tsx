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
  DialogFooter,
  DialogDescription
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
import { Plus, MapPin, Edit2, Trash2 } from "lucide-react";
import { farmSchema, Farm as FarmType } from "@shared/schema";

// Static data for farms
const STATIC_FARMS: FarmType[] = [
  {
    id: 1,
    name: "Ferme Atlas",
    code: "FA-001",
    location: "Marrakech",
    active: true,
    description: "Ferme spécialisée dans les avocats",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    name: "Ferme Sahara",
    code: "FS-002",
    location: "Agadir",
    active: true,
    description: "Ferme spécialisée dans les oranges",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const FarmsPage = () => {
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<FarmType | null>(null);
  const [farms, setFarms] = useState<FarmType[]>(STATIC_FARMS);
  
  // Add farm form
  const addFarmForm = useForm<z.infer<typeof farmSchema>>({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
    },
  });

  // Edit farm form
  const editFarmForm = useForm<z.infer<typeof farmSchema>>({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
    },
  });

  const onAddFarmSubmit = (values: z.infer<typeof farmSchema>) => {
    const newFarm: FarmType = {
      ...values,
      id: farms.length + 1,
      code: `FA-${String(farms.length + 1).padStart(3, '0')}`,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setFarms(prevFarms => [...prevFarms, newFarm]);
    addFarmForm.reset();
    setOpenAddDialog(false);
  };

  const handleEditFarm = (farm: FarmType) => {
    setSelectedFarm(farm);
    editFarmForm.reset({
      name: farm.name,
      location: farm.location,
      description: farm.description,
    });
    setOpenEditDialog(true);
  };

  const onEditFarmSubmit = (values: z.infer<typeof farmSchema>) => {
    if (!selectedFarm) return;
    
    const updatedFarm: FarmType = {
      ...selectedFarm,
      ...values,
      updatedAt: new Date().toISOString()
    };
    
    setFarms(farms.map(farm => 
      farm.id === selectedFarm.id ? updatedFarm : farm
    ));
    setOpenEditDialog(false);
    setSelectedFarm(null);
  };

  const handleDeleteFarm = (farmId: number) => {
    setFarms(farms.filter((farm: FarmType) => farm.id !== farmId));
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Fermes</h2>
        <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une ferme
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une ferme</DialogTitle>
              <DialogDescription>
                Remplissez les informations ci-dessous pour ajouter une nouvelle ferme.
              </DialogDescription>
            </DialogHeader>
            <Form {...addFarmForm}>
              <form onSubmit={addFarmForm.handleSubmit(onAddFarmSubmit)} className="space-y-4">
                <FormField
                  control={addFarmForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de la ferme</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addFarmForm.control}
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
                  control={addFarmForm.control}
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
        {farms.map((farm) => (
          <Card key={farm.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{farm.name}</CardTitle>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => handleEditFarm(farm)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDeleteFarm(farm.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center text-sm text-neutral-500">
                <MapPin className="h-4 w-4 mr-1" />
                {farm.location}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600">{farm.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-mono text-neutral-500">{farm.code}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  farm.active 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {farm.active ? "Active" : "Inactive"}
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between text-sm text-neutral-500">
              <span>Créé le {new Date(farm.createdAt || new Date()).toLocaleDateString()}</span>
              <span>Modifié le {new Date(farm.updatedAt || new Date()).toLocaleDateString()}</span>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la ferme</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la ferme ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <Form {...editFarmForm}>
            <form onSubmit={editFarmForm.handleSubmit(onEditFarmSubmit)} className="space-y-4">
              <FormField
                control={editFarmForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de la ferme</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editFarmForm.control}
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
                control={editFarmForm.control}
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

export default FarmsPage;