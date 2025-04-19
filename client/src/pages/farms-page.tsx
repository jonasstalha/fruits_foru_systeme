import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Plus, MapPin, Edit2, Trash2, Loader2 } from "lucide-react";
import { farmSchema, Farm as FarmType } from "@shared/schema";
import { api, getFarms, addFarm, updateFarm, deleteFarm } from "@/lib/queryClient";
import { toast } from "sonner";

const FarmsPage = () => {
  const queryClient = useQueryClient();
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<FarmType | null>(null);
  
  // Fetch farms data
  const { data: farms = [], isLoading } = useQuery({
    queryKey: ['farms'],
    queryFn: () => api.get<FarmType[]>('/api/farms')
  });
  
  // Add farm form
  const addFarmForm = useForm<z.infer<typeof farmSchema>>({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
      code: "",
      active: true
    },
  });

  // Edit farm form
  const editFarmForm = useForm<z.infer<typeof farmSchema>>({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
      code: "",
      active: true
    },
  });

  // Add farm mutation
  const addFarmMutation = useMutation({
    mutationFn: (data: Omit<FarmType, 'id' | 'createdAt' | 'updatedAt'>) => 
      api.post<FarmType>('/api/farms', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      toast.success("Ferme ajoutée avec succès");
      addFarmForm.reset();
      setOpenAddDialog(false);
    },
    onError: (error) => {
      toast.error(`Erreur lors de l'ajout de la ferme: ${error.message}`);
    }
  });

  // Update farm mutation
  const updateFarmMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<FarmType> }) => 
      api.put<FarmType>(`/api/farms/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      toast.success("Ferme mise à jour avec succès");
      setOpenEditDialog(false);
      setSelectedFarm(null);
    },
    onError: (error) => {
      toast.error(`Erreur lors de la mise à jour de la ferme: ${error.message}`);
    }
  });

  // Delete farm mutation
  const deleteFarmMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/farms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      toast.success("Ferme supprimée avec succès");
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression de la ferme: ${error.message}`);
    }
  });

  const onAddFarmSubmit = (values: z.infer<typeof farmSchema>) => {
    // Generate a code based on the farm name
    const code = `F-${values.name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    // Create a new farm object with all required fields
    const newFarm = {
      name: values.name,
      location: values.location,
      description: values.description || "",
      code: code,
      active: values.active
    };
    
    // Log the data being sent to help with debugging
    console.log("Submitting farm data:", newFarm);
    
    // Submit the farm data
    addFarmMutation.mutate(newFarm);
  };

  const handleEditFarm = (farm: FarmType) => {
    setSelectedFarm(farm);
    editFarmForm.reset({
      name: farm.name,
      location: farm.location,
      description: farm.description || "",
      code: farm.code,
      active: farm.active
    });
    setOpenEditDialog(true);
  };

  const onEditFarmSubmit = (values: z.infer<typeof farmSchema>) => {
    if (!selectedFarm) return;
    
    // Create a new farm object with all required fields
    const updatedFarm = {
      name: values.name,
      location: values.location,
      description: values.description || "",
      code: values.code,
      active: values.active
    };
    
    // Log the data being sent to help with debugging
    console.log("Updating farm data:", updatedFarm);
    
    updateFarmMutation.mutate({
      id: selectedFarm.id,
      data: updatedFarm
    });
  };

  const handleDeleteFarm = (farmId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette ferme ?")) {
      deleteFarmMutation.mutate(farmId);
    }
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
                <FormField
                  control={addFarmForm.control}
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
                      <FormLabel className="font-normal">Ferme active</FormLabel>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={addFarmMutation.isPending}
                  >
                    {addFarmMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Création...
                      </>
                    ) : (
                      "Créer"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : farms.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 rounded-lg">
          <p className="text-neutral-500">Aucune ferme trouvée. Ajoutez votre première ferme.</p>
        </div>
      ) : (
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
      )}

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
              <FormField
                control={editFarmForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editFarmForm.control}
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
                    <FormLabel className="font-normal">Ferme active</FormLabel>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="submit"
                  disabled={updateFarmMutation.isPending}
                >
                  {updateFarmMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer"
                  )}
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