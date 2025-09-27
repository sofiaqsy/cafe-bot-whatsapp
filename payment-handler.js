// Archivo de actualización para agregar soporte de imágenes al bot
// Este archivo contiene los cambios necesarios para manejar comprobantes de pago

const imageHandler = require('./image-handler');

// Estados adicionales para el flujo de pago con imágenes
const ESTADOS_PAGO = {
    ESPERANDO_METODO: 'esperando_metodo_pago',
    ESPERANDO_COMPROBANTE: 'esperando_comprobante',
    COMPROBANTE_RECIBIDO: 'comprobante_recibido'
};

// Métodos de pago con información bancaria
const METODOS_PAGO = {
    '1': {
        nombre: 'Transferencia BCP',
        tipo: 'transferencia',
        requiereComprobante: true,
        datos: `*DATOS BANCARIOS BCP:*
Cuenta Soles: 191-71374-73085
CCI: 00219100713747308552
Titular: Rosal Express`
    },
    '2': {
        nombre: 'Transferencia Interbank',
        tipo: 'transferencia',
        requiereComprobante: true,
        datos: `*DATOS BANCARIOS INTERBANK:*
Cuenta: 123-456789-0-12
CCI: 00312345678901234567
Titular: Rosal Express`
    },
    '3': {
        nombre: 'Yape',
        tipo: 'digital',
        requiereComprobante: true,
        datos: `*YAPE:*
Número: +51987654321
Nombre: Rosal Express`
    },
    '4': {
        nombre: 'Plin',
        tipo: 'digital',
        requiereComprobante: true,
        datos: `*PLIN:*
Número: +51987654321
Nombre: Rosal Express`
    },
    '5': {
        nombre: 'Efectivo contra entrega',
        tipo: 'efectivo',
        requiereComprobante: false,
        datos: `*PAGO CONTRA ENTREGA:*
Prepare el monto exacto para el repartidor.
Se agregará S/5 adicional por este método.`
    }
};

// Función mejorada para manejar mensajes con soporte de imágenes
async function manejarMensajeConImagenes(from, body, mediaUrl, userState, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) {
    let respuesta = '';
    
    // Si estamos esperando un comprobante y llega una imagen
    if (userState.step === ESTADOS_PAGO.ESPERANDO_COMPROBANTE && mediaUrl) {
        try {
            console.log('📸 Procesando comprobante de pago...');
            
            // Procesar la imagen
            const resultado = await imageHandler.procesarImagen(
                mediaUrl,
                userState.data.pedidoId,
                TWILIO_ACCOUNT_SID,
                TWILIO_AUTH_TOKEN
            );
            
            if (resultado.success) {
                // Actualizar el estado del pedido
                userState.data.comprobante = resultado.data;
                userState.data.estadoPago = 'Comprobante recibido';
                
                respuesta = `✅ *¡COMPROBANTE RECIBIDO!*
━━━━━━━━━━━━━━━━━━━━━━

Tu pago ha sido registrado correctamente.

📋 *Pedido:* ${userState.data.pedidoId}
💰 *Monto:* S/${userState.data.total}
📸 *Comprobante:* Recibido ✓

*PRÓXIMOS PASOS:*
1️⃣ Validaremos tu pago (máx 30 min)
2️⃣ Recibirás confirmación por WhatsApp
3️⃣ Prepararemos tu pedido
4️⃣ Coordinaremos la entrega

━━━━━━━━━━━━━━━━━━━━━━
⏰ *Entrega:* 24-48 horas hábiles
📞 *Consultas:* ${userState.data.pedidoId}

¡Gracias por tu compra! ☕

_Escribe *menu* para realizar otro pedido_`;
                
                userState.step = 'pedido_completado_con_pago';
            } else {
                respuesta = `⚠️ *Error procesando el comprobante*

${resultado.error}

Por favor, intenta enviar la imagen nuevamente.

Si el problema persiste:
• Escribe *saltar* para completar sin comprobante
• Escribe *ayuda* para contactar soporte`;
            }
        } catch (error) {
            console.error('Error procesando comprobante:', error);
            respuesta = `❌ Hubo un problema al recibir el comprobante.

Por favor, intenta nuevamente o escribe:
• *saltar* - Completar sin comprobante
• *menu* - Volver al menú principal`;
        }
    }
    // Si llega una imagen cuando no se espera
    else if (mediaUrl && userState.step !== ESTADOS_PAGO.ESPERANDO_COMPROBANTE) {
        respuesta = `📷 *Imagen recibida*

Para enviar un comprobante de pago, primero debes completar un pedido.

¿Qué deseas hacer?
*1* - Hacer un pedido
*2* - Consultar pedido existente
*menu* - Ver opciones`;
        
        // Guardar la imagen por si acaso
        console.log(`📷 Imagen no esperada de ${from}: ${mediaUrl}`);
    }
    // Manejo de texto cuando se espera comprobante
    else if (userState.step === ESTADOS_PAGO.ESPERANDO_COMPROBANTE && !mediaUrl) {
        const mensaje = body.toLowerCase().trim();
        
        if (mensaje === 'saltar') {
            respuesta = `⚠️ *Pedido registrado sin comprobante*

📋 *Código:* ${userState.data.pedidoId}

Por favor, envía el comprobante lo antes posible para procesar tu pedido.

Puedes enviarlo:
• Por este chat respondiendo a este mensaje
• Al correo: ventas@coffeeexpress.com
• Referencia: ${userState.data.pedidoId}

_Escribe *menu* para volver al inicio_`;
            
            userState.step = 'pedido_sin_comprobante';
        } else if (mensaje === 'ayuda') {
            respuesta = `📞 *AYUDA CON EL PAGO*

Si tienes problemas enviando el comprobante:

1️⃣ Asegúrate de que la foto sea clara
2️⃣ El archivo debe ser JPG o PNG
3️⃣ Tamaño máximo: 5MB

*Alternativas:*
📧 Email: ventas@coffeeexpress.com
📱 WhatsApp: +51987654321

*Referencia:* ${userState.data.pedidoId}

_Envía la imagen cuando esté lista_`;
        } else {
            respuesta = `📸 *Esperando comprobante de pago*

Por favor, envía una foto del voucher de:
• ${userState.data.metodoPagoNombre}
• Monto: S/${userState.data.total}

O escribe:
• *saltar* - Completar sin comprobante
• *ayuda* - Si necesitas asistencia`;
        }
    }
    
    return respuesta;
}

