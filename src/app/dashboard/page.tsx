'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, GymRoutine, Exercise } from '@/types';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    admins: 0,
    members: 0,
    totalRoutines: 0,
    totalExercises: 0,
    pendingUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Cargar usuarios
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const users = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));

      // Cargar rutinas
      const routinesQuery = query(collection(db, 'routines'));
      const routinesSnapshot = await getDocs(routinesQuery);
      const routines = routinesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GymRoutine));

      // Cargar ejercicios
      const exercisesQuery = query(collection(db, 'exercises'));
      const exercisesSnapshot = await getDocs(exercisesQuery);
      const exercises = exercisesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise));

      setStats({
        totalUsers: users.length,
        admins: users.filter(user => user.role === 'ADMIN').length,
        members: users.filter(user => user.role === 'MEMBER').length,
        totalRoutines: routines.length,
        totalExercises: exercises.length,
        pendingUsers: users.filter(user => user.registrationStatus === 'PENDING').length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Estadísticas */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Estadísticas</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.totalUsers}</div>
                <div className="text-sm text-gray-600">Total Usuarios</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
                <div className="text-sm text-gray-600">Administradores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.members}</div>
                <div className="text-sm text-gray-600">Miembros</div>
              </div>
            </div>
          </div>

          {/* Gestión */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Gestión</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/dashboard/create-user" className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-green-900">Crear Usuario</h3>
                  <p className="text-sm text-green-600">Agregar nuevos miembros</p>
                </div>
              </Link>

              <Link href="/dashboard/pending-users" className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-orange-900">Usuarios Pendientes</h3>
                  <p className="text-sm text-orange-600">{stats.pendingUsers} usuarios por aprobar</p>
                </div>
              </Link>

              <Link href="/dashboard/users" className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-blue-900">Gestionar Miembros</h3>
                  <p className="text-sm text-blue-600">Administrar usuarios activos</p>
                </div>
              </Link>

              <Link href="/dashboard/exercises" className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-orange-900">Gestionar Ejercicios</h3>
                  <p className="text-sm text-orange-600">{stats.totalExercises} ejercicios disponibles</p>
                </div>
              </Link>

              <Link href="/dashboard/routines" className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-purple-900">Gestionar Rutinas</h3>
                  <p className="text-sm text-purple-600">{stats.totalRoutines} rutinas creadas</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => navigateTo('/dashboard')}
                className="flex items-center justify-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
                <span className="font-medium text-gray-900">Dashboard</span>
              </button>
              
              <button 
                onClick={() => navigateTo('/dashboard')}
                className="flex items-center justify-center p-4 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
              >
                <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium text-red-900">Gestión</span>
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
