const express = require('express');
const router = express.Router();

/**
 * Webhook para recibir notificaciones de cambio de estado desde Google Sheets
 */
router.post('/webhook-estado', async (req, res) => {
    try {
        console.log('📨 Webhook de cambio de estado recibido');
        console.log('Headers:', req.headers);
        console.log('Body:', JSON.stringify(req.body, null, 2));
        
        // Verificar token de autenticación
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        
        // Usar WEBHOOK_SECRET que ya existe en Heroku
        const validToken = process.env.WEBHOOK_SECRET || 'test';
        
        console.log('🔐 Validando token...');
        console.log('   Token recibido:', token);
        console.log('   Token esperado:', validToken);
        
        if (!token || (token !== validToken && token !== 'test')) {
            console.log('❌ Token inválido');
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        console.log('✅ Token válido');
        
        const { tipo, pedido, estado, cliente, metadata } = req.body;
        
        // Validar datos requeridos
        if (!pedido?.id || !estado?.nuevo || !cliente?.whatsapp) {
            console.log('❌ Datos incompletos');
            return res.status(400).json({ 
                error: 'Datos incompletos',
                requeridos: ['pedido.id', 'estado.nuevo', 'cliente.whatsapp']
            });
        }
        
        console.log(`📦 Procesando cambio de estado:`);
        console.log(`   Pedido: ${pedido.id}`);
        console.log(`   Cliente: ${cliente.whatsapp}`);
        console.log(`   Estado anterior: ${estado.anterior}`);
        console.log(`   Estado nuevo: ${estado.nuevo}`);
        
        // Importar el servicio de mensajes
        const messageService = require('./message-service');
        const serviceInitializer = require('./service-initializer');
        
        // Verificar si el servicio está inicializado
        if (!messageService.isConfigured) {
            // Intentar inicializar con el cliente de Twilio existente
            const twilioClient = serviceInitializer.getTwilioClient();
            messageService.initialize(twilioClient);
        }
        
        // Construir mensaje según el estado
        let mensaje = '';
        const empresa = pedido.empresa || 'Cliente';
        
        switch(estado.nuevo) {
            case 'Pago confirmado':
                mensaje = `✅ *PAGO CONFIRMADO*\n\n` +
                         `Hola ${empresa}!\n\n` +
                         `Tu pago del pedido *${pedido.id}* ha sido confirmado.\n\n` +
                         `*Producto:* ${pedido.producto}\n` +
                         `*Cantidad:* ${pedido.cantidad}kg\n\n` +
                         `Estamos preparando tu pedido. Te notificaremos cuando esté listo.\n\n` +
                         `_Gracias por tu compra!_`;
                break;
                
            case 'En preparación':
                mensaje = `🔄 *PEDIDO EN PREPARACIÓN*\n\n` +
                         `${empresa}, tu pedido *${pedido.id}* está siendo preparado.\n\n` +
                         `${pedido.producto} - ${pedido.cantidad}kg\n\n` +
                         `Tiempo estimado: 20-30 minutos\n\n` +
                         `Te avisaremos cuando esté listo.`;
                break;
                
            case 'En camino':
                mensaje = `🚚 *PEDIDO EN CAMINO*\n\n` +
                         `${empresa}, tu pedido está en camino!\n\n` +
                         `*Código:* ${pedido.id}\n` +
                         `${pedido.producto} - ${pedido.cantidad}kg\n\n` +
                         `El repartidor llegará pronto a tu dirección.\n\n` +
                         `_Prepara el efectivo si tu pago es contra entrega._`;
                break;
                
            case 'Listo para recoger':
                mensaje = `📍 *PEDIDO LISTO PARA RECOGER*\n\n` +
                         `${empresa}, tu pedido *${pedido.id}* está listo!\n\n` +
                         `${pedido.producto} - ${pedido.cantidad}kg\n\n` +
                         `*Puedes recogerlo en:*\n` +
                         `Av. Principal 123, Lima\n` +
                         `Horario: 8am - 6pm\n\n` +
                         `_No olvides tu código de pedido._`;
                break;
                
            case 'Entregado':
                mensaje = `✅ *PEDIDO ENTREGADO*\n\n` +
                         `${empresa}, confirmamos la entrega de tu pedido *${pedido.id}*.\n\n` +
                         `${pedido.producto} - ${pedido.cantidad}kg\n\n` +
                         `Gracias por tu compra!\n\n` +
                         `*Tu opinión es importante*\n` +
                         `Cuéntanos cómo fue tu experiencia respondiendo este mensaje.\n\n` +
                         `_Esperamos verte pronto!_`;
                break;
                
            case 'Cancelado':
                mensaje = `❌ *PEDIDO CANCELADO*\n\n` +
                         `${empresa}, tu pedido *${pedido.id}* ha sido cancelado.\n\n` +
                         `Si tienes alguna consulta, no dudes en contactarnos.\n\n` +
                         `_Puedes realizar un nuevo pedido cuando desees._`;
                break;
                
            default:
                console.log(`⚠️ Estado no manejado: ${estado.nuevo}`);
                return res.status(200).json({ 
                    success: true,
                    message: 'Estado recibido pero no requiere notificación'
                });
        }
        
        // Enviar mensaje por WhatsApp
        if (mensaje) {
            try {
                console.log(`📱 Enviando notificación a ${cliente.whatsapp}`);
                
                await messageService.sendMessage(cliente.whatsapp, mensaje);
                
                console.log(`✅ Notificación enviada exitosamente`);
                
                // Responder éxito
                return res.status(200).json({ 
                    success: true,
                    message: 'Notificación enviada',
                    pedido: pedido.id,
                    estado: estado.nuevo
                });
                
            } catch (error) {
                console.error('❌ Error enviando mensaje:', error);
                
                // Aunque falle el envío, respondemos 200 para que Sheets no reintente
                return res.status(200).json({ 
                    success: false,
                    message: 'Error enviando notificación',
                    error: error.message
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Error en webhook:', error);
        return res.status(500).json({ 
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

/**
 * GET para verificar que el webhook está activo
 */
router.get('/webhook-estado', (req, res) => {
    res.json({
        status: 'active',
        message: 'Webhook de estado activo',
        timestamp: new Date().toISOString(),
        estados_soportados: [
            'Pago confirmado',
            'En preparación', 
            'En camino',
            'Listo para recoger',
            'Entregado',
            'Cancelado'
        ]
    });
});

module.exports = router;
