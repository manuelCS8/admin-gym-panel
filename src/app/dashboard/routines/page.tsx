'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GymRoutine, Exercise, RoutineExercise } from '@/types';

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<GymRoutine[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<GymRoutine | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level: 'Principiante' as 'Principiante' | 'Intermedio' | 'Avanzado',
    objective: '',
    estimatedDuration: 60,
    exercises: [] as RoutineExercise[],
    isActive: true,
    isPublic: true
  });
  // const router = useRouter(); // Comentado porque no se usa

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar rutinas
      const routinesQuery = collection(db, 'routines');
      const routinesSnapshot = await getDocs(routinesQuery);
      const routinesData = routinesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GymRoutine));
      setRoutines(routinesData);

      // Cargar ejercicios
      const exercisesQuery = collection(db, 'exercises');
      const exercisesSnapshot = await getDocs(exercisesQuery);
      const exercisesData = exercisesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise));
      setExercises(exercisesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseInt(value) : value
    }));
  };

  const addExercise = () => {
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, {
        exerciseId: '',
        exerciseName: '',
        primaryMuscleGroups: [],
        equipment: '',
        difficulty: '',
        series: 3,
        reps: 10,
        restTime: 60,
        order: prev.exercises.length + 1,
        notes: ''
      }]
    }));
  };

  const removeExercise = (index: number) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const updateExercise = (index: number, field: keyof RoutineExercise, value: any) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) => 
        i === index ? { ...exercise, [field]: value } : exercise
      )
    }));
  };

  const handleExerciseSelect = (index: number, exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (exercise) {
      updateExercise(index, 'exerciseId', exerciseId);
      updateExercise(index, 'exerciseName', exercise.name);
      updateExercise(index, 'primaryMuscleGroups', exercise.primaryMuscleGroups);
      updateExercise(index, 'equipment', exercise.equipment);
      updateExercise(index, 'difficulty', exercise.difficulty);
    }
  };

  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const routineData = {
        ...formData,
        exercises: formData.exercises.filter(ex => ex.exerciseId !== ''),
        creatorType: 'GYM',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'routines'), routineData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        level: 'Principiante',
        objective: '',
        estimatedDuration: 60,
        exercises: [],
        isActive: true,
        isPublic: true
      });
      await loadData();
    } catch (error: any) {
      console.error('Error creating routine:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoutine) return;
    setLoading(true);

    try {
      const routineData = {
        ...formData,
        exercises: formData.exercises.filter(ex => ex.exerciseId !== ''),
        updatedAt: new Date()
      };

      await updateDoc(doc(db, 'routines', selectedRoutine.id), routineData);
      setShowEditModal(false);
      setSelectedRoutine(null);
      await loadData();
    } catch (error: any) {
      console.error('Error updating routine:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoutine = async (routineId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta rutina?')) {
      try {
        await deleteDoc(doc(db, 'routines', routineId));
        await loadData();
      } catch (error: any) {
        console.error('Error deleting routine:', error);
      }
    }
  };

  const openEditModal = (routine: GymRoutine) => {
    setSelectedRoutine(routine);
    setFormData({
      name: routine.name,
      description: routine.description,
      level: routine.level,
      objective: routine.objective,
      estimatedDuration: routine.estimatedDuration,
      exercises: routine.exercises.length > 0 ? routine.exercises : [],
      isActive: routine.isActive,
      isPublic: routine.isPublic
    });
    setShowEditModal(true);
  };

  if (loading && routines.length === 0) {
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
              Gestión de Rutinas
            </h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              + Crear Rutina
            </button>
          </div>

          {routines.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay rutinas</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comienza creando tu primera rutina.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rutina
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nivel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duración
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ejercicios
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {routines.map((routine) => (
                      <tr key={routine.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{routine.name}</div>
                            <div className="text-sm text-gray-500">{routine.description.substring(0, 50)}...</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            routine.level === 'Principiante' 
                              ? 'bg-green-100 text-green-800'
                              : routine.level === 'Intermedio'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {routine.level}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{routine.estimatedDuration} min</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{routine.exercises.length} ejercicios</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            routine.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {routine.isActive ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openEditModal(routine)}
                              className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteRoutine(routine.id)}
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

          {/* Modal de Crear Rutina */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Crear Nueva Rutina</h3>
                  <form onSubmit={handleCreateRoutine} className="space-y-4">
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
                        <label className="block text-sm font-medium text-gray-700">Nivel *</label>
                        <select
                          name="level"
                          required
                          value={formData.level}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                        >
                          <option value="Principiante">Principiante</option>
                          <option value="Intermedio">Intermedio</option>
                          <option value="Avanzado">Avanzado</option>
                        </select>
                      </div>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Objetivo *</label>
                        <input
                          type="text"
                          name="objective"
                          required
                          value={formData.objective}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                          placeholder="Ej: Ganar masa muscular"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Duración Estimada (min) *</label>
                        <input
                          type="number"
                          name="estimatedDuration"
                          required
                          value={formData.estimatedDuration}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                          min="15"
                          max="180"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          Rutina Activa
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="isPublic"
                          checked={formData.isPublic}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          Pública
                        </label>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Ejercicios</label>
                        <button
                          type="button"
                          onClick={addExercise}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          + Agregar Ejercicio
                        </button>
                      </div>
                      
                      {formData.exercises.map((exercise, index) => (
                        <div key={index} className="border border-gray-200 rounded-md p-4 mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Ejercicio *</label>
                              <select
                                value={exercise.exerciseId}
                                onChange={(e) => handleExerciseSelect(index, e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                                required
                              >
                                <option value="">Seleccionar ejercicio</option>
                                {exercises.map(ex => (
                                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Series *</label>
                              <input
                                type="number"
                                value={exercise.series}
                                onChange={(e) => updateExercise(index, 'series', parseInt(e.target.value))}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                                min="1"
                                max="10"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Repeticiones *</label>
                              <input
                                type="number"
                                value={exercise.reps}
                                onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value))}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                                min="1"
                                max="50"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Descanso (seg) *</label>
                              <input
                                type="number"
                                value={exercise.restTime}
                                onChange={(e) => updateExercise(index, 'restTime', parseInt(e.target.value))}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                                min="0"
                                max="300"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Orden *</label>
                              <input
                                type="number"
                                value={exercise.order}
                                onChange={(e) => updateExercise(index, 'order', parseInt(e.target.value))}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                                min="1"
                                required
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Notas</label>
                            <textarea
                              value={exercise.notes}
                              onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                              rows={2}
                              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                            />
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => removeExercise(index)}
                            className="mt-2 text-sm text-red-600 hover:text-red-800"
                          >
                            Eliminar ejercicio
                          </button>
                        </div>
                      ))}
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
                        {loading ? 'Creando...' : 'Crear Rutina'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Editar Rutina */}
          {showEditModal && selectedRoutine && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Rutina</h3>
                  <form onSubmit={handleEditRoutine} className="space-y-4">
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
                        <label className="block text-sm font-medium text-gray-700">Nivel *</label>
                        <select
                          name="level"
                          required
                          value={formData.level}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                        >
                          <option value="Principiante">Principiante</option>
                          <option value="Intermedio">Intermedio</option>
                          <option value="Avanzado">Avanzado</option>
                        </select>
                      </div>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Objetivo *</label>
                        <input
                          type="text"
                          name="objective"
                          required
                          value={formData.objective}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                          placeholder="Ej: Ganar masa muscular"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Duración Estimada (min) *</label>
                        <input
                          type="number"
                          name="estimatedDuration"
                          required
                          value={formData.estimatedDuration}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                          min="15"
                          max="180"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          Rutina Activa
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="isPublic"
                          checked={formData.isPublic}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          Pública
                        </label>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Ejercicios</label>
                        <button
                          type="button"
                          onClick={addExercise}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          + Agregar Ejercicio
                        </button>
                      </div>
                      
                      {formData.exercises.map((exercise, index) => (
                        <div key={index} className="border border-gray-200 rounded-md p-4 mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Ejercicio *</label>
                              <select
                                value={exercise.exerciseId}
                                onChange={(e) => handleExerciseSelect(index, e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                                required
                              >
                                <option value="">Seleccionar ejercicio</option>
                                {exercises.map(ex => (
                                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Series *</label>
                              <input
                                type="number"
                                value={exercise.series}
                                onChange={(e) => updateExercise(index, 'series', parseInt(e.target.value))}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                                min="1"
                                max="10"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Repeticiones *</label>
                              <input
                                type="number"
                                value={exercise.reps}
                                onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value))}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                                min="1"
                                max="50"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Descanso (seg) *</label>
                              <input
                                type="number"
                                value={exercise.restTime}
                                onChange={(e) => updateExercise(index, 'restTime', parseInt(e.target.value))}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                                min="0"
                                max="300"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Orden *</label>
                              <input
                                type="number"
                                value={exercise.order}
                                onChange={(e) => updateExercise(index, 'order', parseInt(e.target.value))}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                                min="1"
                                required
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Notas</label>
                            <textarea
                              value={exercise.notes}
                              onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                              rows={2}
                              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                            />
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => removeExercise(index)}
                            className="mt-2 text-sm text-red-600 hover:text-red-800"
                          >
                            Eliminar ejercicio
                          </button>
                        </div>
                      ))}
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
