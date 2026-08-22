// Entidades que hoy escriben en AuditLog (ver registrarAuditoria en
// emprendedores/actions.ts, acompanamientos/actions.ts, reuniones/actions.ts,
// usuarios/actions.ts e importar/actions.ts). Si se audita una entidad nueva,
// agregarla aquí para que aparezca en el filtro.
export const ENTIDADES_AUDITORIA = ["Emprendedor", "Acompanamiento", "Reunion", "Usuario"] as const;

export const ACCIONES_AUDITORIA = ["CREATE", "UPDATE", "DELETE", "LOGIN"] as const;

export const ORIGENES_AUDITORIA = ["MANUAL", "IMPORTACION_EXCEL", "SISTEMA", "ADMINISTRACION"] as const;

export const RESULTADOS_AUDITORIA = ["EXITO", "ERROR"] as const;
