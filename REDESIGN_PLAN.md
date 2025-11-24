# 🏠 Plan de Rediseño - Estilo Roomie Rules

## Objetivo
Transformar la aplicación para que se parezca a Roomie Rules, enfocada en la gestión de pisos/casas que se alquilan por habitación, con un tema cálido y acogedor.

## 🎨 Nuevo Tema Visual

### Paleta de Colores
- **Primario**: Naranjas cálidos (#FF6B35, #F7931E, #FFA500)
- **Secundario**: Terracotas (#D2691E, #CD853F)
- **Acentos**: Beiges y cremas (#F5E6D3, #FFF8DC)
- **Fondo**: Blancos cálidos y grises suaves (#FFFBF5, #F8F6F0)
- **Texto**: Marrones oscuros (#3E2723, #5D4037)

### Estilo
- Diseño más "hogareño" y menos corporativo
- Bordes más suaves y redondeados
- Sombras más suaves
- Iconos más amigables
- Tipografía más cálida y legible

## 🚀 Funcionalidades Clave a Implementar

### 1. Sistema de Reglas de Convivencia
- Crear/editar reglas por propiedad
- Categorías: Limpieza, Ruido, Visitas, Cocina, etc.
- Notificaciones cuando se añaden/modifican reglas
- Historial de cambios

### 2. Gestión de Gastos Compartidos Mejorada
- División automática de gastos entre inquilinos
- Categorías: Servicios, Compras compartidas, Reparaciones
- Sistema de "quién debe a quién"
- Recordatorios de pagos pendientes

### 3. Sistema de Recordatorios
- Recordatorios personalizados por propiedad
- Notificaciones push
- Calendario de eventos importantes
- Fechas clave: pagos, reuniones, limpiezas

### 4. Dashboard Rediseñado
- Vista de "casa" en lugar de "propiedad"
- Métricas de convivencia
- Actividad reciente de la casa
- Acceso rápido a funciones principales

### 5. Gestión de Depósitos Mejorada
- Seguimiento detallado de depósitos
- Cálculo automático de devoluciones
- Historial completo
- Alertas de vencimientos

## 📱 Cambios de UI/UX

### Componentes a Rediseñar
- Cards más acogedoras con bordes suaves
- Botones con estilo más amigable
- Formularios más intuitivos
- Navegación más clara
- Iconografía más cálida

### Layout
- Más espacio en blanco
- Tipografía más grande y legible
- Mejor jerarquía visual
- Animaciones más suaves

## 🗄️ Cambios en Base de Datos

### Nuevas Tablas
- `house_rules` - Reglas de convivencia
- `shared_expenses` - Gastos compartidos con división
- `reminders` - Recordatorios y eventos
- `expense_splits` - División de gastos entre inquilinos

### Modificaciones
- Mejorar tabla de `expenses` para soportar división
- Añadir campos a `properties` para reglas y configuración

## 📋 Orden de Implementación

1. ✅ Tema visual (colores, estilos base)
2. Sistema de reglas de convivencia
3. Mejoras en gastos compartidos
4. Sistema de recordatorios
5. Dashboard rediseñado
6. Mejoras en depósitos
7. Refinamiento de UI/UX

