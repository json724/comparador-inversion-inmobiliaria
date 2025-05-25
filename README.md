# Comparación de Inversión Inmobiliaria

[¡Probar el simulador en línea!](https://json724.github.io/comparador-inversion-inmobiliaria/)

Este proyecto es un simulador interactivo para comparar la rentabilidad de invertir en uno o dos proyectos inmobiliarios frente a instrumentos financieros líquidos en Colombia.

## Características principales
- Simulación de compra y financiamiento de hasta dos propiedades.
- Comparación directa con fondos de inversión (FPV y Fondo de Alta Rentabilidad).
- Configuración flexible de parámetros (valores, tasas, plazos, escenarios de valorización, etc).
- Resultados visuales y tablas de desglose anual.
- Botón de reset para volver a los valores por defecto.
- Todos los valores por defecto se pueden modificar fácilmente en el archivo `config.js`.

## ¿Cómo usarlo?

1. **Clona o descarga este repositorio.**
2. **Levanta un servidor local** (recomendado, necesario para que funcione la carga de `config.js`).

### Opción rápida con Python (recomendado)
```sh
python3 -m http.server 8000
```
Luego abre tu navegador en:
[http://localhost:8000/index.html](http://localhost:8000/index.html)

### Opción con VSCode Live Server
- Instala la extensión "Live Server" en VSCode.
- Haz clic derecho en `index.html` y selecciona "Open with Live Server".

## Configuración de valores por defecto

Todos los valores iniciales de los formularios están en el archivo `config.js`. Puedes editar este archivo para cambiar los valores por defecto de los proyectos, tasas, plazos y escenarios.

## Estructura de archivos
- `index.html`: Página principal del simulador.
- `config.js`: Archivo de configuración de valores por defecto.
- `README.md`: Este archivo.
- `assets/favicon/`: Íconos y archivos de favicon para la página.

## Sugerencias
- Puedes personalizar el favicon usando [favicon.io](https://favicon.io/emoji-favicons/house/).
- Si quieres compartir el simulador, solo necesitas estos archivos y un servidor local.

## Licencia
Este proyecto es de uso personal y educativo. Puedes adaptarlo y compartirlo citando la fuente.
