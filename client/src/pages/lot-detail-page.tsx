import { useParams } from "wouter";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Truck, 
  Package, 
  Box, 
  Ship, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MapPin,
  Thermometer,
  Droplets,
  Scale,
  Calendar,
  User,
  Building,
  FileText
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getAvocadoTrackingData } from "@/lib/queryClient";

export default function LotDetailPage() {
  const { id } = useParams(); // Get lot number from URL
  
  // Fetch all lots data and find the specific lot
  const { data: lots = [], isLoading: loading, error } = useQuery({
    queryKey: ['avocadoTracking'],
    queryFn: getAvocadoTrackingData()
  });

  // Find the specific lot by lot number
  const lot = lots.find(l => l.harvest.lotNumber === id);

  const getProgressPercentage = (lot) => {
    if (!lot) return 0;
    const steps = [
      lot.harvest.harvestDate,
      lot.transport.arrivalDateTime,
      lot.sorting.sortingDate,
      lot.packaging.packagingDate,
      lot.storage.entryDate,
      lot.export.loadingDate,
      lot.delivery.actualDeliveryDate
    ];
    const completedSteps = steps.filter(step => step).length;
    return (completedSteps / steps.length) * 100;
  };

  const getStatusBadge = (lot) => {
    if (!lot) return null;
    
    if (lot.delivery.actualDeliveryDate) {
      return <Badge className="bg-green-100 text-green-800">Livré</Badge>;
    }
    if (lot.export.loadingDate) {
      return <Badge className="bg-blue-100 text-blue-800">En Export</Badge>;
    }
    if (lot.storage.entryDate) {
      return <Badge className="bg-purple-100 text-purple-800">En Stockage</Badge>;
    }
    if (lot.packaging.packagingDate) {
      return <Badge className="bg-yellow-100 text-yellow-800">Emballé</Badge>;
    }
    if (lot.sorting.sortingDate) {
      return <Badge className="bg-orange-100 text-orange-800">Trié</Badge>;
    }
    if (lot.transport.arrivalDateTime) {
      return <Badge className="bg-indigo-100 text-indigo-800">Transporté</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Récolté</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "En attente";
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return "En attente";
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-500">Chargement des détails du lot...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            Impossible de charger les détails du lot. Veuillez réessayer plus tard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="p-4 md:p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lot non trouvé</AlertTitle>
          <AlertDescription>
            Le lot {id} n'existe pas ou n'a pas pu être trouvé.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/lots">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux lots
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const timelineSteps = [
    {
      title: "Récolte",
      date: lot.harvest.harvestDate,
      icon: <Clock className="h-5 w-5" />,
      completed: !!lot.harvest.harvestDate,
      details: `Ferme: ${lot.harvest.farmLocation} | Variété: ${lot.harvest.variety}`
    },
    {
      title: "Transport",
      date: lot.transport.arrivalDateTime,
      icon: <Truck className="h-5 w-5" />,
      completed: !!lot.transport.arrivalDateTime,
      details: `Véhicule: ${lot.transport.vehicleId || 'N/A'} | Chauffeur: ${lot.transport.driverName || 'N/A'}`
    },
    {
      title: "Tri",
      date: lot.sorting.sortingDate,
      icon: <Package className="h-5 w-5" />,
      completed: !!lot.sorting.sortingDate,
      details: `Grade: ${lot.sorting.qualityGrade || 'N/A'} | Rejetés: ${lot.sorting.rejectedQuantity || 0} kg`
    },
    {
      title: "Emballage",
      date: lot.packaging.packagingDate,
      icon: <Box className="h-5 w-5" />,
      completed: !!lot.packaging.packagingDate,
      details: `Poids net: ${lot.packaging.netWeight || 0} kg | Type: ${lot.packaging.packagingType || 'N/A'}`
    },
    {
      title: "Stockage",
      date: lot.storage.entryDate,
      icon: <Building className="h-5 w-5" />,
      completed: !!lot.storage.entryDate,
      details: `Zone: ${lot.storage.storageZone || 'N/A'} | Temp: ${lot.storage.temperature || 'N/A'}°C`
    },
    {
      title: "Export",
      date: lot.export.loadingDate,
      icon: <Ship className="h-5 w-5" />,
      completed: !!lot.export.loadingDate,
      details: `Destination: ${lot.export.destination || 'N/A'} | Container: ${lot.export.containerNumber || 'N/A'}`
    },
    {
      title: "Livraison",
      date: lot.delivery.actualDeliveryDate,
      icon: <CheckCircle2 className="h-5 w-5" />,
      completed: !!lot.delivery.actualDeliveryDate,
      details: `Client: ${lot.delivery.customerName || 'N/A'}`
    }
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/lots">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Lot {lot.harvest.lotNumber}</h1>
            <p className="text-neutral-500">Détails complets du suivi</p>
          </div>
        </div>
        {getStatusBadge(lot)}
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Progression Générale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progression totale</span>
              <span className="text-2xl font-bold">{Math.round(getProgressPercentage(lot))}%</span>
            </div>
            <Progress value={getProgressPercentage(lot)} className="h-3" />
            <p className="text-sm text-neutral-500">
              {timelineSteps.filter(step => step.completed).length} sur {timelineSteps.length} étapes complétées
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-neutral-500" />
              <div>
                <p className="text-sm font-medium">Ferme</p>
                <p className="text-lg">{lot.harvest.farmLocation}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-neutral-500" />
              <div>
                <p className="text-sm font-medium">Variété</p>
                <p className="text-lg">{lot.harvest.variety}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Scale className="h-5 w-5 text-neutral-500" />
              <div>
                <p className="text-sm font-medium">Poids Net</p>
                <p className="text-lg">{lot.packaging.netWeight || 0} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-neutral-500" />
              <div>
                <p className="text-sm font-medium">Grade</p>
                <p className="text-lg">{lot.sorting.qualityGrade || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Chronologie du Lot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {timelineSteps.map((step, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  step.completed 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-medium ${
                      step.completed ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </h3>
                    <span className={`text-sm ${
                      step.completed ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {formatDateShort(step.date)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{step.details}</p>
                  {step.completed && (
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(step.date)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Harvest Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Détails de la Récolte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Date de récolte:</span>
                <p>{formatDate(lot.harvest.harvestDate)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Ferme:</span>
                <p>{lot.harvest.farmLocation}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Variété:</span>
                <p>{lot.harvest.variety}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Producteur:</span>
                <p>{lot.harvest.farmerName || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transport Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="mr-2 h-5 w-5" />
              Détails du Transport
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Date d'arrivée:</span>
                <p>{formatDate(lot.transport.arrivalDateTime)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Véhicule:</span>
                <p>{lot.transport.vehicleId || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Chauffeur:</span>
                <p>{lot.transport.driverName || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Temperature:</span>
                <p>{lot.transport.transportTemperature ? `${lot.transport.transportTemperature}°C` : 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sorting Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Détails du Tri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Date de tri:</span>
                <p>{formatDate(lot.sorting.sortingDate)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Grade qualité:</span>
                <p>{lot.sorting.qualityGrade || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Quantité rejetée:</span>
                <p>{lot.sorting.rejectedQuantity || 0} kg</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Responsable:</span>
                <p>{lot.sorting.sortingOperator || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Packaging Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Box className="mr-2 h-5 w-5" />
              Détails de l'Emballage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Date d'emballage:</span>
                <p>{formatDate(lot.packaging.packagingDate)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Type d'emballage:</span>
                <p>{lot.packaging.packagingType || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Poids net:</span>
                <p>{lot.packaging.netWeight || 0} kg</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Nombre d'unités:</span>
                <p>{lot.packaging.packageCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="mr-2 h-5 w-5" />
              Détails du Stockage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Date d'entrée:</span>
                <p>{formatDate(lot.storage.entryDate)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Zone de stockage:</span>
                <p>{lot.storage.storageZone || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Température:</span>
                <p>{lot.storage.temperature ? `${lot.storage.temperature}°C` : 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Humidité:</span>
                <p>{lot.storage.humidity ? `${lot.storage.humidity}%` : 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Ship className="mr-2 h-5 w-5" />
              Détails de l'Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Date de chargement:</span>
                <p>{formatDate(lot.export.loadingDate)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Destination:</span>
                <p>{lot.export.destination || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Numéro de container:</span>
                <p>{lot.export.containerNumber || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Navire:</span>
                <p>{lot.export.vesselName || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Details */}
      {lot.delivery.actualDeliveryDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Détails de la Livraison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Date de livraison:</span>
                <p>{formatDate(lot.delivery.actualDeliveryDate)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Client:</span>
                <p>{lot.delivery.customerName || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Adresse de livraison:</span>
                <p>{lot.delivery.deliveryAddress || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}