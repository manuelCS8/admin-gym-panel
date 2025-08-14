import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from './firebase';
import { User } from '@/types';

export interface RegistrationData {
  email: string;
  displayName: string;
  age: number;
  password: string;
}

export class UserRegistrationService {
  /**
   * Verifica si existe un usuario pendiente y completa su registro
   */
  static async completePendingRegistration(registrationData: RegistrationData): Promise<{
    success: boolean;
    message: string;
    user?: any;
  }> {
    try {
      // 1. Verificar si existe en pendingUsers
      const pendingUserDoc = await getDoc(doc(db, 'pendingUsers', registrationData.email));
      
      if (!pendingUserDoc.exists()) {
        return {
          success: false,
          message: 'No existe un usuario pendiente con este email. Contacta al administrador.'
        };
      }

      const pendingUser = pendingUserDoc.data();

             // 2. Verificar que los datos coinciden exactamente
       if (pendingUser.displayName !== registrationData.displayName) {
         return {
           success: false,
           message: 'El nombre no coincide con el registro pendiente. Verifica que el nombre sea exactamente igual.'
         };
       }

      // 3. Crear cuenta en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        registrationData.email,
        registrationData.password
      );

      const firebaseUser = userCredential.user;

      // 4. Crear documento en users con estado COMPLETED
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        uid: firebaseUser.uid,
        email: registrationData.email,
        displayName: registrationData.displayName,
        age: registrationData.age,
        role: pendingUser.role,
        registrationStatus: 'COMPLETED',
        isActive: true,
        membershipType: pendingUser.membershipType || 'basic',
        membershipStart: pendingUser.membershipStart,
        membershipEnd: pendingUser.membershipEnd,
        createdAt: pendingUser.createdAt,
        updatedAt: new Date()
      });

      // 5. Eliminar de pendingUsers
      await deleteDoc(doc(db, 'pendingUsers', registrationData.email));

      return {
        success: true,
        message: 'Registro completado exitosamente. Ya puedes iniciar sesión.',
        user: firebaseUser
      };

    } catch (error: any) {
      console.error('Error completing registration:', error);
      
      // Manejar errores específicos de Firebase Auth
      if (error.code === 'auth/email-already-in-use') {
        return {
          success: false,
          message: 'Este email ya está registrado. Intenta iniciar sesión.'
        };
      } else if (error.code === 'auth/weak-password') {
        return {
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres.'
        };
      } else if (error.code === 'auth/invalid-email') {
        return {
          success: false,
          message: 'El formato del email no es válido.'
        };
      }

      return {
        success: false,
        message: `Error al completar el registro: ${error.message}`
      };
    }
  }

  /**
   * Verifica si un email tiene un registro pendiente
   */
  static async checkPendingUser(email: string): Promise<{
    exists: boolean;
    userData?: any;
  }> {
    try {
      const pendingUserDoc = await getDoc(doc(db, 'pendingUsers', email));
      
      if (pendingUserDoc.exists()) {
        return {
          exists: true,
          userData: pendingUserDoc.data()
        };
      }

      return {
        exists: false
      };
    } catch (error) {
      console.error('Error checking pending user:', error);
      return {
        exists: false
      };
    }
  }

  /**
   * Obtiene información de un usuario pendiente sin revelar datos sensibles
   */
     static async getPendingUserInfo(email: string): Promise<{
     exists: boolean;
     displayName?: string;
     role?: string;
   }> {
    try {
      const pendingUserDoc = await getDoc(doc(db, 'pendingUsers', email));
      
             if (pendingUserDoc.exists()) {
         const userData = pendingUserDoc.data();
         return {
           exists: true,
           displayName: userData.displayName,
           role: userData.role
         };
       }

      return {
        exists: false
      };
    } catch (error) {
      console.error('Error getting pending user info:', error);
      return {
        exists: false
      };
    }
  }
}
