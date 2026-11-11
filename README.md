# DBRestaurante

Sistema web en español para administrar el restaurante y operar mesas, comandas y cobros desde el punto de venta. La interfaz utiliza HTML, CSS y módulos JavaScript nativos; el servidor usa Express y SQL Server.

## Estructura del proyecto

```text
DBRestaurante/
├── config/
│   └── db.js
├── controllers/
│   ├── auditController.js
│   ├── authController.js
│   ├── dashboardController.js
│   ├── inventoryController.js
│   ├── menuController.js
│   ├── orderController.js
│   ├── salesController.js
│   ├── staffController.js
│   └── tableController.js
├── middlewares/
│   ├── authMiddleware.js
│   └── errorMiddleware.js
├── migrations/
│   └── 001_estados_orden.sql
├── public/
│   ├── css/styles.css
│   ├── js/
│   │   ├── admin.js
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── employee.js
│   │   ├── search.js
│   │   └── login.js
│   ├── admin.html
│   ├── employee.html
│   └── login.html
├── routes/
│   ├── auditRoutes.js
│   ├── authRoutes.js
│   ├── dashboardRoutes.js
│   ├── inventoryRoutes.js
│   ├── menuRoutes.js
│   ├── orderRoutes.js
│   ├── salesRoutes.js
│   ├── staffRoutes.js
│   └── tableRoutes.js
├── utils/
│   ├── asyncHandler.js
│   ├── audit.js
│   └── httpError.js
├── .impeccable/
│   └── design.json
├── .env.example
├── .gitignore
├── DESIGN.md
├── package-lock.json
├── package.json
├── PRODUCT.md
├── README.md
├── schema.sql
└── server.js
```

## Puesta en marcha

1. Cree la base de datos `DBRestaurante` en SQL Server y ejecute `schema.sql`.
2. Copie `.env.example` como `.env` y configure el host, puerto, usuario, contraseña y un secreto JWT privado.
3. Instale dependencias con `npm install`.
4. Inicie el modo de desarrollo con `npm run dev`, o el servidor con `npm start`.
5. Abra `http://localhost:3000`.

Al actualizar una instalación existente, ejecute `migrations/001_estados_orden.sql` conectado a la misma base configurada en `.env` (`DB_NAME`). La migración conserva los estados y las comandas históricas; `schema.sql` se utiliza para instalaciones nuevas.

El esquema inserta registros demostrativos para categorías, menú, mesas, inventario y personal. Los precios de ejemplo se presentan en MXN y no representan tarifas reales. Los accesos de demostración son `admin` / `CambiarAntesDeProduccion2026!` (administración) y `cocina` / `ServicioDemo2026!` (empleado); cambie estas contraseñas y el secreto JWT antes de usar datos reales.

Las rutas de acceso de administrador y empleado son `/admin/dashboard` y `/employee/dashboard`. Las operaciones administrativas requieren el rol 1; las operaciones de servicio requieren un token válido. El mapa y las comandas se actualizan automáticamente cada 15 segundos mientras la pantalla está visible. El API y la interfaz muestran mensajes en español.

Las listas de ingredientes, platillos, personal, recetas, mesas, comandas, pagos y auditoría cuentan con búsqueda local por texto; los filtros ignoran mayúsculas y acentos y permanecen activos al actualizar los datos.
