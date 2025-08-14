'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Exercise } from '@/types';

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    primaryMuscleGroups: [''],
    secondaryMuscleGroups: [''],
    equipment: '',
    difficulty: 'Principiante' as 'Principiante' | 'Intermedio' | 'Avanzado',
    description: '',
    instructions: '',
    tips: '',
    mediaType: '',
    mediaURL: '',
    isActive: true
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // const router = useRouter(); // Comentado porque no se usa

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const exercisesQuery = collection(db, 'exercises');
      const snapshot = await getDocs(exercisesQuery);
      const exercisesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise));
      setExercises(exercisesData);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleMuscleGroupChange = (index: number, value: string, type: 'primary' | 'secondary') => {
    setFormData(prev => ({
      ...prev,
      [type === 'primary' ? 'primaryMuscleGroups' : 'secondaryMuscleGroups']: 
        type === 'primary' 
          ? prev.primaryMuscleGroups.map((_, i) => i === index ? value : _)
          : prev.secondaryMuscleGroups.map((_, i) => i === index ? value : _)
    }));
  };

  const addMuscleGroup = (type: 'primary' | 'secondary') => {
    setFormData(prev => ({
      ...prev,
      [type === 'primary' ? 'primaryMuscleGroups' : 'secondaryMuscleGroups']: 
        [...(type === 'primary' ? prev.primaryMuscleGroups : prev.secondaryMuscleGroups), '']
    }));
  };

  const removeMuscleGroup = (index: number, type: 'primary' | 'secondary') => {
    setFormData(prev => ({
      ...prev,
      [type === 'primary' ? 'primaryMuscleGroups' : 'secondaryMuscleGroups']: 
        (type === 'primary' ? prev.primaryMuscleGroups : prev.secondaryMuscleGroups).filter((_, i) => i !== index)
    }));
  };

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let mediaURL = formData.mediaURL;
      
      // Si hay un archivo seleccionado, subirlo primero
      if (selectedFile) {
        mediaURL = await uploadFile(selectedFile);
      }

      const exerciseData = {
        ...formData,
        primaryMuscleGroups: formData.primaryMuscleGroups.filter(g => g.trim() !== ''),
        secondaryMuscleGroups: formData.secondaryMuscleGroups.filter(g => g.trim() !== ''),
        mediaURL: mediaURL,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'exercises'), exerciseData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        primaryMuscleGroups: [''],
        secondaryMuscleGroups: [''],
        equipment: '',
        difficulty: 'Principiante',
        description: '',
        instructions: '',
        tips: '',
        mediaType: '',
        mediaURL: '',
        isActive: true
      });
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await loadExercises();
    } catch (error: unknown) {
      console.error('Error creating exercise:', error);
      alert('Error al crear el ejercicio. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExercise) return;
    setLoading(true);

    try {
      let mediaURL = formData.mediaURL;
      
      // Si hay un archivo seleccionado, subirlo primero
      if (selectedFile) {
        mediaURL = await uploadFile(selectedFile);
      }

      const exerciseData = {
        ...formData,
        primaryMuscleGroups: formData.primaryMuscleGroups.filter(g => g.trim() !== ''),
        secondaryMuscleGroups: formData.secondaryMuscleGroups.filter(g => g.trim() !== ''),
        mediaURL: mediaURL,
        updatedAt: new Date()
      };

      await updateDoc(doc(db, 'exercises', selectedExercise.id), exerciseData);
      setShowEditModal(false);
      setSelectedExercise(null);
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await loadExercises();
    } catch (error: unknown) {
      console.error('Error updating exercise:', error);
      alert('Error al actualizar el ejercicio. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este ejercicio?')) {
      try {
        await deleteDoc(doc(db, 'exercises', exerciseId));
        await loadExercises();
      } catch (error: unknown) {
        console.error('Error deleting exercise:', error);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const allowedVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv'];
      
      if (!allowedImageTypes.includes(file.type) && !allowedVideoTypes.includes(file.type)) {
        alert('Tipo de archivo no válido. Solo se permiten imágenes (JPG, PNG, GIF, WEBP) y videos (MP4, AVI, MOV, WMV, FLV).');
        return;
      }
      
      // Validar tamaño (máximo 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        alert('El archivo es demasiado grande. El tamaño máximo es 50MB.');
        return;
      }
      
      setSelectedFile(file);
      setFormData(prev => ({
        ...prev,
        mediaType: file.type.startsWith('image/') ? 'image' : 'video'
      }));
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `exercises/${fileName}`);
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setIsUploading(false);
      setUploadProgress(100);
      return downloadURL;
    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      throw error;
    }
  };

  const openEditModal = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setFormData({
      name: exercise.name,
      primaryMuscleGroups: exercise.primaryMuscleGroups.length > 0 ? exercise.primaryMuscleGroups : [''],
      secondaryMuscleGroups: exercise.secondaryMuscleGroups.length > 0 ? exercise.secondaryMuscleGroups : [''],
      equipment: exercise.equipment,
      difficulty: exercise.difficulty,
      description: exercise.description,
      instructions: exercise.instructions,
      tips: exercise.tips || '',
      mediaType: exercise.mediaType || '',
      mediaURL: exercise.mediaURL || '',
      isActive: exercise.isActive
    });
    setShowEditModal(true);
  };

  if (loading && exercises.length === 0) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Gestión de Ejercicios
            </h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              + Crear Ejercicio
            </button>
          </div>

          {exercises.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay ejercicios</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comienza creando tu primer ejercicio.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ejercicio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Músculos Principales
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Equipamiento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dificultad
                      </th>
                                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         Estado
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         Media
                       </th>
                       <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                         Acciones
                       </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {exercises.map((exercise) => (
                      <tr key={exercise.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{exercise.name}</div>
                            <div className="text-sm text-gray-500">{exercise.description.substring(0, 50)}...</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {exercise.primaryMuscleGroups.join(', ')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{exercise.equipment}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            exercise.difficulty === 'Principiante' 
                              ? 'bg-green-100 text-green-800'
                              : exercise.difficulty === 'Intermedio'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {exercise.difficulty}
                          </span>
                        </td>
                                                 <td className="px-6 py-4 whitespace-nowrap">
                           <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                             exercise.isActive 
                               ? 'bg-green-100 text-green-800' 
                               : 'bg-red-100 text-red-800'
                           }`}>
                             {exercise.isActive ? 'Activo' : 'Inactivo'}
                           </span>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           {exercise.mediaURL ? (
                             <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                               {exercise.mediaType === 'image' ? '🖼️ Imagen' : '🎥 Video'}
                             </span>
                           ) : (
                             <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                               Sin media
                             </span>
                           )}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openEditModal(exercise)}
                              className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteExercise(exercise.id)}
                              className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal de Crear Ejercicio */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Crear Nuevo Ejercicio</h3>
                  <form onSubmit={handleCreateExercise} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Equipamiento *</label>
                        <input
                          type="text"
                          name="equipment"
                          required
                          value={formData.equipment}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Dificultad *</label>
                      <select
                        name="difficulty"
                        required
                        value={formData.difficulty}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                      >
                        <option value="Principiante">Principiante</option>
                        <option value="Intermedio">Intermedio</option>
                        <option value="Avanzado">Avanzado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Músculos Principales</label>
                      {formData.primaryMuscleGroups.map((muscle, index) => (
                        <div key={index} className="flex mt-1">
                          <input
                            type="text"
                            value={muscle}
                            onChange={(e) => handleMuscleGroupChange(index, e.target.value, 'primary')}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                            placeholder="Ej: Pecho, Tríceps"
                          />
                          <button
                            type="button"
                            onClick={() => removeMuscleGroup(index, 'primary')}
                            className="ml-2 px-3 py-2 text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addMuscleGroup('primary')}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Agregar músculo principal
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Músculos Secundarios</label>
                      {formData.secondaryMuscleGroups.map((muscle, index) => (
                        <div key={index} className="flex mt-1">
                          <input
                            type="text"
                            value={muscle}
                            onChange={(e) => handleMuscleGroupChange(index, e.target.value, 'secondary')}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                            placeholder="Ej: Hombros"
                          />
                          <button
                            type="button"
                            onClick={() => removeMuscleGroup(index, 'secondary')}
                            className="ml-2 px-3 py-2 text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addMuscleGroup('secondary')}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Agregar músculo secundario
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Descripción *</label>
                      <textarea
                        name="description"
                        required
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Instrucciones *</label>
                      <textarea
                        name="instructions"
                        required
                        value={formData.instructions}
                        onChange={handleInputChange}
                        rows={4}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Consejos</label>
                      <textarea
                        name="tips"
                        value={formData.tips}
                        onChange={handleInputChange}
                        rows={2}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Imagen o Video del Ejercicio</label>
                      <div className="mt-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleFileSelect}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Formatos permitidos: JPG, PNG, GIF, WEBP, MP4, AVI, MOV, WMV, FLV. Máximo 50MB.
                        </p>
                      </div>
                      
                      {selectedFile && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-800">
                            <strong>Archivo seleccionado:</strong> {selectedFile.name}
                          </p>
                          <p className="text-xs text-green-600">
                            Tamaño: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      )}
                      
                      {isUploading && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            <span className="text-sm text-blue-800">Subiendo archivo...</span>
                          </div>
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {formData.mediaURL && !selectedFile && (
                        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                          <p className="text-sm text-gray-800">
                            <strong>Media actual:</strong> {formData.mediaType === 'image' ? 'Imagen' : 'Video'}
                          </p>
                          {formData.mediaType === 'image' ? (
                            <img 
                              src={formData.mediaURL} 
                              alt="Ejercicio" 
                              className="mt-2 max-w-xs h-auto rounded-md"
                            />
                          ) : (
                            <video 
                              src={formData.mediaURL} 
                              controls 
                              className="mt-2 max-w-xs h-auto rounded-md"
                            />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Ejercicio Activo
                      </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                      >
                        {loading ? 'Creando...' : 'Crear Ejercicio'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Editar Ejercicio */}
          {showEditModal && selectedExercise && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Ejercicio</h3>
                  <form onSubmit={handleEditExercise} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Equipamiento *</label>
                        <input
                          type="text"
                          name="equipment"
                          required
                          value={formData.equipment}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Dificultad *</label>
                      <select
                        name="difficulty"
                        required
                        value={formData.difficulty}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                      >
                        <option value="Principiante">Principiante</option>
                        <option value="Intermedio">Intermedio</option>
                        <option value="Avanzado">Avanzado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Músculos Principales</label>
                      {formData.primaryMuscleGroups.map((muscle, index) => (
                        <div key={index} className="flex mt-1">
                          <input
                            type="text"
                            value={muscle}
                            onChange={(e) => handleMuscleGroupChange(index, e.target.value, 'primary')}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                            placeholder="Ej: Pecho, Tríceps"
                          />
                          <button
                            type="button"
                            onClick={() => removeMuscleGroup(index, 'primary')}
                            className="ml-2 px-3 py-2 text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addMuscleGroup('primary')}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Agregar músculo principal
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Músculos Secundarios</label>
                      {formData.secondaryMuscleGroups.map((muscle, index) => (
                        <div key={index} className="flex mt-1">
                          <input
                            type="text"
                            value={muscle}
                            onChange={(e) => handleMuscleGroupChange(index, e.target.value, 'secondary')}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                            placeholder="Ej: Hombros"
                          />
                          <button
                            type="button"
                            onClick={() => removeMuscleGroup(index, 'secondary')}
                            className="ml-2 px-3 py-2 text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addMuscleGroup('secondary')}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Agregar músculo secundario
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Descripción *</label>
                      <textarea
                        name="description"
                        required
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Instrucciones *</label>
                      <textarea
                        name="instructions"
                        required
                        value={formData.instructions}
                        onChange={handleInputChange}
                        rows={4}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Consejos</label>
                      <textarea
                        name="tips"
                        value={formData.tips}
                        onChange={handleInputChange}
                        rows={2}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Imagen o Video del Ejercicio</label>
                      <div className="mt-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleFileSelect}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Formatos permitidos: JPG, PNG, GIF, WEBP, MP4, AVI, MOV, WMV, FLV. Máximo 50MB.
                        </p>
                      </div>
                      
                      {selectedFile && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-800">
                            <strong>Archivo seleccionado:</strong> {selectedFile.name}
                          </p>
                          <p className="text-xs text-green-600">
                            Tamaño: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      )}
                      
                      {isUploading && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            <span className="text-sm text-blue-800">Subiendo archivo...</span>
                          </div>
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {formData.mediaURL && !selectedFile && (
                        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                          <p className="text-sm text-gray-800">
                            <strong>Media actual:</strong> {formData.mediaType === 'image' ? 'Imagen' : 'Video'}
                          </p>
                          {formData.mediaType === 'image' ? (
                            <img 
                              src={formData.mediaURL} 
                              alt="Ejercicio" 
                              className="mt-2 max-w-xs h-auto rounded-md"
                            />
                          ) : (
                            <video 
                              src={formData.mediaURL} 
                              controls 
                              className="mt-2 max-w-xs h-auto rounded-md"
                            />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Ejercicio Activo
                      </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowEditModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                      >
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
