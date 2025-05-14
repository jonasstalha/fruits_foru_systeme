import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Plus, ArrowLeft, Upload, Folder, FileText, File, Calendar, Tag, Bell, Grid, List, ChevronDown, ExternalLink, Filter } from 'lucide-react';
import { createArchiveBox, addItemToBox } from '../../lib/firebaseService';
import { collection, addDoc } from 'firebase/firestore';
import { firestore, auth } from '@/lib/firebase';

interface ArchiveItem {
  name: string;
  date: string;
  type: string;
  id: string;
}

interface ArchiveBox {
  title: string;
  items: ArchiveItem[];
  color: string;
  icon: string;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-lime-500', 'bg-pink-500'
];

const ICONS = [
  'Folder', 'FileText', 'File', 'Calendar'
];

const ArchiveSystem: React.FC = () => {
  const [boxes, setBoxes] = useState<ArchiveBox[]>([]);
  const [newBoxTitle, setNewBoxTitle] = useState<string>('');
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [newFileInput, setNewFileInput] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [notification, setNotification] = useState<{ message: string, type: string } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('date');
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [isBoxHovered, setIsBoxHovered] = useState<number | null>(null);

  useEffect(() => {
    const savedBoxes = localStorage.getItem('archiveBoxes');
    if (savedBoxes) {
      setBoxes(JSON.parse(savedBoxes));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('archiveBoxes', JSON.stringify(boxes));
  }, [boxes]);

  const showNotification = (message: string, type: string) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateBox = async () => {
    try {
      const newBox: ArchiveBox = {
        title: newBoxTitle,
        items: [],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        icon: ICONS[Math.floor(Math.random() * ICONS.length)],
      };

      const boxRef = await addDoc(collection(firestore, 'boxes'), {
        ...newBox,
        userId: auth.currentUser?.uid,
        createdAt: new Date(),
      });

      setBoxes((prevBoxes) => [...prevBoxes, { ...newBox, id: boxRef.id }]);
      setNewBoxTitle('');
      showNotification('Boîte créée avec succès', 'success');
    } catch (error) {
      console.error('Error creating box:', error);
      showNotification('Erreur lors de la création de la boîte', 'error');
    }
  };

  const handleAddItemToBox = async (boxIndex: number, itemName: string, type: string = 'unknown', file?: File): Promise<void> => {
    const updatedBoxes = [...boxes];
    const newItem = {
      name: itemName,
      date: new Date().toLocaleDateString(),
      type: type || itemName.split('.').pop() || 'unknown',
      id: generateId(),
    };

    try {
      const boxId = 'BOX_ID'; // Replace with the actual box ID from Firestore
      await addItemToBox(boxId, itemName, type, file, 'USER_ID'); // Replace 'USER_ID' with the authenticated user's ID

      updatedBoxes[boxIndex].items.push(newItem);
      setBoxes(updatedBoxes);
      showNotification(`"${itemName}" ajouté avec succès!`, 'success');
    } catch (error) {
      console.error('Error adding item to box:', error);
      showNotification('Erreur lors de l\'ajout du document', 'error');
    }
  };

  const handleFileSelection = async (boxIndex: number, e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (const file of Array.from(files)) {
        await handleAddItemToBox(boxIndex, file.name, file.type.split('/')[1], file);
      }
    }
  };

  const getFilteredItems = (): ArchiveItem[] => {
    if (selectedBoxIndex === null) return [];
    
    let items = boxes[selectedBoxIndex].items;
    
    // Apply search filter
    if (searchTerm) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    items = [...items].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'type') {
        return a.type.localeCompare(b.type);
      } else {
        // Default: sort by date (newest first)
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
    
    return items;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent, boxIndex: number): void => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        handleAddItemToBox(boxIndex, file.name, file.type.split('/')[1], file);
      });
    }
  };

  const toggleItemSelection = (itemId: string): void => {
    setSelectedItems((prev: string[]) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const deleteSelectedItems = () => {
    if (selectedBoxIndex === null) return;
    
    const updatedBoxes = [...boxes];
    updatedBoxes[selectedBoxIndex].items = updatedBoxes[selectedBoxIndex].items
      .filter(item => !selectedItems.includes(item.id));
    
    setBoxes(updatedBoxes);
    setSelectedItems([]);
    showNotification(`${selectedItems.length} document(s) supprimé(s)`, 'warning');
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Folder': return <Folder className="h-6 w-6" />;
      case 'FileText': return <FileText className="h-6 w-6" />;
      case 'File': return <File className="h-6 w-6" />;
      case 'Calendar': return <Calendar className="h-6 w-6" />;
      default: return <Folder className="h-6 w-6" />;
    }
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (type.includes('image') || ['jpg', 'png', 'gif', 'svg'].includes(type)) 
      return <File className="h-5 w-5 text-blue-500" />;
    if (type.includes('excel') || type === 'xlsx' || type === 'xls') 
      return <File className="h-5 w-5 text-green-500" />;
    if (type.includes('doc') || type === 'docx' || type === 'doc') 
      return <File className="h-5 w-5 text-indigo-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  if (selectedBoxIndex !== null && boxes[selectedBoxIndex]) {
    const currentBox = boxes[selectedBoxIndex];
    const filteredItems = getFilteredItems();

    return (
      <div className="w-full max-w-5xl mx-auto p-6 bg-gray-50 min-h-screen">
        {notification && (
          <div className={`fixed top-4 right-4 py-2 px-4 rounded-md shadow-md z-50 transition-all transform ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
            {notification.message}
          </div>
        )}
        
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => {
                setSelectedBoxIndex(null);
                setSearchTerm('');
                setSelectedItems([]);
              }}
              className="p-2 bg-white hover:bg-gray-100 rounded-full shadow-sm transition-all"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <div className="flex items-center">
              <div className={`p-2 rounded-lg mr-3 text-white ${currentBox.color}`}>
                {renderIcon(currentBox.icon)}
              </div>
              <h2 className="text-2xl font-bold text-gray-800">{currentBox.title}</h2>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 bg-white hover:bg-gray-100 rounded-full shadow-sm transition-all"
            >
              {viewMode === 'grid' ? 
                <List className="h-5 w-5 text-gray-700" /> : 
                <Grid className="h-5 w-5 text-gray-700" />
              }
            </button>
            <button 
              onClick={() => setFilterOpen(!filterOpen)}
              className="p-2 bg-white hover:bg-gray-100 rounded-full shadow-sm transition-all"
            >
              <Filter className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex items-center p-3 border-b">
              <Search className="h-5 w-5 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Rechercher un document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 outline-none"
              />
            </div>
            
            {filterOpen && (
              <div className="p-4 border-b bg-gray-50 animate-fadeIn">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trier par
                    </label>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 
                        focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                      >
                        <option value="date">Date (récent)</option>
                        <option value="name">Nom</option>
                        <option value="type">Type</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Filtrer par type
                    </label>
                    <div className="relative">
                      <select
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 
                        focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                      >
                        <option value="">Toutes les catégories</option>
                        {Array.from(new Set(currentBox.items.map(item => item.type))).map((category, index) => (
                          <option key={index} value={category}>{category}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedItems.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white py-3 px-6 rounded-lg shadow-lg z-10 flex items-center space-x-4 animate-slideUp">
            <span className="text-sm font-medium">{selectedItems.length} éléments sélectionnés</span>
            <button
              onClick={deleteSelectedItems}
              className="py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Supprimer
            </button>
            <button
              onClick={() => setSelectedItems([])}
              className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Annuler
            </button>
          </div>
        )}

        <div 
          className="mb-8 bg-white rounded-xl shadow-sm overflow-hidden border"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, selectedBoxIndex)}
        >
          {isDragging && (
            <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-blue-500 border-dashed rounded-xl flex items-center justify-center z-10">
              <div className="text-blue-500 font-medium flex flex-col items-center">
                <Upload className="h-12 w-12 mb-2" />
                <span>Déposez vos fichiers ici</span>
              </div>
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <File className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun document trouvé</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-4">
                {searchTerm 
                  ? "Essayez de modifier vos critères de recherche."
                  : "Commencez par ajouter des documents à cette boîte d'archives."}
              </p>
              <button
                onClick={() => setIsFormOpen(true)}
                className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un document
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className={`bg-white rounded-lg border shadow-sm overflow-hidden hover:shadow-md transition-all ${
                    selectedItems.includes(item.id) ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => toggleItemSelection(item.id)}
                >
                  <div className="p-4 flex flex-col items-center">
                    <div className="h-16 w-16 flex items-center justify-center mb-3">
                      {getFileIcon(item.type)}
                    </div>
                    <h3 className="font-medium text-center truncate w-full" title={item.name}>
                      {item.name}
                    </h3>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <Tag className="h-3 w-3 mr-1" />
                      <span>{item.type}</span>
                      <span className="mx-2">•</span>
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{item.date}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 flex justify-between border-t">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const file = new Blob([item.name], { type: item.type });
                        const fileURL = URL.createObjectURL(file);
                        window.open(fileURL, '_blank');
                      }}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Ouvrir
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const updatedBoxes = [...boxes];
                        updatedBoxes[selectedBoxIndex].items.splice(itemIndex, 1);
                        setBoxes(updatedBoxes);
                        showNotification(`"${item.name}" supprimé`, 'warning');
                      }}
                      className="px-3 py-1 text-xs bg-transparent hover:bg-gray-200 text-gray-600 rounded-md"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 divide-y">
              {filteredItems.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className={`flex items-center justify-between p-3 hover:bg-gray-50 transition-colors ${
                    selectedItems.includes(item.id) ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => toggleItemSelection(item.id)}
                >
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex items-center justify-center mr-3">
                      {getFileIcon(item.type)}
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Tag className="h-3 w-3 mr-1" />
                        <span>{item.type}</span>
                        <span className="mx-2">•</span>
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{item.date}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const file = new Blob([item.name], { type: item.type });
                        const fileURL = URL.createObjectURL(file);
                        window.open(fileURL, '_blank');
                      }}
                      className="py-1.5 px-3 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Ouvrir
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const updatedBoxes = [...boxes];
                        updatedBoxes[selectedBoxIndex].items.splice(itemIndex, 1);
                        setBoxes(updatedBoxes);
                        showNotification(`"${item.name}" supprimé`, 'warning');
                      }}
                      className="py-1.5 px-3 bg-transparent hover:bg-gray-100 text-red-500 text-sm rounded-md transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center mb-4 text-blue-600 font-medium"
          >
            {isFormOpen ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Fermer le formulaire
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un document
              </>
            )}
          </button>
          
          {isFormOpen && (
            <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100 animate-fadeIn">
              <h3 className="text-lg font-semibold mb-4">Ajouter un nouveau document</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const titleInput = form.elements.namedItem('fileTitle') as HTMLInputElement;
                  const categoryInput = form.elements.namedItem('fileCategory') as HTMLInputElement;
                  const fileInput = form.elements.namedItem('fileUpload') as HTMLInputElement;

                  if (!titleInput.value.trim() || !categoryInput.value.trim()) {
                    showNotification('Veuillez remplir tous les champs', 'warning');
                    return;
                  }

                  handleAddItemToBox(
                    selectedBoxIndex!,
                    `${titleInput.value} (${categoryInput.value})`,
                    categoryInput.value
                  );

                  form.reset();
                  setIsFormOpen(false);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fileTitle" className="block text-sm font-medium text-gray-700 mb-1">
                      Titre du fichier
                    </label>
                    <input
                      type="text"
                      id="fileTitle"
                      name="fileTitle"
                      placeholder="Entrez le titre du fichier"
                      className="block w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="fileCategory" className="block text-sm font-medium text-gray-700 mb-1">
                      Catégorie
                    </label>
                    <input
                      type="text"
                      id="fileCategory"
                      name="fileCategory"
                      placeholder="Ex: Facture, Image, PDF..."
                      className="block w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-700 mb-1">
                    Fichier
                  </label>
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      id="fileUpload"
                      name="fileUpload"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={(e) => handleFileSelection(selectedBoxIndex!, e)}
                    />
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600">Cliquez pour sélectionner</span> ou glissez-déposez vos fichiers ici
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, Images, Documents (max 10MB)
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Ajouter le document
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-gray-50 min-h-screen">
      {notification && (
        <div className={`fixed top-4 right-4 py-2 px-4 rounded-md shadow-md z-50 animate-fadeIn ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.message}
        </div>
      )}
      
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Archivage logistiqe</h1>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Créer une nouvelle boîte d'archives</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Titre de la boîte..."
            value={newBoxTitle}
            onChange={(e) => setNewBoxTitle(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleCreateBox}
            className="py-2 px-4 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center shadow-sm"
          >
            <Plus className="h-5 w-5 mr-2" />
            Créer une boîte
          </button>
        </div>
      </div>

      {boxes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed">
          <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Folder className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune boîte d'archives</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Créez votre première boîte d'archives pour commencer à organiser vos documents.
          </p>
          <button
            onClick={() => document.querySelector('input')?.focus()}
            className="py-2 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer maintenant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {boxes.map((box, index) => (
            <div 
              key={index} 
              className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all ${
                isBoxHovered === index ? 'transform scale-105' : ''
              }`}
              onMouseEnter={() => setIsBoxHovered(index)}
              onMouseLeave={() => setIsBoxHovered(null)}
            >
              <div className="p-6 flex justify-between items-start">
                <div className="flex items-start">
                  <div className={`p-3 rounded-lg mr-4 text-white ${box.color}`}>
                    {renderIcon(box.icon)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{box.title}</h3>
                    <p className="text-sm text-gray-500">
                      {box.items.length} document{box.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const updatedBoxes = [...boxes];
                    updatedBoxes.splice(index, 1);
                    setBoxes(updatedBoxes);
                    showNotification(`Boîte "${box.title}" supprimée`, 'warning');
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {box.items.length > 0 && (
                <div className="px-6 pb-4">
                  <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {box.items.slice(0, 3).map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center py-1.5 text-sm">
                        {getFileIcon(item.type)}
                        <span className="ml-2 truncate">{item.name}</span>
                      </div>
                    ))}
                    {box.items.length > 3 && (
                      <div className="text-sm text-center mt-2 text-gray-500 font-medium">
                        + {box.items.length - 3} document{box.items.length - 3 > 1 ? 's' : ''} supplémentaire{box.items.length - 3 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="p-4 border-t">
                <button
                  onClick={() => setSelectedBoxIndex(index)}
                  className="py-2 px-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg flex items-center justify-center transition-colors"
                >
                  Ouvrir
                  <ArrowLeft className="h-4 w-4 ml-2 transform rotate-180" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ArchiveSystem;