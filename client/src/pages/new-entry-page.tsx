import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import { Farm } from "@shared/schema";

// Form schema for new entry
const newEntrySchema = z.object({
  farmId: z.string().min(1, "Veuillez sélectionner une ferme"),
  activityType: z.enum(["harvest", "package", "cool", "ship", "deliver"], {
    required_error: "Veuillez sélectionner un type d'activité",
  }),
  datePerformed: z.string().min(1, "Veuillez sélectionner une date"),
  quantity: z.string().min(1, "Veuillez entrer une quantité"),
  operatorName: z.string().min(2, "Veuillez entrer un nom d'opérateur"),
  notes: z.string().optional(),
  // For harvest activity (new lot creation)
  // These fields are only required for harvest activity
  lotNumber: z.string().optional(),
  harvestDate: z.string().optional(),
});

type NewEntryFormValues = z.infer<typeof newEntrySchema>;

export default function NewEntryPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Fetch farms for dropdown
  const { data: farms, isLoading: farmsLoading } = useQuery<Farm[]>({
    queryKey: ["/api/farms"],
  });
  
  // Form initialization
  const form = useForm<NewEntryFormValues>({
    resolver: zodResolver(newEntrySchema),
    defaultValues: {
      farmId: "",
      activityType: "harvest",
      datePerformed: new Date().toISOString().split('T')[0],
      quantity: "",
      operatorName: "",
      notes: "",
      lotNumber: "",
      harvestDate: new Date().toISOString().split('T')[0],
    },
  });
  
  // Watch activity type to conditionally render fields
  const activityType = form.watch("activityType");
  const isHarvest = activityType === "harvest";
  
  // Fetch lot number for non-harvest activities
  const [lotId, setLotId] = useState<string>("");
  
  // Mutations
  const createLotMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/lots", data);
      return await res.json();
    },
    onSuccess: (data) => {
      // If we created a new lot, also create the activity
      createActivityMutation.mutate({
        lotId: data.id,
        activityType: "harvest",
        datePerformed: data.harvestDate,
        quantity: parseInt(form.getValues("quantity")),
        operatorName: form.getValues("operatorName"),
        notes: form.getValues("notes"),
        attachments: [],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur lors de la création du lot",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const createActivityMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/lots/${data.lotId}/activities`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Activité enregistrée",
        description: "L'activité a été enregistrée avec succès",
      });
      
      // Invalidate queries and redirect
      queryClient.invalidateQueries({ queryKey: ["/api/lots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur lors de l'enregistrement de l'activité",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: NewEntryFormValues) => {
    if (isHarvest) {
      // Create a new lot
      const lotData = {
        farmId: parseInt(values.farmId),
        harvestDate: values.datePerformed,
        initialQuantity: parseInt(values.quantity),
        currentStatus: "harvested",
      };
      
      createLotMutation.mutate(lotData);
    } else {
      // Add activity to existing lot
      if (!lotId) {
        toast({
          title: "Veuillez sélectionner un lot",
          description: "Un lot est requis pour cette activité",
          variant: "destructive",
        });
        return;
      }
      
      const activityData = {
        lotId: parseInt(lotId),
        activityType: values.activityType,
        datePerformed: values.datePerformed,
        quantity: parseInt(values.quantity),
        operatorName: values.operatorName,
        notes: values.notes,
        attachments: [],
      };
      
      createActivityMutation.mutate(activityData);
    }
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setSelectedFiles(fileArray);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      <main className="flex-grow">
        <TopBar title="Nouvelle Entrée" subtitle="Enregistrer une nouvelle activité" />
        
        <div className="p-4 md:p-6">
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>Détails de l'Activité</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-neutral-50 p-4 rounded">
                    <h3 className="font-medium mb-4">Information de Base</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="farmId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ferme <span className="text-red-500">*</span></FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={farmsLoading}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez une ferme" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {farms?.map((farm) => (
                                  <SelectItem key={farm.id} value={farm.id.toString()}>
                                    {farm.name} ({farm.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {isHarvest ? (
                        <div>
                          <FormLabel>Numéro de Lot</FormLabel>
                          <div className="flex">
                            <Input
                              value="AV-YYMMDD-"
                              readOnly
                              className="w-1/2 bg-neutral-100"
                            />
                            <Input
                              value="XXX"
                              readOnly
                              className="w-1/2 bg-neutral-100"
                              placeholder="Numéro auto-généré"
                            />
                          </div>
                          <p className="text-xs text-neutral-500 mt-1">Auto-généré en fonction de la date</p>
                        </div>
                      ) : (
                        <FormField
                          control={form.control}
                          name="lotNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Numéro de Lot <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="AV-YYMMDD-XXX" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Activity Details */}
                  <div>
                    <h3 className="font-medium mb-4">Détails de l'Activité</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <FormField
                        control={form.control}
                        name="activityType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type d'Activité <span className="text-red-500">*</span></FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez une activité" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="harvest">Récolte</SelectItem>
                                <SelectItem value="package">Emballage</SelectItem>
                                <SelectItem value="cool">Refroidissement</SelectItem>
                                <SelectItem value="ship">Expédition</SelectItem>
                                <SelectItem value="deliver">Livraison</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="datePerformed"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantité (kg) <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Entrez la quantité" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="operatorName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Opérateur <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Nom de l'opérateur" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Additional Information */}
                  <div>
                    <h3 className="font-medium mb-4">Informations Additionnelles</h3>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Informations supplémentaires..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="mt-4">
                      <FormLabel>Joindre des documents</FormLabel>
                      <div className="border-2 border-dashed border-neutral-300 rounded p-4 text-center">
                        <Upload className="h-8 w-8 mx-auto text-neutral-400" />
                        <p className="mt-2 text-sm text-neutral-500">Glissez-déposez des fichiers ici ou</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => document.getElementById('file-upload')?.click()}
                        >
                          Parcourir les fichiers
                        </Button>
                        <input
                          id="file-upload"
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <p className="mt-1 text-xs text-neutral-400">PDF, JPG, PNG (max 5MB)</p>
                        
                        {selectedFiles.length > 0 && (
                          <div className="mt-4 text-left">
                            <p className="text-sm font-medium">Fichiers sélectionnés:</p>
                            <ul className="text-sm text-neutral-600">
                              {selectedFiles.map((file, index) => (
                                <li key={index} className="mt-1">
                                  {file.name} ({Math.round(file.size / 1024)} KB)
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Submit Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/")}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={createLotMutation.isPending || createActivityMutation.isPending}
                    >
                      {(createLotMutation.isPending || createActivityMutation.isPending) ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        "Enregistrer"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
