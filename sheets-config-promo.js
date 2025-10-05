// ============================================
// CONFIGURACIÓN PARA NUEVA PESTAÑA "PromosCafe"
// ============================================

// Agregar esta pestaña a tu Google Sheets con estas columnas:
// A: ID_Promo
// B: Fecha_Registro
// C: WhatsApp
// D: Nombre_Cafeteria
// E: Direccion
// F: Distrito
// G: Nombre_Contacto
// H: RUC
// I: Horario_Entrega
// J: Foto_URL
// K: Estado_Validacion (Pendiente/Aprobado/Rechazado)
// L: Fecha_Validacion
// M: Validado_Por
// N: Pedido_Generado (SI/NO)
// O: ID_Pedido_Generado
// P: Fecha_Entrega
// Q: Entregado (SI/NO)
// R: Convertido_Cliente (SI/NO)
// S: Notas
// T: Origen_Campaña

const ESTRUCTURA_PROMOS = {
  COLUMNAS: {
    ID_PROMO: 1,
    FECHA_REGISTRO: 2,
    WHATSAPP: 3,
    NOMBRE_CAFETERIA: 4,
    DIRECCION: 5,
    DISTRITO: 6,
    NOMBRE_CONTACTO: 7,
    RUC: 8,
    HORARIO_ENTREGA: 9,
    FOTO_URL: 10,
    ESTADO_VALIDACION: 11,
    FECHA_VALIDACION: 12,
    VALIDADO_POR: 13,
    PEDIDO_GENERADO: 14,
    ID_PEDIDO_GENERADO: 15,
    FECHA_ENTREGA: 16,
    ENTREGADO: 17,
    CONVERTIDO_CLIENTE: 18,
    NOTAS: 19,
    ORIGEN_CAMPANA: 20
  }
};
