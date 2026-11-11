# Producto

<!-- impeccable:product-schema 1 -->

## Plataforma

web

## Usuarios

Administradores de restaurante que gestionan menú, personal, inventario, ventas y auditoría; empleados que atienden mesas, preparan comandas y registran pagos.

## Propósito del producto

DBRestaurante es un sistema web para coordinar la operación diaria de un restaurante desde un panel administrativo y un punto de venta para el personal. El éxito consiste en consultar y actualizar con claridad el estado de mesas, órdenes, platillos, existencias y cobros.

## Posicionamiento

Una herramienta de operación que conecta la administración del restaurante con el flujo de servicio en mesas y cocina usando una base de datos SQL Server compartida.

## Contexto operativo

Los administradores consultan ventas del día, órdenes activas y alertas de inventario, y administran menú, personal, ingredientes, recetas, pagos y registros de auditoría. El personal selecciona una mesa, agrega platillos a una comanda, la envía a cocina y actualiza sus estados hasta el pago.

## Capacidades y restricciones

- Aplicación web con backend Node.js y Express, SQL Server mediante `mssql`, autenticación JWT y contraseñas con `bcrypt`.
- Interfaz, mensajes de API y comentarios de código en español.
- Los roles son administrador (`rol_id = 1`) y empleado (`rol_id = 2`).
- La base de datos objetivo se llama `DBRestaurante` y contiene entidades para empleados, platillos, ingredientes, recetas, mesas, órdenes, detalles, pagos y auditoría. El esquema entregado documenta también las tablas de categorías y métodos de pago que requieren los flujos solicitados.
- Los secretos y credenciales se configuran mediante variables de entorno; el archivo de ejemplo no contiene credenciales reales.
- Los datos de demostración no representan un restaurante real.

## Compromisos de marca

El producto se llama DBRestaurante. La dirección visual requerida es «Dark Neo-Editorial & Swiss Precision», con una interfaz de alta densidad informativa, fondo azul noche, superficies pizarra, cian eléctrico como acento y tipografías Syne y Plus Jakarta Sans.

## Evidencia disponible

El alcance funcional, los roles, las entidades de datos y la dirección visual provienen del requerimiento del producto. No se proporcionaron logotipo, fotografía, datos de negocio ni registros reales; cualquier contenido inicial del sistema debe identificarse como demostrativo.

## Principios del producto

- Mostrar el estado operativo y permitir una acción directa desde la misma vista.
- Mantener los flujos de administración separados de la atención en punto de venta.
- Proteger credenciales, validar permisos por rol y parametrizar las consultas SQL.
- Presentar datos de operación con jerarquía clara y estados en español.

## Accesibilidad e inclusión

La interfaz web debe ser adaptable a distintos tamaños de pantalla y conservar controles utilizables con teclado, estados legibles y etiquetas en español.
