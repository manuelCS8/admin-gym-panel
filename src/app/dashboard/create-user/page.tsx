'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function CreateUserPage() {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    role: 'MEMBER' as 'MEMBER' | 'ADMIN',
    membershipStartDate: new Date().toISOString().split('T')[0],
    membershipEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días después
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseInt(value) : value
    }));
  };

  const handleRoleChange = (role: 'MEMBER' | 'ADMIN') => {
    setFormData(prev => ({
      ...prev,
      role
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Crear documento en la colección pendingUsers (no en users)
      await setDoc(doc(db, 'pendingUsers', formData.email), {
        email: formData.email,
        displayName: formData.displayName,
        role: formData.role,
        registrationStatus: 'PENDING',
        isActive: false, // Los usuarios pendientes no están activos hasta completar registro
        membershipType: 'basic',
        membershipStart: new Date(formData.membershipStartDate),
        membershipEnd: new Date(formData.membershipEndDate),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      setMessage('✅ Usuario pendiente creado exitosamente! El usuario deberá completar su registro.');
      
      // Limpiar formulario
      setFormData({
        displayName: '',
        email: '',
        role: 'MEMBER',
        membershipStartDate: new Date().toISOString().split('T')[0],
        membershipEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true
      });

      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push('/dashboard/pending-users');
      }, 2000);

    } catch (error: any) {
      console.error('Error creating pending user:', error);
      setMessage(`❌ Error al crear usuario pendiente: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Crear Nuevo Usuario
              </h1>
              <button
                onClick={() => router.push('/dashboard/users')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Volver a Usuarios
              </button>
            </div>

            {message && (
              <div className={`mb-6 px-4 py-3 rounded ${
                message.includes('✅') 
                  ? 'bg-green-500 border border-green-400 text-white' 
                  : 'bg-red-500 border border-red-400 text-white'
              }`}>
                {message}
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información Personal */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Información Personal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        id="displayName"
                        name="displayName"
                        required
                        value={formData.displayName}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 text-gray-900"
                        placeholder="Ej: Juan Pérez"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 text-gray-900"
                        placeholder="juan@email.com"
                      />
                    </div>


                  </div>
                </div>

                {/* Rol */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Rol
                  </label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => handleRoleChange('MEMBER')}
                      className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-colors ${
                        formData.role === 'MEMBER'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Miembro
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange('ADMIN')}
                      className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-colors ${
                        formData.role === 'ADMIN'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Administrador
                    </button>
                  </div>
                </div>

                {/* Membresía */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    Membresía
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="membershipStartDate" className="block text-sm font-medium text-gray-700">
                        Fecha de Inicio de Membresía
                      </label>
                      <div className="mt-1 relative">
                        <input
                          type="date"
                          id="membershipStartDate"
                          name="membershipStartDate"
                          required
                          value={formData.membershipStartDate}
                          onChange={handleInputChange}
                          className="block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-red-500 focus:border-red-500 text-gray-900"
                        />
                        <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="membershipEndDate" className="block text-sm font-medium text-gray-700">
                        Fecha de Fin de Membresía
                      </label>
                      <div className="mt-1 relative">
                        <input
                          type="date"
                          id="membershipEndDate"
                          name="membershipEndDate"
                          required
                          value={formData.membershipEndDate}
                          onChange={handleInputChange}
                          className="block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-red-500 focus:border-red-500 text-gray-900"
                        />
                        <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información Importante */}
                <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-700">
                        <strong>Flujo de Registro:</strong> Al crear este usuario, se marcará como "PENDIENTE". El usuario deberá completar su registro en la página de registro ingresando su nombre completo, email, edad y contraseña. Una vez completado, se activará automáticamente como miembro.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/users')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
