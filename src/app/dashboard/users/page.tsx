'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [membershipEndDate, setMembershipEndDate] = useState('');
  const [filter, setFilter] = useState<'all' | 'ADMIN' | 'MEMBER'>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Cargar usuarios completados de la colección users
      const usersQuery = query(
        collection(db, 'users'),
        where('registrationStatus', '==', 'COMPLETED')
      );
      const snapshot = await getDocs(usersQuery);
      const usersData = snapshot.docs.map(doc => ({ 
        id: doc.id,
        uid: doc.id, // El ID del documento es el UID
        ...doc.data() 
      } as any));
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isActive: !currentStatus,
        updatedAt: new Date()
      });
      await loadUsers(); // Recargar la lista
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      setShowDeleteModal(false);
      setSelectedUser(null);
      await loadUsers(); // Recargar la lista
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const openMembershipModal = (user: User) => {
    setEditingUser(user);
    setMembershipEndDate(dateToISOString(user.membershipEnd));
    setShowMembershipModal(true);
  };

  const handleUpdateMembership = async () => {
    if (!editingUser || !membershipEndDate) return;
    
    try {
      const userRef = doc(db, 'users', editingUser.uid);
      await updateDoc(userRef, {
        membershipEnd: new Date(membershipEndDate),
        updatedAt: new Date()
      });
      setShowMembershipModal(false);
      setEditingUser(null);
      setMembershipEndDate('');
      await loadUsers();
    } catch (error) {
      console.error('Error updating membership:', error);
    }
  };

  const handleCancelMembership = () => {
    setShowMembershipModal(false);
    setEditingUser(null);
    setMembershipEndDate('');
  };

  // Función helper para formatear fechas
  const formatDate = (dateField: any): string => {
    if (!dateField) return 'N/A';
    
    try {
      if (dateField.toDate) {
        // Es un Timestamp de Firebase
        return new Date(dateField.toDate()).toLocaleDateString('es-ES');
      } else {
        // Es un objeto Date normal
        return new Date(dateField).toLocaleDateString('es-ES');
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  // Función helper para convertir fecha a string ISO
  const dateToISOString = (dateField: any): string => {
    if (!dateField) return '';
    
    try {
      if (dateField.toDate) {
        // Es un Timestamp de Firebase
        return new Date(dateField.toDate()).toISOString().split('T')[0];
      } else {
        // Es un objeto Date normal
        return new Date(dateField).toISOString().split('T')[0];
      }
    } catch (error) {
      console.error('Error converting date to ISO:', error);
      return '';
    }
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    return user.role === filter;
  });

  if (loading) {
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
              Gestión de Usuarios
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Filtrar:</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'all' | 'ADMIN' | 'MEMBER')}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm text-gray-900 bg-white"
                >
                  <option value="all">Todos</option>
                  <option value="ADMIN">Administradores</option>
                  <option value="MEMBER">Miembros</option>
                </select>
              </div>
              <div className="text-sm text-gray-600">
                {filteredUsers.length} usuarios
              </div>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron usuarios con los filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha de Registro
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expiración Membresía
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Editar Membresía
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Eliminar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Membresía
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Desactivar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.uid} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user.profileImage ? (
                                <img className="h-10 w-10 rounded-full" src={user.profileImage} alt="" />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.membershipEnd)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => openMembershipModal(user)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                          >
                            Editar Membresía
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => openDeleteModal(user)}
                            className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                          >
                            Eliminar
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'ADMIN' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role === 'ADMIN' ? 'Administrador' : 'Miembro'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.membershipType === 'basic' 
                              ? 'bg-gray-100 text-gray-800'
                              : user.membershipType === 'premium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {user.membershipType === 'basic' ? 'Básica' : 
                             user.membershipType === 'premium' ? 'Premium' : 'VIP'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleToggleUserStatus(user.uid, user.isActive)}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              user.isActive
                                ? 'text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200'
                                : 'text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200'
                            }`}
                          >
                            {user.isActive ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal de confirmación de eliminación */}
          {showDeleteModal && selectedUser && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3 text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                    Confirmar eliminación
                  </h3>
                  <div className="mt-2 px-7 py-3">
                    <p className="text-sm text-gray-500">
                      ¿Estás seguro de que quieres eliminar al usuario <strong>{selectedUser.displayName}</strong>? 
                      Esta acción no se puede deshacer.
                    </p>
                  </div>
                  <div className="items-center px-4 py-3">
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={() => setShowDeleteModal(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleDeleteUser(selectedUser.uid)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Edición de Membresía */}
          {showMembershipModal && editingUser && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                    Editar Membresía
                  </h3>
                  <div className="mt-2 px-7 py-3">
                    <p className="text-sm text-gray-500 mb-4">
                      Editando membresía para: <strong>{editingUser.displayName}</strong>
                    </p>
                    
                    <div>
                      <label htmlFor="membershipEndDate" className="block text-sm font-medium text-gray-700 mb-2">
                        Nueva Fecha de Expiración
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          id="membershipEndDate"
                          value={membershipEndDate}
                          onChange={(e) => setMembershipEndDate(e.target.value)}
                          className="block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="items-center px-4 py-3">
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={handleCancelMembership}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleUpdateMembership}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Actualizar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
