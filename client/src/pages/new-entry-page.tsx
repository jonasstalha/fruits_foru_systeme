import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { api, addAvocadoTracking } from "@/lib/queryClient";
import { AvocadoTracking, AvocadoVariety, QualityGrade } from "@shared/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

export default function NewEntryPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<AvocadoTracking>>({
    harvest: {
      harvestDate: "",
      farmLocation: "",
      farmerId: "",
      lotNumber: "",
      variety: "hass",
    },
    transport: {
      lotNumber: "",
      transportCompany: "",
      driverName: "",
      vehicleId: "",
      departureDateTime: "",
      arrivalDateTime: "",
    },
    sorting: {
      lotNumber: "",
      sortingDate: "",
      qualityGrade: "A",
      rejectedCount: 0,
    },
    packaging: {
      lotNumber: "",
      packagingDate: "",
      boxId: "",
      workerIds: [],
      netWeight: 0,
      avocadoCount: 0,
      boxType: "case",
    },
    storage: {
      boxId: "",
      entryDate: "",
      storageTemperature: 0,
      storageRoomId: "",
      exitDate: "",
    },
    export: {
      boxId: "",
      loadingDate: "",
      containerId: "",
      driverName: "",
      vehicleId: "",
      destination: "",
    },
    delivery: {
      boxId: "",
      estimatedDeliveryDate: "",
      actualDeliveryDate: "",
      clientName: "",
      clientLocation: "",
      notes: "",
    },
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const updatedFormData = { ...formData };
      
      const lotNumber = updatedFormData.harvest?.lotNumber;
      if (lotNumber) {
        if (updatedFormData.transport) {
          updatedFormData.transport.lotNumber = lotNumber;
        }
        if (updatedFormData.sorting) {
          updatedFormData.sorting.lotNumber = lotNumber;
        }
        if (updatedFormData.packaging) {
          updatedFormData.packaging.lotNumber = lotNumber;
        }
      }
      
      const boxId = updatedFormData.packaging?.boxId;
      if (boxId) {
        if (updatedFormData.storage) {
          updatedFormData.storage.boxId = boxId;
        }
        if (updatedFormData.export) {
          updatedFormData.export.boxId = boxId;
        }
        if (updatedFormData.delivery) {
          updatedFormData.delivery.boxId = boxId;
        }
      }

      const cleanData: Partial<AvocadoTracking> = {
        harvest: {
          harvestDate: updatedFormData.harvest?.harvestDate || "",
          farmLocation: updatedFormData.harvest?.farmLocation || "",
          farmerId: updatedFormData.harvest?.farmerId || "",
          lotNumber: updatedFormData.harvest?.lotNumber || "",
          variety: updatedFormData.harvest?.variety || "hass"
        },
        transport: {
          lotNumber: updatedFormData.transport?.lotNumber || "",
          transportCompany: updatedFormData.transport?.transportCompany || "",
          driverName: updatedFormData.transport?.driverName || "",
          vehicleId: updatedFormData.transport?.vehicleId || "",
          departureDateTime: updatedFormData.transport?.departureDateTime || "",
          arrivalDateTime: updatedFormData.transport?.arrivalDateTime || "",
          temperature: updatedFormData.transport?.temperature || 0
        },
        sorting: {
          lotNumber: updatedFormData.sorting?.lotNumber || "",
          sortingDate: updatedFormData.sorting?.sortingDate || "",
          qualityGrade: updatedFormData.sorting?.qualityGrade || "A",
          rejectedCount: updatedFormData.sorting?.rejectedCount || 0,
          notes: updatedFormData.sorting?.notes || ""
        },
        packaging: {
          lotNumber: updatedFormData.packaging?.lotNumber || "",
          packagingDate: updatedFormData.packaging?.packagingDate || "",
          boxId: updatedFormData.packaging?.boxId || "",
          workerIds: updatedFormData.packaging?.workerIds || [],
          netWeight: updatedFormData.packaging?.netWeight || 0,
          avocadoCount: updatedFormData.packaging?.avocadoCount || 0,
          boxType: updatedFormData.packaging?.boxType || "case"
        },
        storage: {
          boxId: updatedFormData.storage?.boxId || "",
          entryDate: updatedFormData.storage?.entryDate || "",
          storageTemperature: updatedFormData.storage?.storageTemperature || 0,
          storageRoomId: updatedFormData.storage?.storageRoomId || "",
          exitDate: updatedFormData.storage?.exitDate || ""
        },
        export: {
          boxId: updatedFormData.export?.boxId || "",
          loadingDate: updatedFormData.export?.loadingDate || "",
          containerId: updatedFormData.export?.containerId || "",
          driverName: updatedFormData.export?.driverName || "",
          vehicleId: updatedFormData.export?.vehicleId || "",
          destination: updatedFormData.export?.destination || ""
        },
        delivery: {
          boxId: updatedFormData.delivery?.boxId || "",
          estimatedDeliveryDate: updatedFormData.delivery?.estimatedDeliveryDate || "",
          actualDeliveryDate: updatedFormData.delivery?.actualDeliveryDate || "",
          clientName: updatedFormData.delivery?.clientName || "",
          clientLocation: updatedFormData.delivery?.clientLocation || "",
          notes: updatedFormData.delivery?.notes || ""
        }
      };
      
      await addAvocadoTracking(cleanData as AvocadoTracking)();
      
      toast({
        title: "Succès",
        description: "Le suivi des avocats a été enregistré avec succès",
      });
      
      setLocation("/lots");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'enregistrement",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (section: keyof AvocadoTracking, field: string, value: any) => {
    setFormData((prev) => {
      const updatedSection = {
        ...(prev[section] as Record<string, any> || {}),
        [field]: value,
      };
      return {
        ...prev,
        [section]: updatedSection,
      };
    });
  };

  const addNewPackage = () => {
    const newPackage: AvocadoTracking["packaging"] = {
      lotNumber: "",
      packagingDate: "",
      boxId: "",
      workerIds: [],
      netWeight: 0,
      avocadoCount: 12,
      boxType: "case",
    };
    setFormData((prev) => {
      const updatedPackaging = Array.isArray(prev.packaging) ? prev.packaging : [];
      return {
        ...prev,
        packaging: [...updatedPackaging, newPackage],
      };
    });
  };

  const removePackage = (index: number) => {
    if (!Array.isArray(formData.packaging)) return;
    const updated = formData.packaging.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      packaging: updated,
    }));
  };

  const handlePackageChange = (index: number, field: keyof AvocadoTracking["packaging"], value: any) => {
    if (!Array.isArray(formData.packaging)) return;
    const updated = [...formData.packaging];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({
      ...prev,
      packaging: updated,
    }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 7));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>📝 Récolte (Ferme)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="harvestDate">Date de récolte</Label>
                <Input
                  id="harvestDate"
                  type="datetime-local"
                  value={formData.harvest?.harvestDate}
                  onChange={(e) => handleChange("harvest", "harvestDate", e.target.value)}
                  required
                />
              </div>
      
              <div className="space-y-2">
                <Label htmlFor="farmLocation">Localisation de la ferme</Label>
                <Input
                  id="farmLocation"
                  value={formData.harvest?.farmLocation}
                  onChange={(e) => handleChange("harvest", "farmLocation", e.target.value)}
                  required
                />
              </div>
      
              <div className="space-y-2">
                <Label htmlFor="farmerId">ID Agriculteur</Label>
                <Input
                  id="farmerId"
                  value={formData.harvest?.farmerId}
                  onChange={(e) => handleChange("harvest", "farmerId", e.target.value)}
                  required
                />
              </div>
      
              <div className="space-y-2">
                <Label htmlFor="lotNumber">Numéro de lot</Label>
                <Input
                  id="lotNumber"
                  value={formData.harvest?.lotNumber}
                  onChange={(e) => handleChange("harvest", "lotNumber", e.target.value)}
                  required
                />
              </div>
      
              <div className="space-y-2">
                <Label htmlFor="avocadoType">Type d'avocat</Label>
                <Select
                  value={(formData.harvest as any)?.avocadoType || ""}
                  onValueChange={(value) => handleChange("harvest", "avocadoType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conventionnel">Conventionnel</SelectItem>
                    <SelectItem value="bio">Bio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
      
              <div className="space-y-2">
                <Label htmlFor="variety">Variété d'avocat</Label>
                <Select
                  value={formData.harvest?.variety}
                  onValueChange={(value) => handleChange("harvest", "variety", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une variété" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hass">Hass</SelectItem>
                    <SelectItem value="fuerte">Fuerte</SelectItem>
                    <SelectItem value="bacon">Bacon</SelectItem>
                    <SelectItem value="zutano">Zutano</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>🚛 Transport vers l'usine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transportCompany">Société de transport</Label>
                <Input
                  id="transportCompany"
                  value={formData.transport?.transportCompany}
                  onChange={(e) => handleChange("transport", "transportCompany", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="driverName">Nom du chauffeur</Label>
                <Input
                  id="driverName"
                  value={formData.transport?.driverName}
                  onChange={(e) => handleChange("transport", "driverName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleId">ID du véhicule</Label>
                <Input
                  id="vehicleId"
                  value={formData.transport?.vehicleId}
                  onChange={(e) => handleChange("transport", "vehicleId", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departureDateTime">Date et heure de départ</Label>
                <Input
                  id="departureDateTime"
                  type="datetime-local"
                  value={formData.transport?.departureDateTime}
                  onChange={(e) => handleChange("transport", "departureDateTime", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrivalDateTime">Date et heure d'arrivée</Label>
                <Input
                  id="arrivalDateTime"
                  type="datetime-local"
                  value={formData.transport?.arrivalDateTime}
                  onChange={(e) => handleChange("transport", "arrivalDateTime", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Température (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  value={formData.transport?.temperature}
                  onChange={(e) => handleChange("transport", "temperature", parseFloat(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>🏭 Tri et Qualité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sortingDate">Date de tri</Label>
                <Input
                  id="sortingDate"
                  type="datetime-local"
                  value={formData.sorting?.sortingDate}
                  onChange={(e) => handleChange("sorting", "sortingDate", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualityGrade">Grade de qualité</Label>
                <Select
                  value={formData.sorting?.qualityGrade}
                  onValueChange={(value) => handleChange("sorting", "qualityGrade", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Grade A</SelectItem>
                    <SelectItem value="B">Grade B</SelectItem>
                    <SelectItem value="C">Grade C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rejectedCount">avocats rejetés</Label>
                <Input
                  id="rejectedCount"
                  type="number"
                  value={formData.sorting?.rejectedCount}
                  onChange={(e) => handleChange("sorting", "rejectedCount", parseInt(e.target.value))}
                  required
                />
              </div>
            </CardContent>
          </Card>
        );

        case 4:
          const packages = Array.isArray(formData.packaging) ? formData.packaging : [];
        
          return (
            <Card>
              <CardHeader>
                <CardTitle>📦 Emballage</CardTitle>
                <CardDescription>Gérez les différents lots d'emballage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {packages.map((pkg, index) => (
                  <div key={index} className="border p-4 rounded-md space-y-4">
                    <h3 className="font-medium">Lot #{index + 1}</h3>
        
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`boxId-${index}`}>🔢 ID de la boîte</Label>
                        <Input
                          id={`boxId-${index}`}
                          value={pkg.boxId || ""}
                          onChange={(e) =>
                            handlePackageChange(index, "boxId", e.target.value)
                          }
                          placeholder="Ex: BX2024-0987"
                        />
                      </div>
        
                      <div className="space-y-2">
                        <Label htmlFor={`boxType-${index}`}>📦 Type de boîte</Label>
                        <Select
                          value={pkg.boxType || ""}
                          onValueChange={(value) =>
                            handlePackageChange(index, "boxType", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="caisse">Caisse en bois</SelectItem>
                            <SelectItem value="boite">Boîte carton</SelectItem>
                            <SelectItem value="palette">Palette</SelectItem>
                            <SelectItem value="sac">Sac plastique</SelectItem>
                            <SelectItem value="autre">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
        
                      <div className="space-y-2">
                        <Label htmlFor={`avocadoCount-${index}`}>🥑 Nombre d'avocats</Label>
                        <Select
                          value={pkg.avocadoCount?.toString() || ""}
                          onValueChange={(value) =>
                            handlePackageChange(index, "avocadoCount", parseInt(value))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            {[10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30].map((count) => (
                              <SelectItem key={count} value={count.toString()}>
                                {count} avocat{count > 1 ? "s" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
        
                      <div className="space-y-2">
                        <Label htmlFor={`netWeight-${index}`}>⚖️ Poids net (kg)</Label>
                        <Input
                          id={`netWeight-${index}`}
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={pkg.netWeight || ""}
                          onChange={(e) =>
                            handlePackageChange(index, "netWeight", parseFloat(e.target.value))
                          }
                        />
                      </div>
                    </div>
        
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePackage(index)}
                      className="text-red-500"
                    >
                      ❌ Supprimer ce lot
                    </Button>
                  </div>
                ))}
        
                <Button variant="secondary" onClick={addNewPackage}>
                  ➕ Ajouter un lot d'emballage
                </Button>
              </CardContent>
            </Card>
          );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle>❄️ Stockage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="entryDate">Date d'entrée</Label>
                <Input
                  id="entryDate"
                  type="datetime-local"
                  value={formData.storage?.entryDate}
                  onChange={(e) => handleChange("storage", "entryDate", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storageTemperature">Température de stockage (°C)</Label>
                <Input
                  id="storageTemperature"
                  type="number"
                  value={formData.storage?.storageTemperature}
                  onChange={(e) => handleChange("storage", "storageTemperature", parseFloat(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storageRoomId">ID de la salle de stockage</Label>
                <Input
                  id="storageRoomId"
                  value={formData.storage?.storageRoomId}
                  onChange={(e) => handleChange("storage", "storageRoomId", e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card>
            <CardHeader>
              <CardTitle>🚢 Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loadingDate">Date de chargement</Label>
                <Input
                  id="loadingDate"
                  type="datetime-local"
                  value={formData.export?.loadingDate}
                  onChange={(e) => handleChange("export", "loadingDate", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="containerId">ID du conteneur</Label>
                <Input
                  id="containerId"
                  value={formData.export?.containerId}
                  onChange={(e) => handleChange("export", "containerId", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  value={formData.export?.destination}
                  onChange={(e) => handleChange("export", "destination", e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>
        );

      case 7:
        return (
          <Card>
            <CardHeader>
              <CardTitle>📦 Livraison</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedDeliveryDate">Date de livraison estimée</Label>
                <Input
                  id="estimatedDeliveryDate"
                  type="datetime-local"
                  value={formData.delivery?.estimatedDeliveryDate}
                  onChange={(e) => handleChange("delivery", "estimatedDeliveryDate", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientName">Nom du client</Label>
                <Input
                  id="clientName"
                  value={formData.delivery?.clientName}
                  onChange={(e) => handleChange("delivery", "clientName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientLocation">Localisation du client</Label>
                <Input
                  id="clientLocation"
                  value={formData.delivery?.clientLocation}
                  onChange={(e) => handleChange("delivery", "clientLocation", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.delivery?.notes}
                  onChange={(e) => handleChange("delivery", "notes", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
      <div className="mb-8">

        <h2 className="text-3xl font-extrabold text-gray-800 mb-6">Nouvelle entrée de suivi d'avocats</h2>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-600">Étape {currentStep} sur 7</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / 7) * 100)}% complété</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-500 h-3 rounded-full transition-all duration-300" 
              style={{ width: `${(currentStep / 7) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          {[
            { number: 1, label: "Récolte", icon: "📝" },
            { number: 2, label: "Transport", icon: "🚛" },
            { number: 3, label: "Tri", icon: "🏭" },
            { number: 4, label: "Emballage", icon: "📦" },
            { number: 5, label: "Stockage", icon: "❄️" },
            { number: 6, label: "Export", icon: "🚢" },
            { number: 7, label: "Livraison", icon: "📦" }
          ].map((step) => (
            <div 
              key={step.number}
              className={`flex flex-col items-center text-center space-y-1 ${
                step.number === currentStep 
                  ? "text-blue-600 font-bold" 
                  : step.number < currentStep 
                    ? "text-blue-400" 
                    : "text-gray-400"
              }`}
            >
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                  step.number === currentStep 
                    ? "bg-blue-500 text-white" 
                    : step.number < currentStep 
                      ? "bg-blue-100" 
                      : "bg-gray-200"
                }`}
              >
                {step.icon}
              </div>
              <span className="text-xs font-medium">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {renderStep()}
        </div>

        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1 || isSubmitting}
            className="min-w-[120px] bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
          >
            {currentStep === 1 ? "Début" : "Précédent"}
          </Button>
          {currentStep < 7 ? (
            <Button 
              type="button" 
              onClick={nextStep}
              disabled={isSubmitting}
              className="min-w-[120px] bg-blue-500 hover:bg-blue-600 text-white"
            >
              Suivant
            </Button>
          ) : (
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px] bg-green-500 hover:bg-green-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
