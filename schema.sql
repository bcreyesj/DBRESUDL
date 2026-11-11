-- ==================== ESQUEMA DE LA BASE DE DATOS ====================
-- Este script crea el modelo DBRestaurante de forma repetible en SQL Server.
-- Ejecútelo sobre una base de datos DBRestaurante vacía o compatible.
USE DBRestaurante;
GO

-- ==================== CATÁLOGOS Y PERSONAL ====================
IF OBJECT_ID(N'dbo.categorias', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.categorias (
        id_categoria INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_categorias PRIMARY KEY,
        nombre NVARCHAR(80) NOT NULL CONSTRAINT UQ_categorias_nombre UNIQUE,
        activa BIT NOT NULL CONSTRAINT DF_categorias_activa DEFAULT 1
    );
END;
GO

IF OBJECT_ID(N'dbo.empleados', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.empleados (
        id_empleado INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_empleados PRIMARY KEY,
        nombre NVARCHAR(120) NOT NULL,
        usuario NVARCHAR(60) NOT NULL CONSTRAINT UQ_empleados_usuario UNIQUE,
        contrasena_hash NVARCHAR(100) NOT NULL,
        rol_id TINYINT NOT NULL,
        estado BIT NOT NULL CONSTRAINT DF_empleados_estado DEFAULT 1,
        fecha_creacion DATETIME2 NOT NULL CONSTRAINT DF_empleados_fecha DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_empleados_rol CHECK (rol_id IN (1, 2))
    );
END;
GO

IF OBJECT_ID(N'dbo.platillos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.platillos (
        id_platillo INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_platillos PRIMARY KEY,
        nombre NVARCHAR(120) NOT NULL,
        descripcion NVARCHAR(400) NULL,
        precio DECIMAL(10,2) NOT NULL,
        id_categoria INT NOT NULL,
        disponible BIT NOT NULL CONSTRAINT DF_platillos_disponible DEFAULT 1,
        CONSTRAINT CK_platillos_precio CHECK (precio >= 0),
        CONSTRAINT FK_platillos_categorias FOREIGN KEY (id_categoria)
            REFERENCES dbo.categorias(id_categoria)
    );
END;
GO

-- ==================== INVENTARIO Y RECETAS ====================
IF OBJECT_ID(N'dbo.ingredientes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ingredientes (
        id_ingrediente INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ingredientes PRIMARY KEY,
        nombre NVARCHAR(120) NOT NULL CONSTRAINT UQ_ingredientes_nombre UNIQUE,
        stock_actual DECIMAL(12,3) NOT NULL CONSTRAINT DF_ingredientes_stock DEFAULT 0,
        stock_minimo DECIMAL(12,3) NOT NULL CONSTRAINT DF_ingredientes_minimo DEFAULT 0,
        unidad_medida NVARCHAR(30) NOT NULL,
        CONSTRAINT CK_ingredientes_stock CHECK (stock_actual >= 0 AND stock_minimo >= 0)
    );
END;
GO

IF OBJECT_ID(N'dbo.recetas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.recetas (
        id_platillo INT NOT NULL,
        id_ingrediente INT NOT NULL,
        cantidad_requerida DECIMAL(12,3) NOT NULL,
        CONSTRAINT PK_recetas PRIMARY KEY (id_platillo, id_ingrediente),
        CONSTRAINT CK_recetas_cantidad CHECK (cantidad_requerida > 0),
        CONSTRAINT FK_recetas_platillos FOREIGN KEY (id_platillo)
            REFERENCES dbo.platillos(id_platillo),
        CONSTRAINT FK_recetas_ingredientes FOREIGN KEY (id_ingrediente)
            REFERENCES dbo.ingredientes(id_ingrediente)
    );
END;
GO

-- ==================== MESAS Y ÓRDENES ====================
IF OBJECT_ID(N'dbo.mesas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.mesas (
        id_mesa INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_mesas PRIMARY KEY,
        numero_mesa NVARCHAR(20) NOT NULL CONSTRAINT UQ_mesas_numero UNIQUE,
        capacidad TINYINT NOT NULL,
        estado NVARCHAR(20) NOT NULL CONSTRAINT DF_mesas_estado DEFAULT N'Disponible',
        CONSTRAINT CK_mesas_capacidad CHECK (capacidad > 0),
        CONSTRAINT CK_mesas_estado CHECK (estado IN (N'Disponible', N'Ocupada', N'Reservada', N'Limpieza'))
    );
END;
GO

IF OBJECT_ID(N'dbo.ordenes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ordenes (
        id_orden INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ordenes PRIMARY KEY,
        id_mesa INT NOT NULL,
        id_empleado INT NOT NULL,
        fecha_hora DATETIME2 NOT NULL CONSTRAINT DF_ordenes_fecha DEFAULT SYSUTCDATETIME(),
        estado NVARCHAR(24) NOT NULL CONSTRAINT DF_ordenes_estado DEFAULT N'Pendiente',
        total DECIMAL(12,2) NOT NULL CONSTRAINT DF_ordenes_total DEFAULT 0,
        CONSTRAINT CK_ordenes_estado CHECK (estado IN (N'Pendiente', N'En preparacion', N'Listo', N'Entregado', N'Pagado', N'Cancelado')),
        CONSTRAINT CK_ordenes_total CHECK (total >= 0),
        CONSTRAINT FK_ordenes_mesas FOREIGN KEY (id_mesa) REFERENCES dbo.mesas(id_mesa),
        CONSTRAINT FK_ordenes_empleados FOREIGN KEY (id_empleado) REFERENCES dbo.empleados(id_empleado)
    );
END;
GO

-- Amplía el catálogo de estados para instalaciones que conservan la restricción anterior.
IF OBJECT_ID(N'dbo.ordenes', N'U') IS NOT NULL
BEGIN
    DECLARE @restriccionEstado SYSNAME;
    WHILE 1 = 1
    BEGIN
        SET @restriccionEstado = NULL;
        SELECT TOP (1) @restriccionEstado = name
        FROM sys.check_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.ordenes')
          AND (definition LIKE N'%En Proceso%' OR definition LIKE N'%Servida%');

        IF @restriccionEstado IS NULL BREAK;
        DECLARE @comandoEstado NVARCHAR(300) =
            N'ALTER TABLE dbo.ordenes DROP CONSTRAINT ' + QUOTENAME(@restriccionEstado);
        EXEC sys.sp_executesql @comandoEstado;
    END;

    IF NOT EXISTS (
        SELECT 1 FROM sys.check_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.ordenes')
          AND name = N'CK_ordenes_estado'
    )
        ALTER TABLE dbo.ordenes WITH NOCHECK
        ADD CONSTRAINT CK_ordenes_estado CHECK (
            estado IN (
                N'Pendiente', N'En preparacion', N'Listo', N'Entregado', N'Pagado', N'Cancelado',
                N'En Proceso', N'Servida', N'Pagada', N'Cancelada'
            )
        );
END;
GO

IF OBJECT_ID(N'dbo.detalle_ordenes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.detalle_ordenes (
        id_detalle INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_detalle_ordenes PRIMARY KEY,
        id_orden INT NOT NULL,
        id_platillo INT NOT NULL,
        cantidad SMALLINT NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(12,2) NOT NULL,
        CONSTRAINT CK_detalle_ordenes_cantidad CHECK (cantidad > 0),
        CONSTRAINT CK_detalle_ordenes_importes CHECK (precio_unitario >= 0 AND subtotal >= 0),
        CONSTRAINT FK_detalle_ordenes_ordenes FOREIGN KEY (id_orden) REFERENCES dbo.ordenes(id_orden),
        CONSTRAINT FK_detalle_ordenes_platillos FOREIGN KEY (id_platillo) REFERENCES dbo.platillos(id_platillo)
    );
END;
GO

-- ==================== PAGOS Y AUDITORÍA ====================
IF OBJECT_ID(N'dbo.metodos_pago', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.metodos_pago (
        id_metodo_pago INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_metodos_pago PRIMARY KEY,
        nombre NVARCHAR(50) NOT NULL CONSTRAINT UQ_metodos_pago_nombre UNIQUE,
        activo BIT NOT NULL CONSTRAINT DF_metodos_pago_activo DEFAULT 1
    );
END;
GO

IF OBJECT_ID(N'dbo.pagos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.pagos (
        id_pago INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_pagos PRIMARY KEY,
        id_orden INT NOT NULL,
        id_metodo_pago INT NOT NULL,
        monto DECIMAL(12,2) NOT NULL,
        fecha_pago DATETIME2 NOT NULL CONSTRAINT DF_pagos_fecha DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_pagos_monto CHECK (monto >= 0),
        CONSTRAINT FK_pagos_ordenes FOREIGN KEY (id_orden) REFERENCES dbo.ordenes(id_orden),
        CONSTRAINT FK_pagos_metodos FOREIGN KEY (id_metodo_pago) REFERENCES dbo.metodos_pago(id_metodo_pago)
    );
END;
GO

IF OBJECT_ID(N'dbo.auditoria_sistema', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.auditoria_sistema (
        id_log BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_auditoria_sistema PRIMARY KEY,
        usuario_id INT NULL,
        accion NVARCHAR(500) NOT NULL,
        fecha DATETIME2 NOT NULL CONSTRAINT DF_auditoria_fecha DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_auditoria_empleados FOREIGN KEY (usuario_id) REFERENCES dbo.empleados(id_empleado)
    );
END;
GO

-- ==================== ÍNDICES PARA CONSULTAS FRECUENTES ====================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ordenes_estado_fecha' AND object_id = OBJECT_ID(N'dbo.ordenes'))
    CREATE INDEX IX_ordenes_estado_fecha ON dbo.ordenes(estado, fecha_hora DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_platillos_categoria_disponible' AND object_id = OBJECT_ID(N'dbo.platillos'))
    CREATE INDEX IX_platillos_categoria_disponible ON dbo.platillos(id_categoria, disponible);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_recetas_ingrediente' AND object_id = OBJECT_ID(N'dbo.recetas'))
    CREATE INDEX IX_recetas_ingrediente ON dbo.recetas(id_ingrediente);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ordenes_mesa_estado' AND object_id = OBJECT_ID(N'dbo.ordenes'))
    CREATE INDEX IX_ordenes_mesa_estado ON dbo.ordenes(id_mesa, estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_detalle_ordenes_orden' AND object_id = OBJECT_ID(N'dbo.detalle_ordenes'))
    CREATE INDEX IX_detalle_ordenes_orden ON dbo.detalle_ordenes(id_orden);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_pagos_fecha_metodo' AND object_id = OBJECT_ID(N'dbo.pagos'))
    CREATE INDEX IX_pagos_fecha_metodo ON dbo.pagos(fecha_pago, id_metodo_pago);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_auditoria_fecha' AND object_id = OBJECT_ID(N'dbo.auditoria_sistema'))
    CREATE INDEX IX_auditoria_fecha ON dbo.auditoria_sistema(fecha DESC);
GO

-- ==================== DATOS DEMOSTRATIVOS ====================
IF NOT EXISTS (SELECT 1 FROM dbo.categorias WHERE nombre = N'Entradas')
    INSERT INTO dbo.categorias (nombre) VALUES (N'Entradas'), (N'Platos fuertes'), (N'Bebidas'), (N'Postres');

IF NOT EXISTS (SELECT 1 FROM dbo.empleados WHERE usuario = N'admin')
    INSERT INTO dbo.empleados (nombre, usuario, contrasena_hash, rol_id, estado)
    VALUES (N'Administración', N'admin', N'$2b$12$nB4aUVMhG0x2EjsEddEMAO6d5Cd75QW6IUie7JpVpOofvH2ja/qM2', 1, 1);

IF NOT EXISTS (SELECT 1 FROM dbo.empleados WHERE usuario = N'cocina')
    INSERT INTO dbo.empleados (nombre, usuario, contrasena_hash, rol_id, estado)
    VALUES (N'Equipo de servicio', N'cocina', N'$2b$12$RxF41zK7kY93ul7LZP9UrOdtEXfuYgPX2auyBr2sQheoULHHlDcky', 2, 1);

IF NOT EXISTS (SELECT 1 FROM dbo.mesas)
    INSERT INTO dbo.mesas (numero_mesa, capacidad, estado)
    VALUES (N'01', 2, N'Disponible'), (N'02', 2, N'Disponible'),
           (N'03', 4, N'Disponible'), (N'04', 4, N'Disponible'),
           (N'05', 4, N'Disponible'), (N'06', 6, N'Disponible'),
           (N'07', 6, N'Disponible'), (N'08', 8, N'Disponible');

IF NOT EXISTS (SELECT 1 FROM dbo.metodos_pago)
    INSERT INTO dbo.metodos_pago (nombre) VALUES (N'Efectivo'), (N'Tarjeta'), (N'Transferencia');

IF NOT EXISTS (SELECT 1 FROM dbo.ingredientes)
    INSERT INTO dbo.ingredientes (nombre, stock_actual, stock_minimo, unidad_medida)
    VALUES (N'Tomate', 18, 5, N'kg'), (N'Queso', 8, 3, N'kg'),
           (N'Harina', 24, 8, N'kg'), (N'Pollo', 12, 4, N'kg'),
           (N'Café', 3, 5, N'kg');

IF NOT EXISTS (SELECT 1 FROM dbo.platillos)
BEGIN
    INSERT INTO dbo.platillos (nombre, descripcion, precio, id_categoria, disponible)
    SELECT datos.nombre, datos.descripcion, datos.precio, categorias.id_categoria, 1
    FROM (VALUES
        (N'Bruschetta de temporada', N'Pan artesanal, tomate asado y albahaca.', 145.00, N'Entradas'),
        (N'Risotto de hongos', N'Arroz cremoso, hongos y parmesano.', 285.00, N'Platos fuertes'),
        (N'Pollo al limón', N'Pollo a la plancha con hierbas y guarnición.', 265.00, N'Platos fuertes'),
        (N'Limonada de la casa', N'Limonada fresca preparada al momento.', 75.00, N'Bebidas'),
        (N'Pastel de chocolate', N'Chocolate oscuro y crema batida.', 125.00, N'Postres')
    ) AS datos(nombre, descripcion, precio, categoria)
    INNER JOIN dbo.categorias AS categorias ON categorias.nombre = datos.categoria;
END;
GO

-- Cambie las contraseñas de demostración y los secretos antes de usar datos reales.
