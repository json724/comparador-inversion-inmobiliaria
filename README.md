# Comparación de Inversión Inmobiliaria

[¡Probar el simulador en línea!](https://json724.github.io/comparador-inversion-inmobiliaria/)

Este proyecto es un simulador interactivo para comparar la rentabilidad de invertir en uno o dos proyectos inmobiliarios frente a instrumentos financieros líquidos en Colombia.

## 🚀 Arquitectura Modular

La aplicación ha sido refactorizada para mejorar la mantenibilidad y escalabilidad, manteniendo la simplicidad para GitHub Pages.

### Estructura de Archivos

```
├── index.html                 # Página principal refactorizada
├── config.js                  # Configuración de valores por defecto
├── css/
│   └── styles.css            # Estilos CSS separados
├── js/
│   ├── utils.js              # Utilidades y formatters
│   ├── project-manager.js    # Gestión de proyectos
│   ├── calculations.js       # Cálculos financieros
│   ├── ui-components.js      # Componentes de UI
│   └── app.js               # Controlador principal
├── assets/
│   └── favicon/             # Íconos y favicon
└── README.md
```

## 🔧 Mejoras de la Refactorización

### ✅ Beneficios Obtenidos

1. **Separación de Responsabilidades**
   - Lógica de negocio separada de la presentación
   - Módulos especializados para cada funcionalidad
   - Código más fácil de mantener y testear

2. **Reducción de Duplicación**
   - Clase `ProjectManager` elimina código duplicado entre proyectos
   - Funciones utilitarias reutilizables
   - Componentes de UI modulares

3. **Mejor Organización**
   - HTML limpio (reducido de 1024 a ~255 líneas)
   - CSS en archivo separado
   - JavaScript modular con ES6 modules

4. **Mantenibilidad Mejorada**
   - Fácil agregar nuevos tipos de proyectos
   - Modificaciones localizadas en módulos específicos
   - Debugging más sencillo

### 📁 Descripción de Módulos

#### `js/utils.js`
- Formatters (COP, porcentajes)
- Funciones de cálculo básicas
- Utilidades para sliders

#### `js/project-manager.js`
- Gestión de datos de proyectos individuales
- Cálculos de financiamiento
- Validación de inputs por proyecto

#### `js/calculations.js`
- Cálculos de métricas de propiedades
- Análisis de flujo de caja
- Proyecciones financieras

#### `js/ui-components.js`
- Generación de HTML para tablas
- Componentes reutilizables
- Formateo de resultados

#### `js/app.js`
- Controlador principal de la aplicación
- Orquestación de módulos
- Manejo de eventos globales

## 🚀 Cómo Usar

### Opción 1: Servidor Python (Recomendado)
```bash
python3 -m http.server 8000
# Navegar a http://localhost:8000/index.html
```

### Opción 2: VSCode Live Server
- Instalar extensión "Live Server"
- Clic derecho en `index.html` → "Open with Live Server"

## 🔧 Configuración

Los valores por defecto se configuran en `config.js`:

```javascript
window.REIT_CONFIG = {
  project1: {
    baseValue: 227000000,
    initialMonthlyRent: 1400000,
    // ... más configuraciones
  },
  project2: {
    // ... configuraciones del segundo proyecto
  },
  general: {
    investmentYears: 10,
    loanTermYears: 10,
    // ... configuraciones generales
  },
  scenarios: {
    pessimistic: 2.5,
    normal: 5.0,
    realistic: 6.5,
    optimistic: 7.9
  }
};
```

## 🌟 Características Principales

- ✅ Simulación de compra y financiamiento de hasta dos propiedades
- ✅ Comparación directa con fondos de inversión (FPV y Fondo de Alta Rentabilidad)
- ✅ Configuración flexible de parámetros
- ✅ Resultados visuales y tablas de desglose anual
- ✅ Arquitectura modular y mantenible
- ✅ Compatible con GitHub Pages
- ✅ Sin dependencias externas (excepto Tailwind CSS)

## 🚀 Extensibilidad

La nueva estructura facilita:

- **Agregar nuevos tipos de cálculos**: Extender `calculations.js`
- **Nuevos componentes de UI**: Agregar métodos a `UIComponents`
- **Soporte para más proyectos**: Extender `ProjectManager`
- **Nuevos instrumentos financieros**: Modificar configuración en `app.js`

## 📱 Compatibilidad

- ✅ Navegadores modernos con soporte ES6 modules
- ✅ GitHub Pages
- ✅ Servidores locales
- ✅ Responsive design (móvil y desktop)

## 🤝 Contribuciones

Las contribuciones son bienvenidas. La nueva estructura modular facilita:

1. Fork del repositorio
2. Crear rama para nueva funcionalidad
3. Modificar módulo específico
4. Enviar pull request

## 📄 Licencia

Proyecto de código abierto. Ver archivo de licencia para más detalles.
Este proyecto es de uso personal y educativo. Puedes adaptarlo y compartirlo citando la fuente.
