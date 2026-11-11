-- ==================== MIGRACIÓN: ESTADOS DEL FLUJO DE COMANDAS ====================
-- Amplía los estados permitidos sin eliminar las opciones históricas ni sus datos.
IF OBJECT_ID(N'dbo.ordenes', N'U') IS NULL
    THROW 51000, N'No se encontró dbo.ordenes en la base de datos seleccionada.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @restriccion SYSNAME;
    WHILE 1 = 1
    BEGIN
        SET @restriccion = NULL;
        SELECT TOP (1) @restriccion = name
        FROM sys.check_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.ordenes')
          AND definition LIKE N'%estado%'
          AND (
              definition NOT LIKE N'%Pendiente%'
              OR definition NOT LIKE N'%En preparacion%'
              OR definition NOT LIKE N'%Listo%'
              OR definition NOT LIKE N'%Entregado%'
          );

        IF @restriccion IS NULL BREAK;
          DECLARE @comando NVARCHAR(300) =
              N'ALTER TABLE dbo.ordenes DROP CONSTRAINT ' + QUOTENAME(@restriccion);
          EXEC sys.sp_executesql @comando;
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.ordenes')
          AND definition LIKE N'%Pendiente%'
          AND definition LIKE N'%En preparacion%'
          AND definition LIKE N'%Listo%'
          AND definition LIKE N'%Entregado%'
    )
    BEGIN
        ALTER TABLE dbo.ordenes WITH NOCHECK
        ADD CONSTRAINT CK_ordenes_estado_actualizado CHECK (
            estado IN (
                N'Pendiente', N'En preparacion', N'Listo', N'Entregado',
                N'Pagado', N'Cancelado', N'En Proceso', N'Servida', N'Pagada', N'Cancelada'
            )
        );
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
