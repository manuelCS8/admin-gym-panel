'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export default function CreateAdminAuthPage() {
  const [email, setEmail] = useState('emmanuelcastro404@gmail.com');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('Emmanuel Castro Salvador');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Crear documento en Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: email,
        displayName: name,
        role: 'ADMIN',
        registrationStatus: 'COMPLETED',
        isActive: true,
        membershipType: 'basic',
        membershipEnd: new Date('2039-12-31'),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      setMessage('✅ Administrador creado exitosamente en Firebase Auth!');
      setPassword('');
    } catch (error: any) {
      console.error('Error creating admin:', error);
      if (error.code === 'auth/email-already-in-use') {
        setMessage('❌ El email ya está en uso en Firebase Auth');
      } else if (error.code === 'auth/weak-password') {
        setMessage('❌ La contraseña debe tener al menos 6 caracteres');
      } else {
        setMessage(`❌ Error: ${error.message}`);
      }
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Crear Cuenta en Firebase Auth
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Crear la cuenta de administrador en Firebase Auth
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleCreateAdmin}>
          {message && (
            <div className={`px-4 py-3 rounded ${
              message.includes('✅') 
                ? 'bg-green-500 border border-green-400 text-white' 
                : 'bg-red-500 border border-red-400 text-white'
            }`}>
              {message}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                Nombre Completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Emmanuel Castro Salvador"
              />
            </div>

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
                Contraseña (mínimo 6 caracteres)
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
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
                  Creando cuenta...
                </div>
              ) : (
                'Crear Cuenta en Firebase Auth'
              )}
            </button>
          </div>
          
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