// Función para actualizar el flujo de método de pago
function obtenerMensajeMetodoPago() {
    return `💳 *MÉTODO DE PAGO*
━━━━━━━━━━━━━━━━━━━━━━

Selecciona una opción:

*1* - Transferencia BCP
*2* - Transferencia Interbank  
*3* - Yape
*4* - Plin
*5* - Efectivo contra entrega (+S/5)

_Envía el número de tu elección_`;
}

// Función para procesar la selección de método de pago
function procesarMetodoPago(opcion, userState) {
    const metodo = METODOS_PAGO[opcion];
    
    if (!metodo) {
        return {
            valido: false,
            respuesta: `❌ Opción no válida.

Por favor selecciona del 1 al 5:

*1* - BCP | *2* - Interbank
*3* - Yape | *4* - Plin
*5* - Efectivo`
        };
    }
    
    // Guardar información del método
    userState.data.metodoPago = metodo.nombre;
    userState.data.metodoPagoTipo = metodo.tipo;
    userState.data.requiereComprobante = metodo.requiereComprobante;
    
    // Si es contra entrega, agregar cargo adicional
    if (metodo.tipo === 'efectivo') {
        userState.data.cargoAdicional = 5;
        userState.data.total = (userState.data.total || 0) + 5;
    }
    
    let respuesta = '';
    
    if (metodo.requiereComprobante) {
        respuesta = `✅ *Método seleccionado:* ${metodo.nombre}

${metodo.datos}

━━━━━━━━━━━━━━━━━━━━━━
💰 *MONTO A PAGAR:* S/${userState.data.total}
━━━━━━━━━━━━━━━━━━━━━━

📸 *SIGUIENTE PASO:*
Realiza el pago y envía una foto del comprobante por este chat.

⏳ Esperando tu comprobante...`;
        
        userState.step = ESTADOS_PAGO.ESPERANDO_COMPROBANTE;
    } else {
        respuesta = `✅ *Método seleccionado:* ${metodo.nombre}

${metodo.datos}

━━━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL A PAGAR:* S/${userState.data.total}
━━━━━━━━━━━━━━━━━━━━━━

Tu pedido ha sido confirmado y será entregado en 24-48 horas.

📋 *Código:* ${userState.data.pedidoId}

_Escribe *menu* para volver al inicio_`;
        
        userState.step = 'pedido_completado';
    }
    
    return {
        valido: true,
        respuesta: respuesta
    };
}

// Exportar funciones y constantes
module.exports = {
    ESTADOS_PAGO,
    METODOS_PAGO,
    manejarMensajeConImagenes,
    obtenerMensajeMetodoPago,
    procesarMetodoPago
};
