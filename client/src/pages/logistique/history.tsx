import React, { useState, useEffect, ChangeEvent } from 'react';
import { Plus, Search, Folder, File, X, ArrowLeft, Calendar, Tag, Filter, ExternalLink, Grid, List, Upload, FileText } from 'lucide-react';
import { collection, addDoc, getDocs, query, where, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { firestore, auth, storage } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface ArchiveBox {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
  lastModified: Date;
  description?: string;
  items: ArchiveItem[];
  color: string;
  icon: string;
}

interface ArchiveItem {
  id: string;
  name: string;
  type: string;
  fileUrl?: string;
  createdAt: Date;
  status: 'pending' | 'validated' | 'rejected';
  category: string;
  description?: string;
  fileSize?: string;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

const LogisticsArchive: React.FC = () => {
  const [boxes, setBoxes] = useState<ArchiveBox[]>([]);
  const [selectedBox, setSelectedBox] = useState<ArchiveBox | null>(null);
  const [newBoxTitle, setNewBoxTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  // Load boxes on component mount
  useEffect(() => {
    loadBoxes();
  }, []);

  const loadBoxes = async () => {
    try {
      setIsLoading(true);
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Reference to the logistics-archives collection
      const boxesRef = collection(firestore, 'logistics-archives');
      
      try {
        // Try to get documents first
        const q = query(boxesRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        // If no documents exist, create a default archive box
        if (querySnapshot.empty) {
          const defaultBox: Omit<ArchiveBox, 'id'> = {
            title: 'General Archives',
            userId: user.uid,
            createdAt: new Date(),
            lastModified: new Date(),
            items: [],
            color: 'bg-blue-500',
            icon: 'Folder',
            description: 'Default archive for logistics documents'
          };
          
          const docRef = await addDoc(boxesRef, defaultBox);
          setBoxes([{ ...defaultBox, id: docRef.id }] as ArchiveBox[]);
        } else {
          // Load existing boxes
          const loadedBoxes = querySnapshot.docs.map(doc => {
            const boxData = doc.data();
            return {
              id: doc.id,
              ...boxData,
              createdAt: boxData.createdAt.toDate(),
              lastModified: boxData.lastModified?.toDate() || boxData.createdAt.toDate(),
              items: boxData.items || []
            } as ArchiveBox;
          });
          
          setBoxes(loadedBoxes);
        }
      } catch (firestoreError) {
        console.error('Firestore error:', firestoreError);
        setError('Unable to access archives. Please check your permissions.');
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load archives');
      console.error('Error loading archives:', err);
    } finally {
      setIsLoading(false);
    }
  };
  const createNewBox = async () => {
    try {
      if (!newBoxTitle.trim()) {
        setError('Box title is required');
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        setError('Please sign in to create an archive box');
        return;
      }

      const newBox: Omit<ArchiveBox, 'id'> = {
        title: newBoxTitle.trim(),
        userId: user.uid,
        createdAt: new Date(),
        lastModified: new Date(),
        items: [],
        color: 'bg-blue-500',
        icon: 'Folder',
        description: ''
      };

      const docRef = await addDoc(collection(firestore, 'logistics-archives'), newBox);
      const boxWithId = { ...newBox, id: docRef.id };
      setBoxes([...boxes, boxWithId as ArchiveBox]);
      setNewBoxTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create box');
    }
  };

  const deleteBox = async (boxId: string) => {
    try {
      await deleteDoc(doc(firestore, 'logistics-archives', boxId));
      setBoxes(boxes.filter(box => box.id !== boxId));
      if (selectedBox?.id === boxId) {
        setSelectedBox(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete box');
    }
  };

  const handleFileUpload = async (file: File, boxId: string) => {
    try {
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storagePath = `logistics-archives/${boxId}/${uniqueFileName}`;
      const storageRef = ref(storage, storagePath);

      setUploadProgress(prev => ({
        ...prev,
        [file.name]: {
          fileName: file.name,
          progress: 0,
          status: 'uploading'
        }
      }));

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: {
              fileName: file.name,
              progress,
              status: 'uploading'
            }
          }));
        },
        (error) => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: {
              fileName: file.name,
              progress: 0,
              status: 'error',
              error: error.message
            }
          }));
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          const newItem: ArchiveItem = {
            id: `${timestamp}`,
            name: file.name,
            type: file.type,
            fileUrl: downloadURL,
            createdAt: new Date(),
            status: 'pending',
            category: 'logistics',
            fileSize: formatFileSize(file.size)
          };

          const boxRef = doc(firestore, 'logistics-archives', boxId);
          const box = boxes.find(b => b.id === boxId);
          
          if (box) {
            const updatedItems = [...box.items, newItem];
            await updateDoc(boxRef, {
              items: updatedItems,
              lastModified: new Date()
            });

            setBoxes(boxes.map(b => 
              b.id === boxId 
                ? { ...b, items: updatedItems, lastModified: new Date() }
                : b
            ));
          }

          setUploadProgress(prev => ({
            ...prev,
            [file.name]: {
              fileName: file.name,
              progress: 100,
              status: 'completed'
            }
          }));
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const filteredBoxes = boxes.filter(box =>
    box.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    box.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading archives...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Logistics Archives</h1>
            <p className="text-gray-500 mt-1">Manage and organize your logistics documents</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="h-4 w-4 mr-2" /> : <Grid className="h-4 w-4 mr-2" />}
              {viewMode === 'grid' ? 'List view' : 'Grid view'}
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              placeholder="Search archives..."
              className="flex-1"
            />
            <Input
              value={newBoxTitle}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNewBoxTitle(e.target.value)}
              placeholder="New archive box title..."
              className="flex-1"
            />
            <Button onClick={createNewBox}>
              <Plus className="h-4 w-4 mr-2" />
              Create Box
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBoxes.map((box) => (
          <Card key={box.id} className="hover:shadow-lg transition-all">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className="p-3 rounded-lg mr-4 bg-blue-100 text-blue-600">
                    <Folder className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{box.title}</h3>
                    <p className="text-sm text-gray-500">
                      {box.items.length} document{box.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteBox(box.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {box.items.length > 0 && (
                <div className="mt-4">
                  <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {box.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex items-center py-1.5 text-sm">
                        <FileText className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="truncate">{item.name}</span>
                      </div>
                    ))}
                    {box.items.length > 3 && (
                      <div className="text-sm text-center mt-2 text-gray-500">
                        + {box.items.length - 3} more item{box.items.length - 3 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t">
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={() => setSelectedBox(box)}
                >
                  Open Box
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedBox && (
        <Dialog open={true} onOpenChange={() => setSelectedBox(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Folder className="h-5 w-5 mr-2 text-blue-600" />
                {selectedBox.title}
              </DialogTitle>
              <DialogDescription>
                Created on {selectedBox.createdAt.toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Input
                  type="file"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file, selectedBox.id);
                    }
                  }}
                  className="max-w-xs"
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
                    {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className={`${viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-2'}`}>
                {selectedBox.items.map((item) => (
                  <Card key={item.id} className={`${viewMode === 'list' ? 'flex items-center justify-between p-4' : 'p-4'}`}>
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-3 text-gray-400" />
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{item.createdAt.toLocaleDateString()}</span>
                          {item.fileSize && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{item.fileSize}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {item.fileUrl && (
                        <Button variant="outline" size="sm" onClick={() => window.open(item.fileUrl, '_blank')}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default LogisticsArchive;