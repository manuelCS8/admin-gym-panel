'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRegistrationService } from '@/lib/userRegistrationService';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    age: 25,
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [pendingUserInfo, setPendingUserInfo] = useState<any>(null);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }));
  };

  const checkPendingUser = async () => {
    if (!formData.email) {
      setMessage('❌ Por favor ingresa un email primero');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await UserRegistrationService.getPendingUserInfo(formData.email);
      
             if (result.exists) {
         setPendingUserInfo(result);
         setFormData(prev => ({
           ...prev,
           displayName: result.displayName || ''
         }));
         setMessage('✅ Usuario pendiente encontrado. Completa tu registro.');
       } else {
        setPendingUserInfo(null);
        setMessage('❌ No existe un usuario pendiente con este email. Contacta al administrador.');
      }
    } catch (error) {
      setMessage('❌ Error al verificar usuario pendiente');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setMessage('❌ Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setMessage('❌ La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (!pendingUserInfo) {
      setMessage('❌ Primero verifica tu email como usuario pendiente');
      setLoading(false);
      return;
    }

    try {
      const result = await UserRegistrationService.completePendingRegistration({
        email: formData.email,
        displayName: formData.displayName,
        age: formData.age,
        password: formData.password
      });

      if (result.success) {
        setMessage('✅ ' + result.message);
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setMessage('❌ ' + result.message);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-red-600 rounded-lg flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Completar Registro
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Completa tu registro como usuario pendiente
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {message && (
            <div className={`px-4 py-3 rounded ${
              message.includes('✅') 
                ? 'bg-green-500 border border-green-400 text-white' 
                : 'bg-red-500 border border-red-400 text-white'
            }`}>
              {message}
            </div>
          )}
          
          {/* Verificar Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <div className="mt-1 flex">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="flex-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-l-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="tu@email.com"
              />
              <button
                type="button"
                onClick={checkPendingUser}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Verificando...' : 'Verificar'}
              </button>
            </div>
          </div>

          {/* Información del Usuario Pendiente */}
          {pendingUserInfo && (
            <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-blue-300">
                    <strong>Usuario Pendiente Encontrado:</strong>
                  </p>
                                           <p className="text-xs text-blue-400">
                           Nombre: {pendingUserInfo.displayName} | Rol: {pendingUserInfo.role === 'ADMIN' ? 'Administrador' : 'Miembro'}
                         </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Campos de Registro */}
          {pendingUserInfo && (
            <>
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-300">
                  Nombre Completo
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="Tu nombre completo"
                />
              </div>

              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-300">
                  Edad
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  required
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Contraseña (mínimo 6 caracteres)
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                  Confirmar Contraseña
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Completando registro...
                    </div>
                  ) : (
                    'Completar Registro'
                  )}
                </button>
              </div>
            </>
          )}
          
          <div className="text-center">
            <a 
              href="/login" 
              className="text-sm text-red-400 hover:text-red-300"
            >
              ← Volver al login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
