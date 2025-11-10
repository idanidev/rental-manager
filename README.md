# 🏠 Rental Manager - Sistema de Gestión de Alquileres

Sistema completo y profesional para gestionar propiedades de alquiler, habitaciones, inquilinos y finanzas.

## ✨ Características Principales

### 🔐 Autenticación
- Registro e inicio de sesión con email/contraseña
- Confirmación de email obligatoria
- Recuperación de contraseña
- Sesiones persistentes y seguras

### 🏢 Gestión de Propiedades
- Crear y gestionar múltiples propiedades
- Dashboard con estadísticas en tiempo real
- Invitar colaboradores con diferentes roles (owner/editor/viewer)
- Sistema de permisos basado en roles

### 🚪 Gestión de Habitaciones
- Habitaciones privadas (con inquilinos)
- Salas comunes (cocina, baño, salón, etc.)
- Galería de fotos (hasta 10 fotos por habitación)
- Descarga individual o masiva de fotos
- Estados: disponible/ocupada

### 👥 Gestión de Inquilinos
- Sistema independiente de gestión de inquilinos
- Asignación flexible a habitaciones
- Check-in/Check-out rápido desde el dashboard
- Mover inquilinos entre habitaciones
- Editar información del inquilino
- Control de contratos:
  - Fecha de inicio y fin
  - Alertas de vencimiento
  - Depósitos y notas

### 💰 Finanzas
- Registro de gastos e ingresos
- Categorización automática
- Analíticas con gráficos interactivos
- Exportación de datos
- Resumen de ingresos mensuales

### 📱 Interfaz
- Diseño "Liquid Glass" moderno
- Totalmente responsive (optimizado para móvil)
- Animaciones fluidas
- Dashboard compacto y funcional
- Secciones colapsables por propiedad

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com)
- Git

### Instalación

1. **Clonar el repositorio**:
```bash
git clone <tu-repo>
cd rental-manager
npm install
```

2. **Configurar Supabase**:
   
   Sigue la guía en `INICIO-RAPIDO.md` (15 minutos) que incluye:
   - Crear proyecto en Supabase
   - Ejecutar migraciones de base de datos
   - Configurar Storage para fotos
   - Crear archivo `.env.local`

3. **Ejecutar la aplicación**:
```bash
npm run dev
```

4. **Abrir en el navegador**:
```
http://localhost:5173
```

5. **Registrarte**:
   - Ir a `/login`
   - Crear cuenta con email/contraseña
   - Confirmar email
   - ¡Listo!

## 📁 Estructura del Proyecto

```
rental-manager/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── auth/          # Componentes de autenticación
│   │   │   ├── properties/    # Componentes de propiedades
│   │   │   ├── rooms/          # Componentes de habitaciones
│   │   │   ├── tenants/        # Componentes de inquilinos
│   │   │   ├── finances/       # Componentes financieros
│   │   │   └── ui/             # Componentes reutilizables
│   │   ├── services/           # Servicios de backend
│   │   │   ├── supabase.js     # Cliente de Supabase
│   │   │   ├── auth.js         # Servicio de autenticación
│   │   │   ├── properties.js   # Servicio de propiedades
│   │   │   ├── rooms.js        # Servicio de habitaciones
│   │   │   ├── tenants.js      # Servicio de inquilinos
│   │   │   ├── storage.js      # Servicio de almacenamiento
│   │   │   └── finances.js     # Servicio financiero
│   │   └── stores/             # Stores de Svelte
│   │       ├── user.js         # Estado de usuario
│   │       └── properties.js   # Estado de propiedades
│   └── routes/                 # Rutas de SvelteKit
│       ├── +layout.svelte      # Layout principal
│       ├── +page.svelte        # Dashboard
│       ├── login/              # Página de login
│       ├── properties/[id]/    # Detalles de propiedad
│       │   ├── rooms/          # Gestión de habitaciones
│       │   ├── tenants/        # Gestión de inquilinos
│       │   ├── expenses/       # Gestión de finanzas
│       │   └── analytics/      # Analíticas
│       └── accept-invitation/  # Aceptar invitaciones
├── supabase/
│   └── migrations/             # Migraciones SQL
│       └── ALL_MIGRATIONS.sql  # Script completo consolidado
├── static/                     # Archivos estáticos
└── package.json                # Dependencias
```

