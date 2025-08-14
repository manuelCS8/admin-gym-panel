// Tipos para el sistema de administración del gimnasio

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'ADMIN' | 'MEMBER';
  registrationStatus: 'PENDING' | 'COMPLETED' | 'INACTIVE';
  isActive: boolean;
  membershipType: 'basic' | 'premium' | 'vip';
  membershipEnd: Date;
  createdAt: Date;
  updatedAt?: Date;
  profileImage?: string;
  phone?: string;
}

export interface Exercise {
  id: string;
  name: string;
  primaryMuscleGroups: string[];
  secondaryMuscleGroups: string[];
  equipment: string;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  description: string;
  instructions: string;
  tips?: string;
  mediaType?: string;
  mediaURL?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface RoutineExercise {
  exerciseId: string;
  exerciseName: string;
  primaryMuscleGroups: string[];
  equipment: string;
  difficulty: string;
  series: number;
  reps: number;
  restTime: number; // en segundos
  order: number;
  notes?: string;
}

export interface GymRoutine {
  id: string;
  name: string;
  description: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  objective: string;
  estimatedDuration: number; // en minutos
  exercises: RoutineExercise[];
  creatorType: 'GYM';
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
  isActive: boolean;
  isPublic: boolean;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  totalRoutines: number;
  activeRoutines: number;
  totalExercises: number;
  activeExercises: number;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
