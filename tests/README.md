# 🧪 Testing - Rental Manager

Sistema completo de testing para la aplicación Rental Manager usando Vitest (unit/integration) y Playwright (E2E).

## 📋 Estructura

```
tests/
├── unit/              # Tests unitarios
│   ├── components/    # Tests de componentes Svelte
│   ├── services/      # Tests de servicios
│   ├── stores/        # Tests de stores
│   └── utils/         # Tests de utilidades
├── integration/       # Tests de integración
├── e2e/              # Tests end-to-end (Playwright)
├── mocks/            # Mocks y datos de prueba
│   ├── supabase.js   # Mock de Supabase
│   └── data/         # Datos mock
└── fixtures/         # Fixtures para E2E
```

## 🚀 Comandos Disponibles

### Tests Unitarios e Integración

```bash
# Ejecutar tests en modo watch
npm run test

# Ejecutar tests una vez
npm run test:run

# Tests con UI interactiva
npm run test:ui

# Generar reporte de coverage
npm run test:coverage

# Solo tests unitarios
npm run test:unit

# Solo tests de integración
npm run test:integration
```

### Tests E2E (Playwright)

```bash
# Ejecutar tests E2E
npm run test:e2e

# Tests E2E con UI interactiva
npm run test:e2e:ui

# Debug de tests E2E
npm run test:e2e:debug

# Instalar browsers de Playwright (primera vez)
npx playwright install
```

### Todos los Tests

```bash
# Ejecutar todos los tests (unit + e2e)
npm run test:all
```

## 📝 Escribiendo Tests

### Test Unitario de Servicio

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabase } from '../mocks/supabase';
import { mockProperties } from '../mocks/data/properties';

// Mock del servicio de Supabase
vi.mock('$lib/services/supabase', () => ({
  supabase: mockSupabase
}));

describe('Properties Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch properties', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: mockProperties,
        error: null
      })
    });

    // Tu test aquí
  });
});
```

### Test de Componente Svelte

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RoomCard from '$lib/components/rooms/RoomCard.svelte';
import { mockRoom } from '../mocks/data/rooms';

describe('RoomCard Component', () => {
  it('should render room information', () => {
    render(RoomCard, { props: { room: mockRoom } });
    expect(screen.getByText(mockRoom.name)).toBeInTheDocument();
  });
});
```

### Test E2E

```javascript
import { test, expect } from '@playwright/test';

test('should login successfully', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/');
});
```

## 🎯 Cobertura Objetivo

- **Servicios**: 90%+
- **Componentes**: 70%+
- **Stores**: 80%+
- **Utils**: 85%+

## 📊 Ver Coverage

Después de ejecutar `npm run test:coverage`, abre:

```
coverage/index.html
```

## 🔧 Troubleshooting

### Error: "Cannot find module $lib"

Asegúrate de que el alias está configurado en `vitest.config.js`:

```javascript
resolve: {
  alias: {
    $lib: path.resolve(__dirname, './src/lib')
  }
}
```

### Error: "Supabase is not defined"

Usa el mock de Supabase en tus tests:

```javascript
import { mockSupabase } from '../mocks/supabase';
vi.mock('$lib/services/supabase', () => ({
  supabase: mockSupabase
}));
```

## ✅ Próximos Pasos

1. ✅ Fase 1: Setup básico completado
2. ⏳ Fase 2: Tests unitarios de servicios
3. ⏳ Fase 3: Tests de componentes
4. ⏳ Fase 4: Tests E2E
5. ⏳ Fase 5: CI/CD



