# 🏋️ Admin Gym Panel - Iconik Pro

Panel de administración web para Iconik Pro Gym. Esta aplicación permite gestionar usuarios, rutinas y ejercicios desde cualquier navegador web.

## 🚀 Características

- **Autenticación con Google**: Login seguro usando Google OAuth
- **Gestión de Usuarios**: Crear, editar y gestionar usuarios del gimnasio
- **Gestión de Rutinas**: Crear y administrar rutinas de entrenamiento
- **Gestión de Ejercicios**: Agregar y editar ejercicios en la base de datos
- **Reportes**: Estadísticas básicas del sistema
- **Responsive**: Funciona en desktop, tablet y móvil
- **Tiempo Real**: Conectado a Firestore para datos en tiempo real

## 🛠️ Tecnologías

- **Next.js 15**: Framework de React
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos y diseño
- **Firebase**: Autenticación y base de datos
- **Firestore**: Base de datos NoSQL
- **Headless UI**: Componentes de interfaz

## 📋 Requisitos

- Node.js 18+ (recomendado 20+)
- npm o yarn
- Cuenta de Google para autenticación
- Proyecto Firebase configurado

## 🚀 Instalación

1. **Clonar el proyecto**:
```bash
git clone <repository-url>
cd admin-gym-web
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Configurar variables de entorno**:
Crear archivo `.env.local` en la raíz del proyecto:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=tu_measurement_id
```

4. **Ejecutar en desarrollo**:
```bash
npm run dev
```

5. **Abrir en navegador**:
```
http://localhost:3000
```

## 📱 Uso

### 1. **Iniciar Sesión**
- Accede a la aplicación
- Haz clic en "Iniciar sesión con Google"
- Usa tu cuenta de Google autorizada

### 2. **Dashboard Principal**
- Vista general del sistema
- Estadísticas rápidas
- Acciones rápidas para crear contenido

### 3. **Gestión de Usuarios**
- Ver lista de usuarios
- Crear nuevos usuarios
- Editar información de usuarios
- Cambiar estado (activo/pendiente/inactivo)

### 4. **Gestión de Rutinas**
- Crear rutinas oficiales
- Editar rutinas existentes
- Agregar ejercicios a rutinas
- Configurar series, repeticiones y descanso

### 5. **Gestión de Ejercicios**
- Agregar nuevos ejercicios
- Editar ejercicios existentes
- Configurar músculos trabajados
- Subir imágenes/videos de ejercicios

### 6. **Reportes**
- Estadísticas de usuarios
- Rutinas más populares
- Actividad del sistema

## 🔧 Estructura del Proyecto

```
src/
├── app/                    # Páginas de Next.js App Router
│   ├── dashboard/         # Páginas del dashboard
│   ├── login/            # Página de login
│   └── layout.tsx        # Layout principal
├── components/           # Componentes reutilizables
│   ├── DashboardLayout.tsx
│   └── ProtectedRoute.tsx
├── contexts/            # Contextos de React
│   └── AuthContext.tsx
├── lib/                 # Configuraciones y utilidades
│   └── firebase.ts
└── types/               # Tipos TypeScript
    └── index.ts
```

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Despliega automáticamente

### Netlify
1. Sube el código a GitHub
2. Conecta con Netlify
3. Configura variables de entorno
4. Despliega

### Firebase Hosting
```bash
npm run build
firebase deploy
```

## 🔒 Seguridad

- **Autenticación**: Solo usuarios autorizados pueden acceder
- **Autorización**: Verificación de roles de administrador
- **Firestore Rules**: Reglas de seguridad configuradas
- **HTTPS**: Conexión segura en producción

## 📊 Base de Datos

La aplicación usa **Firestore** con las siguientes colecciones:

- `users`: Información de usuarios
- `routines`: Rutinas de entrenamiento
- `exercises`: Ejercicios disponibles
- `userRoutines`: Rutinas personalizadas de usuarios

## 🎨 Personalización

### Colores
Los colores principales se pueden modificar en `tailwind.config.js`:
- Rojo principal: `#dc2626`
- Gris oscuro: `#111827`
- Gris claro: `#f3f4f6`

### Logo
Reemplaza el logo en `public/` y actualiza las referencias.

## 🐛 Solución de Problemas

### Error de Autenticación
- Verifica las variables de entorno de Firebase
- Asegúrate de que el dominio esté autorizado en Firebase Console

### Error de Base de Datos
- Verifica las reglas de Firestore
- Confirma que las colecciones existan

### Error de Build
- Verifica que Node.js sea versión 18+
- Limpia cache: `npm run clean`

## 📞 Soporte

Para soporte técnico o preguntas:
- Revisa la documentación de Firebase
- Consulta los logs de la consola del navegador
- Verifica la configuración de variables de entorno

## 🔄 Actualizaciones

Para actualizar la aplicación:
```bash
git pull origin main
npm install
npm run build
```

---

**¡Disfruta administrando tu gimnasio! 💪**
