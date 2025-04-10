import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import { Plus, Edit2, Loader2 } from "lucide-react";
import { farmSchema, Farm } from "@shared/schema";

export default function FarmsPage() {
  const { toast } = useToast();
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  
  // Fetch farms
  const { data: farms, isLoading } = useQuery<Farm[]>({
    queryKey: ["/api/farms"],
  });
  
  // Add farm form
  const addFarmForm = useForm<z.infer<typeof farmSchema>>({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      name: "",
      code: "",
      active: true,
    },
  });
  
  // Edit farm form
  const editFarmForm = useForm<z.infer<typeof farmSchema>>({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      name: "",
      code: "",
      active: true,
    },
  });
  
  // Create farm mutation
  const createFarmMutation = useMutation({
    mutationFn: async (data: z.infer<typeof farmSchema>) => {
      const res = await apiRequest("POST", "/api/farms", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Ferme créée",
        description: "La ferme a été créée avec succès",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/farms"] });
      addFarmForm.reset();
      setOpenAddDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création de la ferme",
        variant: "destructive",
      });
    },
  });
  
  // Update farm mutation
  const updateFarmMutation = useMutation({
    mutationFn: async (data: { id: number; farm: z.infer<typeof farmSchema> }) => {
      const res = await apiRequest("PUT", `/api/farms/${data.id}`, data.farm);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Ferme mise à jour",
        description: "La ferme a été mise à jour avec succès",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/farms"] });
      editFarmForm.reset();
      setOpenEditDialog(false);
      setEditingFarm(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour de la ferme",
        variant: "destructive",
      });
    },
  });
  
  // Handle add farm submit
  const onAddFarmSubmit = (values: z.infer<typeof farmSchema>) => {
    createFarmMutation.mutate(values);
  };
  
  // Handle edit farm submit
  const onEditFarmSubmit = (values: z.infer<typeof farmSchema>) => {
    if (editingFarm) {
      updateFarmMutation.mutate({ id: editingFarm.id, farm: values });
    }
  };
  
  // Handle edit farm click
  const handleEditFarm = (farm: Farm) => {
    setEditingFarm(farm);
    editFarmForm.reset({
      name: farm.name,
      code: farm.code,
      active: farm.active,
    });
    setOpenEditDialog(true);
  };
  
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      <main className="flex-grow">
        <TopBar title="Gérer les Fermes" subtitle="Ajouter et modifier les informations des fermes" />
        
        <div className="p-4 md:p-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between px-6">
              <CardTitle>Liste des Fermes</CardTitle>
              <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter une Ferme
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter une Nouvelle Ferme</DialogTitle>
                  </DialogHeader>
                  <Form {...addFarmForm}>
                    <form onSubmit={addFarmForm.handleSubmit(onAddFarmSubmit)} className="space-y-4">
                      <FormField
                        control={addFarmForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom de la Ferme <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Nom de la ferme" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addFarmForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code de la Ferme <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: FA-001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addFarmForm.control}
                        name="active"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 space-y-0">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">Ferme active</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter className="pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setOpenAddDialog(false)}
                        >
                          Annuler
                        </Button>
                        <Button
                          type="submit"
                          disabled={createFarmMutation.isPending}
                        >
                          {createFarmMutation.isPending ? (
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
            </CardHeader>
            
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Loading states
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-6 w-36" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : farms && farms.length > 0 ? (
                    farms.map((farm) => (
                      <TableRow key={farm.id}>
                        <TableCell className="font-medium">{farm.name}</TableCell>
                        <TableCell className="font-mono">{farm.code}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${farm.active ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-800'}`}>
                            {farm.active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center text-blue-500 hover:text-blue-700"
                            onClick={() => handleEditFarm(farm)}
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-neutral-500">
                        Aucune ferme trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            
            <CardFooter className="py-4 px-6 border-t text-sm text-neutral-500">
              Total: {farms?.length || 0} fermes
            </CardFooter>
          </Card>
        </div>
      </main>
      
      {/* Edit Farm Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la Ferme</DialogTitle>
          </DialogHeader>
          <Form {...editFarmForm}>
            <form onSubmit={editFarmForm.handleSubmit(onEditFarmSubmit)} className="space-y-4">
              <FormField
                control={editFarmForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de la Ferme <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Nom de la ferme" {...field} />
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
                    <FormLabel>Code de la Ferme <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: FA-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editFarmForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">Ferme active</FormLabel>
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpenEditDialog(false);
                    setEditingFarm(null);
                  }}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={updateFarmMutation.isPending}
                >
                  {updateFarmMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mise à jour...
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
}
