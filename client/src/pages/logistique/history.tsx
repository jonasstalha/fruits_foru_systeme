import React, { useState, useEffect } from 'react';
import { Plus, Search, Folder, File, X, ArrowLeft } from 'lucide-react';
import { collection, addDoc, getDocs, query, where, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { firestore, auth, storage } from '@/lib/firebase';

interface ArchiveBox {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
  items: ArchiveItem[];
}

interface ArchiveItem {
  id: string;
  name: string;
  type: string;
  fileUrl?: string;
  createdAt: Date;
}

const ArchiveSystem: React.FC = () => {
  const [boxes, setBoxes] = useState<ArchiveBox[]>([]);
  const [selectedBox, setSelectedBox] = useState<ArchiveBox | null>(null);
  const [newBoxTitle, setNewBoxTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load boxes on component mount
  useEffect(() => {
    loadBoxes();
  }, []);

  const loadBoxes = async () => {
    try {
      setIsLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const boxesRef = collection(firestore, 'boxes');
      const q = query(boxesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const loadedBoxes = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const boxData = doc.data();
          const itemsRef = collection(firestore, 'boxItems');
          const itemsQuery = query(itemsRef, where('boxId', '==', doc.id));
          const itemsSnapshot = await getDocs(itemsQuery);
          
          const items = itemsSnapshot.docs.map(itemDoc => ({
            id: itemDoc.id,
            ...itemDoc.data(),
            createdAt: itemDoc.data().createdAt?.toDate() || new Date()
          })) as ArchiveItem[];

          return {
            id: doc.id,
            ...boxData,
            createdAt: boxData.createdAt?.toDate() || new Date(),
            items
          } as ArchiveBox;
        })
      );

      setBoxes(loadedBoxes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load boxes');
    } finally {
      setIsLoading(false);
    }
  };

  const createBox = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      if (!newBoxTitle.trim()) {
        throw new Error('Box title is required');
      }

      const boxRef = await addDoc(collection(firestore, 'boxes'), {
        title: newBoxTitle.trim(),
        userId,
        createdAt: serverTimestamp()
      });

      const newBox: ArchiveBox = {
        id: boxRef.id,
        title: newBoxTitle.trim(),
        userId,
        createdAt: new Date(),
        items: []
      };

      setBoxes(prev => [...prev, newBox]);
      setNewBoxTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create box');
    }
  };

  const uploadFile = async (file: File, boxId: string, itemName: string, type: string, userId: string) => {
    try {
      // Convert file to base64
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      // Call Cloud Function
      const response = await fetch('https://us-central1-fruitsforyou-10acc.cloudfunctions.net/uploadFile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileData,
          boxId,
          itemName,
          type,
          userId
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update local state
      setBoxes(prevBoxes => prevBoxes.map(box => {
        if (box.id === boxId) {
          return {
            ...box,
            items: [...box.items, {
              id: result.itemId,
              name: itemName,
              type,
              fileUrl: result.fileUrl,
              createdAt: new Date()
            }]
          };
        }
        return box;
      }));

      return result.fileUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const deleteItem = async (boxId: string, itemId: string, fileUrl?: string) => {
    try {
      // Delete from Storage if file exists
      if (fileUrl) {
        const fileRef = ref(storage, fileUrl);
        await deleteObject(fileRef);
      }

      // Delete from Firestore
      const itemRef = collection(firestore, 'boxItems');
      const q = query(itemRef, where('id', '==', itemId));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      // Update local state
      setBoxes(prev => prev.map(box => {
        if (box.id === boxId) {
          return {
            ...box,
            items: box.items.filter(item => item.id !== itemId)
          };
        }
        return box;
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  const deleteBox = async (boxId: string) => {
    try {
      // Delete all items in the box
      const box = boxes.find(b => b.id === boxId);
      if (box) {
        for (const item of box.items) {
          await deleteItem(boxId, item.id, item.fileUrl);
        }
      }

      // Delete the box
      const boxRef = collection(firestore, 'boxes');
      const q = query(boxRef, where('id', '==', boxId));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      // Update local state
      setBoxes(prev => prev.filter(box => box.id !== boxId));
      if (selectedBox?.id === boxId) {
        setSelectedBox(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete box');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBox) return;

    try {
      await uploadFile(file, selectedBox.id, file.name, file.type, auth.currentUser?.uid || '');
    } catch (err) {
      console.error('Error uploading file:', err);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {selectedBox ? (
        // Box View
        <div>
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setSelectedBox(null)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Boxes
            </button>
            <h1 className="text-2xl font-bold">{selectedBox.title}</h1>
            <button
              onClick={() => deleteBox(selectedBox.id)}
              className="text-red-500 hover:text-red-700"
            >
              Delete Box
            </button>
          </div>

          <div className="mb-6">
            <input
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
            >
              <Plus className="w-5 h-5 mr-2" />
              Upload File
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedBox.items.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <File className="w-6 h-6 mr-3 text-gray-500" />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.type}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  {item.fileUrl && (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 mr-4"
                    >
                      View
                    </a>
                  )}
                  <button
                    onClick={() => deleteItem(selectedBox.id, item.id, item.fileUrl)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Boxes List View
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Archive Boxes</h1>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search boxes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              />
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="New box title..."
                  value={newBoxTitle}
                  onChange={(e) => setNewBoxTitle(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                />
                <button
                  onClick={createBox}
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Box
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boxes
              .filter((box) =>
                box.title.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((box) => (
                <div
                  key={box.id}
                  className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedBox(box)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Folder className="w-6 h-6 mr-3 text-gray-500" />
                      <h2 className="text-lg font-medium">{box.title}</h2>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBox(box.id);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">
                    {box.items.length} items
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchiveSystem; 