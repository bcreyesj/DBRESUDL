---
name: DBRestaurante
description: Sistema operativo de restaurante para administración, sala y cocina.
colors:
  canvas: "#0B132B"
  canvas-sidebar: "#0e1832"
  surface: "#1C2541"
  surface-raised: "#222f50"
  surface-soft: "#151e38"
  field-surface: "#101a34"
  surface-art: "#101b37"
  surface-avatar: "#263654"
  surface-hover: "#202e4d"
  surface-order: "#1b2744"
  surface-drawer: "#111b35"
  surface-kitchen: "rgba(28, 37, 65, .56)"
  surface-overlay: "rgba(1, 6, 20, .68)"
  surface-header: "rgba(11, 19, 43, .92)"
  surface-white-tint: "rgba(255, 255, 255, .03)"
  surface-row-hover: "rgba(255, 255, 255, .025)"
  accent: "#6FFFE9"
  accent-wash: "rgba(111, 255, 233, .09)"
  accent-border: "rgba(111, 255, 233, .4)"
  accent-selection: "rgba(111, 255, 233, .16)"
  accent-halo: "rgba(111, 255, 233, .28)"
  accent-guide: "rgba(111, 255, 233, .35)"
  accent-decoration: "rgba(111, 255, 233, .1)"
  accent-focus: "rgba(111, 255, 233, .12)"
  accent-shadow: "rgba(111, 255, 233, .16)"
  text: "#F8F9FA"
  text-table: "#e4e9f1"
  muted: "#8D99AE"
  quiet: "#77869f"
  placeholder: "#91a0b7"
  alert-text: "#ff8290"
  alert-text-strong: "#ffb1b8"
  success-text: "#a7e58c"
  border: "#3A506B"
  divider: "rgba(255, 255, 255, 0.08)"
  pending: "#FFB703"
  pending-border: "rgba(255, 183, 3, .44)"
  preparing: "#00B4D8"
  preparing-border: "rgba(0, 180, 216, .44)"
  completed: "#38B000"
  success-fill: "rgba(56, 176, 0, .08)"
  success-border: "rgba(56, 176, 0, .38)"
  alert: "#EF233C"
  alert-wash: "rgba(239, 35, 60, .09)"
  alert-border: "rgba(239, 35, 60, .4)"
  alert-border-hover: "rgba(239, 35, 60, .35)"
  alert-shadow: "rgba(239, 35, 60, .28)"
  navigation-shadow: "rgba(0, 0, 0, .26)"
typography:
  display:
    fontFamily: "Syne, Arial Black, sans-serif"
    fontSize: "clamp(2.7rem, 5.2vw, 5.25rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Syne, Arial Black, sans-serif"
    fontSize: "clamp(1.7rem, 3vw, 2.45rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Syne, Arial Black, sans-serif"
    fontSize: "clamp(1.25rem, 2vw, 1.65rem)"
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif"
    fontSize: "0.88rem"
    fontWeight: 400
    lineHeight: 1.7
  body-large:
    fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif"
    fontSize: "0.96rem"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif"
    fontSize: "0.76rem"
    fontWeight: 600
    lineHeight: 1.4
  caption:
    fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.14em"
  control:
    fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif"
    fontSize: "0.82rem"
    fontWeight: 800
  micro:
    fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif"
    fontSize: "0.62rem"
    fontWeight: 700
  compact:
    fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif"
    fontSize: "0.76rem"
    fontWeight: 400
  small:
    fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 400
  navigation:
    fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 600
  icon:
    fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
  title-compact:
    fontFamily: "Syne, Arial Black, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 700
  section:
    fontFamily: "Syne, Arial Black, sans-serif"
    fontSize: "1.45rem"
    fontWeight: 700
  figure:
    fontFamily: "Syne, Arial Black, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
  login-title:
    fontFamily: "Syne, Arial Black, sans-serif"
    fontSize: "2.1rem"
    fontWeight: 700
  display-compact:
    fontFamily: "Syne, Arial Black, sans-serif"
    fontSize: "3rem"
    fontWeight: 700
  display-mobile:
    fontFamily: "Syne, Arial Black, sans-serif"
    fontSize: "1.8rem"
    fontWeight: 700
  kpi:
    fontFamily: "Syne, Arial Black, sans-serif"
    fontSize: "clamp(1.8rem, 3vw, 2.4rem)"
    fontWeight: 700
