// Agregar después de la línea de configuración BUSINESS_CONFIG

// Configuración de formularios y Drive
const FORMS_CONFIG = {
    // URL del formulario de Google para subir comprobantes
    comprobante_form: process.env.GOOGLE_FORM_URL || "https://forms.gle/TU_FORMULARIO_AQUI",
    // Carpeta de Drive donde se guardan (opcional, solo informativo)
    drive_folder: process.env.DRIVE_FOLDER_ID || "ID_CARPETA_DRIVE"
};

// Función mejorada para el paso de comprobante
function obtenerMensajeComprobante(pedidoId, total) {
    return `✅ Dirección guardada

━━━━━━━━━━━━━━━━━

*MÉTODO DE PAGO*
💳 Realiza la transferencia a:

*Cuenta BCP Soles:*
*${BUSINESS_CONFIG.bcp_cuenta}*

*Cuenta Interbancaria (CCI):*
*${BUSINESS_CONFIG.cci_cuenta}*

*Titular:* ${BUSINESS_CONFIG.name}

━━━━━━━━━━━━━━━━━

💰 *Monto a transferir: ${formatearPrecio(total)}*

📸 *ENVÍO DE COMPROBANTE:*

*Opción 1 - Formulario web (RECOMENDADO):*
${FORMS_CONFIG.comprobante_form}

*Opción 2 - WhatsApp:*
Escribe *"listo"* después de realizar la transferencia

_El pedido será confirmado tras verificar el pago_`;
}
