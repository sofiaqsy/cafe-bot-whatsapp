/**
 * Webhook mejorado para manejar notificaciones de pedidos Y aprobación de clientes
 * Agregar este código al archivo webhook-estado.js del bot de WhatsApp
 */

const express = require('express');
const router = express.Router();

// Middleware para verificar el token
const verificarToken = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token || token !== process.env.WEBHOOK_SECRET_TOKEN) {
        console.log('❌ Token inválido en webhook');
        return res.status(401).json({ error: 'No autorizado' });
    }
    
    next();
};

// Webhook principal que maneja AMBOS tipos de notificaciones
router.post('/webhook-estado', verificarToken, async (req, res) => {
    try {
        console.log('📨 Webhook recibido:', JSON.stringify(req.body, null, 2));
        
        const { tipo } = req.body;
        
        // Manejar según el tipo de notificación
        switch (tipo) {
            case 'cambio_estado':
                // Notificación de cambio de estado de PEDIDO (código existente)
                return await manejarCambioEstadoPedido(req, res);
                
            case 'aprobacion_cliente':
                // NUEVA: Notificación de aprobación de CLIENTE
                return await manejarAprobacionCliente(req, res);
                
            default:
                console.log('⚠️ Tipo de notificación no reconocido:', tipo);
                return res.status(400).json({ 
                    error: 'Tipo de notificación no válido',
                    tipos_validos: ['cambio_estado', 'aprobacion_cliente']
                });
        }
        
    } catch (error) {
        console.error('❌ Error en webhook:', error);
        res.status(500).json({ error: 'Error procesando webhook' });
    }
});

/**
 * Manejar cambio de estado de PEDIDO (función existente mejorada)
 */
async function manejarCambioEstadoPedido(req, res) {
    try {
        const { pedido, estado, cliente, metadata } = req.body;
        
        // Validar datos requeridos para pedido
        if (!pedido?.id || !estado?.nuevo || !cliente?.whatsapp) {
            return res.status(400).json({ 
                error: 'Datos incompletos para pedido',
                requeridos: ['pedido.id', 'estado.nuevo', 'cliente.whatsapp']
            });
        }
        
        const numeroWhatsApp = cliente.whatsapp.replace('whatsapp:', '');
        
        // Construir mensaje de notificación de pedido
        let mensaje = `📦 *ACTUALIZACIÓN DE TU PEDIDO*\n\n`;
        mensaje += `Pedido: *#${pedido.id}*\n`;
        
        if (pedido.producto) {
            mensaje += `Producto: ${pedido.producto}\n`;
        }
        if (pedido.cantidad) {
            mensaje += `Cantidad: ${pedido.cantidad} kg\n`;
        }
        
        mensaje += `\n✨ *Nuevo estado:* ${estado.nuevo}\n`;
        
        // Agregar mensaje específico según el estado
        const mensajesEstado = {
            'Pago confirmado': '✅ Tu pago ha sido confirmado. Pronto comenzaremos a preparar tu pedido.',
            'En preparación': '👨‍🍳 Estamos preparando tu pedido con mucho cuidado.',
            'En camino': '🚚 Tu pedido está en camino. Pronto llegará a su destino.',
            'Listo para recoger': '📍 Tu pedido está listo para ser recogido en nuestro local.',
            'Entregado': '✅ Tu pedido ha sido entregado. ¡Gracias por tu compra!',
            'Completado': '🎉 Pedido completado exitosamente.',
            'Cancelado': '❌ Tu pedido ha sido cancelado. Contáctanos si necesitas ayuda.'
        };
        
        const mensajeEstado = mensajesEstado[estado.nuevo];
        if (mensajeEstado) {
            mensaje += `\n${mensajeEstado}`;
        }
        
        // Información adicional
        if (metadata?.modificadoPor) {
            mensaje += `\n\n_Actualizado por: ${metadata.modificadoPor}_`;
        }
        
        mensaje += `\n_${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}_`;
        
        // Enviar mensaje por WhatsApp
        await enviarMensajeWhatsApp(numeroWhatsApp, mensaje);
        
        console.log(`✅ Notificación de pedido enviada a ${numeroWhatsApp}`);
        res.status(200).json({ 
            success: true,
            tipo: 'cambio_estado',
            pedido_id: pedido.id,
            mensaje: 'Notificación de pedido enviada'
        });
        
    } catch (error) {
        console.error('❌ Error manejando cambio de estado:', error);
        res.status(500).json({ error: 'Error procesando cambio de estado' });
    }
}

/**
 * NUEVA FUNCIÓN: Manejar aprobación de CLIENTE
 */