## 🛠️ Tecnologías

- **Frontend**: SvelteKit 2.0
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Estilos**: Tailwind CSS
- **Gráficos**: Chart.js
- **Iconos**: Lucide Svelte

## 🔐 Seguridad

- Row Level Security (RLS) en todas las tablas
- Autenticación con JWT
- Sesiones seguras y persistentes
- Políticas de acceso por roles
- Validación de datos en cliente y servidor
- Storage con acceso controlado

## 📊 Base de Datos

### Tablas Principales

- `properties` - Propiedades
- `rooms` - Habitaciones
- `tenants` - Inquilinos
- `expenses` - Gastos
- `income` - Ingresos
- `property_access` - Permisos de acceso
- `invitations` - Invitaciones pendientes

Ver `supabase/migrations/ALL_MIGRATIONS.sql` para el schema completo.

## 🎨 Personalización

### Colores
Edita `tailwind.config.js` y `src/app.css` para cambiar el tema.

### Componentes
Los componentes UI están en `src/lib/components/ui/` y son reutilizables.

## 📚 Documentación Adicional

- `INICIO-RAPIDO.md` - Guía de configuración rápida (15 min)
- `CONFIGURACION-SUPABASE.md` - Detalles de configuración de Supabase
- `SISTEMA-SIMPLIFICADO.md` - Explicación del sistema sin demos
- `RESUMEN-MEJORAS.md` - Lista completa de mejoras implementadas
- `TENANTS-SYSTEM.md` - Documentación del sistema de inquilinos
- `QUICK-CHECKIN-CHECKOUT.md` - Guía del check-in/out rápido

## 🐛 Solución de Problemas

### No puedo iniciar sesión
- Verifica que hayas confirmado tu email
- Revisa que el email y contraseña sean correctos
- Asegúrate de que Supabase esté configurado

### No veo mis propiedades
- Verifica la consola del navegador (F12)
- Asegúrate de que las migraciones estén ejecutadas
- Revisa que el `.env.local` tenga las credenciales correctas

### Las fotos no se cargan
- Verifica que el bucket `room-photos` existe en Supabase Storage
- Asegúrate de que las políticas RLS estén configuradas
- Revisa la consola para errores de permisos

### Errores al recargar la página
- Ejecuta `npm run dev` de nuevo
- Limpia el caché del navegador
- Verifica que `.env.local` exista y sea correcto

## 🚀 Despliegue

### En Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
3. Despliega

### En otros servicios

Compatible con cualquier servicio que soporte SvelteKit:
- Netlify
- Cloudflare Pages
- Railway
- Render

## 📝 Scripts Disponibles

```bash
npm run dev          # Desarrollo local
npm run build        # Build para producción
npm run preview      # Preview del build
npm run check        # Verificar errores de TypeScript
npm run lint         # Linter
npm run format       # Formatear código
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles

## 🎯 Roadmap

- [ ] App móvil nativa (React Native)
- [ ] Notificaciones push
- [ ] Exportar reportes PDF
- [ ] Integración con pasarelas de pago
- [ ] Sistema de mensajería interna
- [ ] Recordatorios automáticos de pago
- [ ] Firma digital de contratos
- [ ] Multi-idioma

## ⭐ Características Destacadas

### Dashboard Inteligente
- Vista de todas tus propiedades
- Estadísticas en tiempo real
- Quick actions para check-in/out
- Filtros por estado de ocupación
- Alertas de contratos vencidos

### Sistema de Fotos
- Subida drag & drop
- Vista previa instantánea
- Descarga individual o masiva
- Hasta 10 fotos por espacio
- Funciona en habitaciones privadas y comunes

### Gestión Rápida
- Check-in de inquilino en 2 clicks
- Mover inquilinos entre habitaciones
- Editar datos sin salir del dashboard
- Ver toda la info del contrato
- Alertas de vencimiento visual

---

**¿Necesitas ayuda?** Abre un issue en GitHub o consulta la documentación en `/docs/`

**¡Disfruta gestionando tus propiedades! 🏠✨**
