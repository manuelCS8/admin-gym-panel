'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const { signInWithEmail } = useAuth();
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setDebugInfo('');
    
    try {
      await signInWithEmail(email, password);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found') {
        setError('Usuario no encontrado. Verifica tu correo electrónico.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Contraseña incorrecta.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Correo electrónico inválido.');
      } else if (error.code === 'auth/invalid-credential') {
        setError('Credenciales inválidas. Verifica tu correo y contraseña.');
      } else {
        setError(`Error al iniciar sesión: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserInFirestore = async () => {
    if (!email) {
      setDebugInfo('Por favor ingresa un email primero');
      return;
    }

    try {
      setDebugInfo('Verificando usuario en Firestore...');
      
      // Buscar por email en la colección users
      const usersRef = doc(db, 'users', '7bwyrfKfSfgl9nbzDXwf9uyZYwW2');
      const userDoc = await getDoc(usersRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setDebugInfo(`
          ✅ Usuario encontrado en Firestore:
          - UID: ${userDoc.id}
          - Email: ${userData.email}
          - Nombre: ${userData.displayName}
          - Rol: ${userData.role}
          - Status: ${userData.registrationStatus}
          - Activo: ${userData.isActive}
        `);
      } else {
        setDebugInfo('❌ Usuario NO encontrado en Firestore');
      }
    } catch (error: any) {
      setDebugInfo(`❌ Error verificando Firestore: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-red-600 rounded-lg flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Admin Gym Panel
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Panel de administración para Iconik Pro Gym
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSignIn}>
          {error && (
            <div className="bg-red-500 border border-red-400 text-white px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Correo Electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="emmanuelcastro404@gmail.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>

          {/* Botón de debug */}
          <div className="text-center">
            <button
              type="button"
              onClick={checkUserInFirestore}
              className="text-sm text-blue-400 hover:text-blue-300 mb-4"
            >
              🔍 Verificar usuario en Firestore
            </button>
            
            {debugInfo && (
              <div className="bg-gray-800 border border-gray-600 text-gray-300 px-4 py-3 rounded text-xs whitespace-pre-line">
                {debugInfo}
              </div>
            )}
            
            <div className="mt-4 space-y-2">
              <a 
                href="/create-admin-auth" 
                className="text-sm text-green-400 hover:text-green-300 block"
              >
                🔧 Crear cuenta en Firebase Auth
              </a>
              <a 
                href="/register" 
                className="text-sm text-blue-400 hover:text-blue-300 block"
              >
                📝 Completar registro (usuarios pendientes)
              </a>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Solo administradores autorizados pueden acceder
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
