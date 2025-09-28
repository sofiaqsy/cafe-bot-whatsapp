// Google Apps Script para detectar cambios en Google Sheets
// Instalar en: Google Sheets > Extensiones > Apps Script

// CONFIGURACIÓN - Cambiar estos valores
const CONFIG = {
  WEBHOOK_URL: 'https://cafe-bot-whatsapp-ad7ab21dc0a8.herokuapp.com/webhook-estado',
  SECRET_TOKEN: 'TU_TOKEN_SECRETO_AQUI', // Generar uno seguro
  COLUMNA_ESTADO: 15, // Columna O
  COLUMNA_ID: 1,      // Columna A
  COLUMNA_WHATSAPP: 20, // Columna T
  HOJA_PEDIDOS: 'PedidosWhatsApp'
};

// Función que se ejecuta cuando se edita la hoja
function onEdit(e) {
  try {
    const range = e.range;
    const sheet = e.source.getActiveSheet();
    const usuario = Session.getActiveUser().getEmail();
    
    // Verificar que sea la hoja correcta y la columna de estado
    if (sheet.getName() === CONFIG.HOJA_PEDIDOS && 
        range.getColumn() === CONFIG.COLUMNA_ESTADO) {
      
      const fila = range.getRow();
      
      // No procesar la fila de encabezados
      if (fila === 1) return;
      
      // Obtener datos del pedido
      const idPedido = sheet.getRange(fila, CONFIG.COLUMNA_ID).getValue();
      const nuevoEstado = e.value || '';
      const estadoAnterior = e.oldValue || '';
      const whatsapp = sheet.getRange(fila, CONFIG.COLUMNA_WHATSAPP).getValue();
      
      // Obtener más datos del pedido para el mensaje
      const empresa = sheet.getRange(fila, 4).getValue(); // Columna D
      const producto = sheet.getRange(fila, 8).getValue(); // Columna H
      const cantidad = sheet.getRange(fila, 9).getValue(); // Columna I
      
      // Solo notificar si hay un cambio real y hay WhatsApp
      if (nuevoEstado !== estadoAnterior && whatsapp) {
        console.log(`Cambio detectado: Pedido ${idPedido} de ${estadoAnterior} a ${nuevoEstado}`);
        
        // Enviar notificación
        enviarNotificacionWhatsApp({
          idPedido: idPedido,
          nuevoEstado: nuevoEstado,
          estadoAnterior: estadoAnterior,
          whatsapp: whatsapp,
          empresa: empresa,
          producto: producto,
          cantidad: cantidad,
          modificadoPor: usuario,
          timestamp: new Date().toISOString()
        });
        
        // Registrar en la hoja de logs (opcional)
        registrarCambio(sheet, fila, nuevoEstado, usuario);
      }
    }
  } catch (error) {
    console.error('Error en onEdit:', error);
  }
}

// Función para enviar notificación vía webhook
function enviarNotificacionWhatsApp(datos) {
  try {
    const payload = {
      tipo: 'cambio_estado',
      pedido: {
        id: datos.idPedido,
        empresa: datos.empresa,
        producto: datos.producto,
        cantidad: datos.cantidad
      },
      estado: {
        nuevo: datos.nuevoEstado,
        anterior: datos.estadoAnterior
      },
      cliente: {
        whatsapp: normalizarWhatsApp(datos.whatsapp)
      },
      metadata: {
        modificadoPor: datos.modificadoPor,
        timestamp: datos.timestamp
      }
    };
    
    const options = {
      method: 'POST',
      contentType: 'application/json',
      headers: {
        'Authorization': `Bearer ${CONFIG.SECRET_TOKEN}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(CONFIG.WEBHOOK_URL, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode === 200) {
      console.log('Notificación enviada exitosamente');
    } else {
      console.error('Error enviando notificación:', response.getContentText());
    }
    
    return responseCode === 200;
    
  } catch (error) {
    console.error('Error en enviarNotificacionWhatsApp:', error);
    return false;
  }
}

// Normalizar número de WhatsApp
function normalizarWhatsApp(numero) {
  if (!numero) return '';
  
  // Quitar caracteres no numéricos excepto +
  let normalizado = String(numero).replace(/[^0-9+]/g, '');
  
  // Asegurar formato +51
  if (!normalizado.startsWith('+')) {
    if (normalizado.startsWith('51')) {
      normalizado = '+' + normalizado;
    } else {
      normalizado = '+51' + normalizado;
    }
  }
  
  return normalizado;
}

// Registrar cambio en columna de observaciones
function registrarCambio(sheet, fila, nuevoEstado, usuario) {
  try {
    const columnaObservaciones = 17; // Columna Q
    const observacionesActuales = sheet.getRange(fila, columnaObservaciones).getValue() || '';
    const fecha = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
    
    const nuevaObservacion = `[${fecha}] Estado cambiado a: ${nuevoEstado} por ${usuario}\n${observacionesActuales}`;
    
    // Limitar a 500 caracteres
    const observacionFinal = nuevaObservacion.substring(0, 500);
    
    sheet.getRange(fila, columnaObservaciones).setValue(observacionFinal);
  } catch (error) {
    console.error('Error registrando cambio:', error);
  }
}

// Función para probar manualmente
function probarNotificacion() {
  enviarNotificacionWhatsApp({
    idPedido: 'TEST-123',
    nuevoEstado: 'Pago verificado ✅',
    estadoAnterior: 'Pendiente verificación',
    whatsapp: '+51936934501',
    empresa: 'Empresa Test',
    producto: 'Café Premium',
    cantidad: '5',
    modificadoPor: 'admin@test.com',
    timestamp: new Date().toISOString()
  });
}

// Función para configurar el trigger programado (opcional)
function configurarTriggers() {
  // Eliminar triggers existentes
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Crear nuevo trigger para onEdit
  ScriptApp.newTrigger('onEdit')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onEdit()
    .create();
}

// Estados predefinidos para validación
const ESTADOS_VALIDOS = [
  'Pendiente verificación',
  'Pago verificado ✅',
  'En preparación',
  'En camino',
  'Entregado',
  'Completado',
  'Cancelado'
];

// Función para validar estado
function esEstadoValido(estado) {
  return ESTADOS_VALIDOS.includes(estado);
}