rounded:
  sm: "10px"
  md: "16px"
  lg: "24px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "42px"
    typography: "{typography.control}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "42px"
    typography: "{typography.control}"
  input:
    backgroundColor: "{colors.field-surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "11px 13px"
    height: "44px"
    typography: "{typography.body}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "17px 18px"
  status-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "999px"
    padding: "5px 9px"
    typography: "{typography.caption}"
---

# Design System: DBRestaurante

## Overview

**Creative North Star: "La Sala en Sincronía"**

DBRestaurante organiza la operación del restaurante como un mapa de servicio: la administración ve el conjunto y el personal se mueve entre mesas, comandas y cobros. El lenguaje es editorial en su jerarquía, pero su composición es de herramienta: estados, importes y acciones se leen primero.

El azul noche y las superficies pizarra sostienen pantallas de alta densidad; el cian marca acciones y foco, mientras que los colores de estado conservan significado constante. Las líneas finas, la geometría de plano y los nodos circulares aparecen en la identidad de acceso; los paneles de operación usan tablas, listas y controles de servicio.
Las variantes de superficie, bordes y halos translúcidos detalladas en los tokens son capas del mismo sistema, no colores de estado nuevos.

**Key Characteristics:**
- Base azul noche con superficies escalonadas y divisores discretos.
- Syne para encabezados y cifras, Plus Jakarta Sans para navegación, tablas y formularios.
- Estados de operación identificados por color y etiqueta en español.
- Acento cian reservado para acciones principales, selección y foco.

## Colors

El color es una paleta completa de roles operativos, con el cian como acento compartido y tonos semánticos para estados.

### Primary
- **Cian eléctrico (`accent`):** acento de acción principal, selección y foco visible.

### Secondary
- **Cian de preparación (`preparing`):** órdenes que están en preparación.
- **Verde de servicio (`completed`):** disponibilidad, órdenes listas y acciones completadas.
- **Ámbar de espera (`pending`):** órdenes pendientes y avisos de inventario.
- **Rojo de alerta (`alert`):** estados de limpieza y atención requerida.

### Neutral
- **Azul noche (`canvas`):** lienzo general de aplicación.
- **Pizarra (`surface`):** paneles, tarjetas, cajones y superficies de navegación.
- **Pizarra elevada (`surface-raised`):** superficies que necesitan un nivel adicional.
- **Azul de campo (`field-surface`):** fondo de entradas y áreas interactivas oscuras.
- **Blanco frío (`text`):** contenido de lectura y encabezados.
- **Gris azulado (`muted`):** etiquetas, descripciones y metadatos.
- **Gris de apoyo (`quiet`):** texto secundario de baja prioridad.
- **Borde de pizarra (`border`) y divisor translúcido (`divider`):** límites finos y separación de datos.

### Named Rules
**The State-Has-a-Name Rule.** El color de un estado siempre acompaña una etiqueta textual; nunca comunica el estado por sí solo.

## Typography

**Display Font:** Syne (con Arial Black y sans-serif como respaldo)  
**Body Font:** Plus Jakarta Sans (con Segoe UI y sans-serif como respaldo)  
**Label/Mono Font:** Plus Jakarta Sans; los importes usan cifras tabulares.

**Character:** Syne da a títulos e indicadores una silueta compacta y segura. Plus Jakarta Sans mantiene el ritmo de lectura en navegación, tablas, formularios y descripciones.

### Hierarchy
- **Display** (700, adaptable hasta 5.25rem, interlineado 0.98): titular de la pantalla de acceso.
- **Headline** (700, adaptable hasta 2.45rem, interlineado 1.08): título principal de cada página.
- **Title** (700, adaptable hasta 1.65rem, interlineado 1.18): título de sección y panel.
- **Body** (400, 0.88rem, interlineado 1.7): descripción y texto de apoyo.
- **Control** (800, 0.82rem): acciones principales y botones.
- **Label** (600, 0.76rem): etiquetas de formulario y controles.
- **Caption** (700, 0.68rem, espaciado 0.14em y mayúsculas): categorías, estados y metadatos.

### Named Rules
**The Numbers-Need-Scanning Rule.** Los valores monetarios y conteos usan cifras tabulares y Syne cuando son indicadores.

## Layout

El panel administrativo usa una navegación lateral persistente y una región de contenido limitada a 1600px. Las vistas de resumen combinan una fila de indicadores con paneles de contenido; las tablas conservan su ancho y permiten desplazamiento horizontal cuando la pantalla no alcanza. El punto de venta divide el menú y la comanda, mientras que el plano distribuye las mesas en una cuadrícula.

