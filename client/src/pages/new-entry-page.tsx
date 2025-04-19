import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      // Create a copy of the form data to avoid modifying the state directly
      const updatedFormData = { ...formData };
      
      // Ensure lot numbers are consistent across all sections
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
      
      // Ensure box IDs are consistent
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
      
      // Use the addAvocadoTracking function directly
      await addAvocadoTracking(updatedFormData as AvocadoTracking)();
      
      toast({
        title: "Succès",
        description: "Le suivi des avocats a été enregistré avec succès",
      });
      
      // Redirect to the lots page
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
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
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
                <Label htmlFor="rejectedCount">Nombre d'avocats rejetés</Label>
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
        return (
          <Card>
            <CardHeader>
              <CardTitle>📦 Emballage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="packagingDate">Date d'emballage</Label>
                <Input
                  id="packagingDate"
                  type="datetime-local"
                  value={formData.packaging?.packagingDate}
                  onChange={(e) => handleChange("packaging", "packagingDate", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="boxId">ID de la boîte</Label>
                <Input
                  id="boxId"
                  value={formData.packaging?.boxId}
                  onChange={(e) => handleChange("packaging", "boxId", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="boxType">Type de boîte</Label>
                <Select
                  value={formData.packaging?.boxType || "case"}
                  onValueChange={(value) => handleChange("packaging", "boxType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type de boîte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="case">Caisse</SelectItem>
                    <SelectItem value="carton">Carton</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="netWeight">Poids net (kg)</Label>
                <Input
                  id="netWeight"
                  type="number"
                  value={formData.packaging?.netWeight}
                  onChange={(e) => handleChange("packaging", "netWeight", parseFloat(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avocadoCount">Nombre d'avocats</Label>
                <Select
                  value={formData.packaging?.avocadoCount?.toString() || "12"}
                  onValueChange={(value) => handleChange("packaging", "avocadoCount", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le nombre d'avocats" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 avocats</SelectItem>
                    <SelectItem value="12">12 avocats</SelectItem>
                    <SelectItem value="14">14 avocats</SelectItem>
                    <SelectItem value="16">16 avocats</SelectItem>
                    <SelectItem value="18">18 avocats</SelectItem>
                    <SelectItem value="20">20 avocats</SelectItem>
                    <SelectItem value="22">22 avocats</SelectItem>
                    <SelectItem value="24">24 avocats</SelectItem>
                    <SelectItem value="26">26 avocats</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Nouvelle entrée de suivi d'avocats</h2>
        
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Étape {currentStep} sur 7</span>
            <span className="text-sm text-muted-foreground">{Math.round((currentStep / 7) * 100)}% complété</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${(currentStep / 7) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Step indicators */}
        <div className="flex items-center justify-between mb-6">
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
              className={`flex flex-col items-center ${
                step.number === currentStep 
                  ? "text-primary font-medium" 
                  : step.number < currentStep 
                    ? "text-primary/70" 
                    : "text-muted-foreground"
              }`}
            >
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                  step.number === currentStep 
                    ? "bg-primary text-primary-foreground" 
                    : step.number < currentStep 
                      ? "bg-primary/20" 
                      : "bg-muted"
                }`}
              >
                {step.icon}
              </div>
              <span className="text-xs">{step.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card rounded-lg shadow-sm border p-6">
          {renderStep()}
        </div>

        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1 || isSubmitting}
            className="min-w-[120px]"
          >
            {currentStep === 1 ? "Début" : "Précédent"}
          </Button>
          {currentStep < 7 ? (
            <Button 
              type="button" 
              onClick={nextStep}
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              Suivant
            </Button>
          ) : (
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
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