async function manejarAprobacionCliente(req, res) {
    try {
        const { cliente, estado, metadata } = req.body;
        
        // Validar datos requeridos para cliente
        if (!cliente?.id || !cliente?.whatsapp || !estado?.nuevo) {
            return res.status(400).json({ 
                error: 'Datos incompletos para aprobación de cliente',
                requeridos: ['cliente.id', 'cliente.whatsapp', 'estado.nuevo']
            });
        }
        
        const numeroWhatsApp = cliente.whatsapp.replace('whatsapp:', '');
        
        // Construir mensaje según el estado
        let mensaje;
        
        if (estado.nuevo === 'Verificado') {
            // Mensaje de APROBACIÓN
            mensaje = `🎉 *¡FELICITACIONES!*\n\n`;
            mensaje += `Tu registro ha sido *APROBADO* ✅\n\n`;
            
            if (cliente.empresa) {
                mensaje += `*Empresa:* ${cliente.empresa}\n`;
            }
            if (cliente.contacto) {
                mensaje += `*Contacto:* ${cliente.contacto}\n`;
            }
            
            mensaje += `\n📋 *Beneficios de ser cliente verificado:*\n`;
            mensaje += `• Acceso completo a nuestro catálogo\n`;
            mensaje += `• Precios especiales por volumen\n`;
            mensaje += `• Atención prioritaria\n`;
            mensaje += `• Seguimiento de pedidos en tiempo real\n`;
            
            mensaje += `\n🛍️ *¿Cómo hacer tu primer pedido?*\n`;
            mensaje += `1. Escribe "catálogo" para ver productos\n`;
            mensaje += `2. Selecciona el café que desees\n`;
            mensaje += `3. Indica la cantidad en kg\n`;
            mensaje += `4. Confirma tu pedido\n`;
            
            mensaje += `\n¡Bienvenido a nuestra familia cafetera! ☕`;
            
        } else if (estado.nuevo === 'Rechazado') {
            // Mensaje de RECHAZO
            mensaje = `📋 *ACTUALIZACIÓN DE TU REGISTRO*\n\n`;
            mensaje += `Lamentamos informarte que tu registro no ha podido ser aprobado en este momento.\n\n`;
            
            mensaje += `*Posibles razones:*\n`;
            mensaje += `• Información incompleta\n`;
            mensaje += `• Zona de cobertura no disponible\n`;
            mensaje += `• Datos de contacto incorrectos\n`;
            
            mensaje += `\n📞 *¿Qué puedes hacer?*\n`;
            mensaje += `• Verifica que tus datos sean correctos\n`;
            mensaje += `• Asegúrate de incluir una foto clara de tu local\n`;
            mensaje += `• Contáctanos directamente al: +51 987 654 321\n`;
            
            mensaje += `\nPuedes volver a registrarte cuando gustes.`;
            
        } else if (estado.nuevo === 'Prospecto') {
            // Mensaje de PROSPECTO (opcional)
            mensaje = `📋 *ACTUALIZACIÓN DE TU REGISTRO*\n\n`;
            mensaje += `Tu registro está siendo evaluado.\n`;
            mensaje += `Te contactaremos pronto con más información.\n\n`;
            mensaje += `Si tienes preguntas, no dudes en escribirnos.`;
            
        } else {
            // Estado no reconocido
            console.log('⚠️ Estado de cliente no reconocido:', estado.nuevo);
            return res.status(400).json({ 
                error: 'Estado de cliente no válido',
                estados_validos: ['Verificado', 'Rechazado', 'Prospecto']
            });
        }
        
        // Agregar pie del mensaje
        mensaje += `\n\n_${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}_`;
        
        // Enviar mensaje por WhatsApp
        await enviarMensajeWhatsApp(numeroWhatsApp, mensaje);
        
        // Si el cliente fue verificado, opcionalmente enviar el catálogo
        if (estado.nuevo === 'Verificado') {
            setTimeout(async () => {
                await enviarCatalogo(numeroWhatsApp);
            }, 3000); // Enviar catálogo después de 3 segundos
        }
        
        console.log(`✅ Notificación de ${estado.nuevo} enviada a ${numeroWhatsApp}`);
        res.status(200).json({ 
            success: true,
            tipo: 'aprobacion_cliente',
            cliente_id: cliente.id,
            estado: estado.nuevo,
            mensaje: `Notificación de ${estado.nuevo} enviada`
        });
        
    } catch (error) {
        console.error('❌ Error manejando aprobación de cliente:', error);
        res.status(500).json({ error: 'Error procesando aprobación de cliente' });
    }
}

/**
 * Función auxiliar para enviar mensaje por WhatsApp
 */
async function enviarMensajeWhatsApp(numero, mensaje) {
    try {
        // Aquí va la integración con Twilio o el servicio que uses
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = require('twilio')(accountSid, authToken);
        
        await client.messages.create({
            body: mensaje,
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: numero.startsWith('whatsapp:') ? numero : `whatsapp:${numero}`
        });
        
        console.log(`📤 Mensaje enviado a ${numero}`);
        
    } catch (error) {
        console.error('❌ Error enviando WhatsApp:', error);
        throw error;
    }
}

/**
 * Función opcional para enviar catálogo a clientes verificados
 */
async function enviarCatalogo(numero) {
    try {
        let mensaje = `☕ *CATÁLOGO DE CAFÉS DISPONIBLES*\n\n`;
        
        // Aquí podrías obtener el catálogo desde la base de datos
        const catalogo = [
            { nombre: 'Café Premium', precio: 45, descripcion: 'Grano arábica de altura' },
            { nombre: 'Café Orgánico', precio: 50, descripcion: 'Certificado orgánico' },
            { nombre: 'Café Especial', precio: 55, descripcion: 'Notas frutales y florales' },
            { nombre: 'Café House Blend', precio: 40, descripcion: 'Mezcla de la casa' },
            { nombre: 'Café Descafeinado', precio: 42, descripcion: 'Sin cafeína, mismo sabor' }
        ];
        
        catalogo.forEach((cafe, index) => {
            mensaje += `${index + 1}. *${cafe.nombre}*\n`;
            mensaje += `   ${cafe.descripcion}\n`;
            mensaje += `   Precio: S/ ${cafe.precio}/kg\n\n`;
        });
        
        mensaje += `📝 Para hacer un pedido, escribe el número del café y la cantidad.\n`;
        mensaje += `Ejemplo: "Quiero 5kg del café #1"`;
        
        await enviarMensajeWhatsApp(numero, mensaje);
        
    } catch (error) {
        console.error('❌ Error enviando catálogo:', error);
    }
}

module.exports = router;