En pantallas menores a 1100px la navegación y el plano se compactan; a 860px la navegación se convierte en cajón móvil, las columnas de contenido pasan a una columna y el carrito deja de ser fijo; a 620px los KPI y platillos se apilan y el acceso oculta el arte lateral. El espacio de página y la densidad de tablas se reducen sin ocultar acciones.

## Elevation & Depth

La profundidad se construye principalmente con capas de color y bordes, no con sombras permanentes. Las sombras aparecen en hover del botón principal y al abrir la navegación móvil; el encabezado fijo usa desenfoque de fondo para separarse del contenido que se desplaza, y el cajón lateral oscurece el resto de la pantalla.

### Shadow Vocabulary
- **Respuesta del botón principal** (`0 8px 20px rgba(111, 255, 233, 0.16)`): elevación breve al pasar el puntero.
- **Navegación móvil** (`12px 0 32px rgba(0, 0, 0, 0.26)`): separación de la pantalla cuando el menú lateral está abierto.

### Named Rules
**The Surface-First Rule.** Las superficies descansan sobre tono y borde; reserva la sombra para estados de interacción o paneles superpuestos.

## Shapes

Los controles usan esquinas compactas (10px), los paneles y tarjetas un radio medio (16px) y las superficies grandes un radio amplio (24px). Las divisiones son de un píxel; los indicadores de estado y filtros activos usan cápsulas. El mapa de acceso introduce círculos y trazos de plano como firma gráfica, sin trasladar esa decoración a cada tabla.

## Components

### Buttons
- **Forma:** rectángulo de esquinas compactas (10px).
- **Primario:** cian eléctrico con texto azul noche; altura de 42px y relleno horizontal de 16px.
- **Hover / Focus:** elevación de dos píxeles y halo difuso al pasar el puntero; foco de teclado con contorno cian de 2px y separación de 3px.
- **Secundario / discreto:** superficie pizarra o transparente, borde fino y texto de primer o segundo plano.

### Chips
- **Estilo:** cápsula con fondo de superficie, borde discreto y texto semántico.
- **Estado:** indicador circular y etiqueta textual para disponibilidad, espera, preparación, finalización o alerta.

### Cards / Containers
- **Esquinas:** radio medio (16px), con KPI y paneles sobre pizarra.
- **Borde:** divisor tenue de un píxel; el color de selección se reserva para elementos activos.
- **Relleno:** escala recurrente de 16 a 24px, reducida en pantallas estrechas.
- **Sombra:** no se usa en reposo; consulte Elevation & Depth.

### Inputs / Fields
- **Estilo:** campo azul oscuro con borde de pizarra, texto claro y esquinas compactas.
- **Foco:** borde cian y halo suave de tres píxeles.
- **Error / Disabled:** el error tiene fondo rojo translúcido y texto de alto contraste; los controles deshabilitados reducen opacidad y bloquean el puntero.

### Navigation
- **Estilo:** navegación lateral con icono geométrico y etiqueta en Plus Jakarta Sans.
- **Activo:** superficie cian translúcida, borde tenue y texto cian.
- **Móvil:** panel lateral fuera del lienzo que se desliza sobre un fondo con sombra.

### Comanda y mesa
- **Plano:** cada mesa muestra número, capacidad, estado y cuenta; la selección resalta el borde y permite abrir la comanda.
- **Comanda:** el menú y la selección actual comparten una vista dividida; los elementos enviados se separan de los elementos nuevos antes de enviarlos a cocina.
- **Cocina:** órdenes agrupadas por estado en columnas, con una sola acción explícita para avanzar cada comanda.

## Do's and Don'ts

### Do:
- **Do** mostrar cada estado como texto y color semántico.
- **Do** usar Syne en jerarquía de encabezados y cifras; deja Plus Jakarta Sans para lectura y controles.
- **Do** conservar borde fino, capas de superficie y contraste claro en tablas y formularios.
- **Do** reducir columnas y navegación según los puntos adaptables presentes en la hoja de estilos.

### Don't:
- **Don't** usar el color como único indicador de estado.
- **Don't** sustituir los tokens de azul noche, pizarra y cian por una apariencia genérica clara.
- **Don't** aplicar sombras permanentes a todas las tarjetas ni desenfocar superficies sin una capa superpuesta.
- **Don't** ocultar acciones, nombres de estados o etiquetas de formularios en pantallas estrechas.
