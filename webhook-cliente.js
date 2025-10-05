/**
 * Webhook para notificaciones de aprobación de clientes
 * Versión simplificada que usa las funciones existentes del bot
 */

const express = require('express');
const router = express.Router();

console.log('🔧 [WEBHOOK-CLIENTE] Módulo cargado en:', new Date().toISOString());

// Importar el servicio de mensajes existente
const messageService = require('./message-service');
console.log('✅ [WEBHOOK-CLIENTE] MessageService importado correctamente');

// Middleware para verificar el token
const verificarToken = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const expectedToken = process.env.WEBHOOK_SECRET_TOKEN || '3aca9f9a4653ecb556a29c9ce2b4083b';
    
    if (!token || token !== expectedToken) {
        console.log('❌ Token inválido en webhook de cliente');
        return res.status(401).json({ error: 'No autorizado' });
    }
    
    next();
};

// ============================================
// RUTA: /webhook-cliente
// ============================================
console.log('📍 [WEBHOOK-CLIENTE] Registrando ruta POST /webhook-cliente');

router.post('/webhook-cliente', verificarToken, async (req, res) => {
    try {
        console.log('\n===========================================');
        console.log('📨 [WEBHOOK-CLIENTE] Solicitud recibida');
        console.log('===========================================');
        console.log('🕐 Timestamp:', new Date().toISOString());
        console.log('📋 Method:', req.method);
        console.log('🔗 URL:', req.originalUrl || req.url);
        console.log('📦 Headers:', JSON.stringify(req.headers, null, 2));
        console.log('📦 Body:', JSON.stringify(req.body, null, 2));
        
        const { tipo, cliente, estado, metadata } = req.body;
        
        // Validar tipo
        if (tipo !== 'aprobacion_cliente') {
            console.log('⚠️ Tipo incorrecto:', tipo);
            return res.status(400).json({ 
                error: 'Tipo incorrecto',
                esperado: 'aprobacion_cliente',
                recibido: tipo
            });
        }
        
        // Validar datos requeridos
        if (!cliente?.id || !cliente?.whatsapp || !estado?.nuevo) {
            console.log('⚠️ Datos incompletos');
            return res.status(400).json({ 
                error: 'Datos incompletos',
                requeridos: ['cliente.id', 'cliente.whatsapp', 'estado.nuevo'],
                recibido: {
                    cliente_id: cliente?.id || 'falta',
                    cliente_whatsapp: cliente?.whatsapp || 'falta', 
                    estado_nuevo: estado?.nuevo || 'falta'
                }
            });
        }
        
        // Formatear número para Twilio - DEBE mantener el formato whatsapp:+51...
        let numeroWhatsApp = cliente.whatsapp;
        console.log('📱 [PHONE] Número recibido:', numeroWhatsApp);
        
        // Twilio requiere el formato whatsapp:+51...
        // NO remover el prefijo whatsapp:
        if (!numeroWhatsApp.startsWith('whatsapp:')) {
            // Si no tiene whatsapp:, agregarlo
            if (!numeroWhatsApp.startsWith('+')) {
                numeroWhatsApp = '+' + numeroWhatsApp;
            }
            numeroWhatsApp = 'whatsapp:' + numeroWhatsApp;
        }
        console.log('📱 [PHONE] Formato para Twilio:', numeroWhatsApp);
        
        console.log(`📱 [PROCESS] Enviando notificación a: ${numeroWhatsApp}`);
        console.log(`📋 [PROCESS] Estado: ${estado.nuevo}`);
        console.log(`🏢 [PROCESS] Cliente: ${cliente.empresa || cliente.contacto}`);
        console.log(`🆔 [PROCESS] ID Cliente: ${cliente.id}`);
        
        // Construir mensaje según el estado
        let mensaje;
        
        if (estado.nuevo === 'Verificado') {
            // ============================================
            // MENSAJE DE CLIENTE APROBADO
            // ============================================
            mensaje = `*FELICITACIONES*

Tu registro ha sido APROBADO.

Recibirás una muestra de nuestro café para que puedas conocer la calidad de nuestros productos.

*Empresa:* ${cliente.empresa || 'No especificada'}
*Contacto:* ${cliente.contacto || 'Cliente'}
*ID Cliente:* ${cliente.id}`;
            
        } else if (estado.nuevo === 'Rechazado') {
            // ============================================
            // MENSAJE DE CLIENTE RECHAZADO
            // ============================================
            mensaje = `*ACTUALIZACIÓN DE TU REGISTRO*

Hola ${cliente.contacto || 'estimado cliente'},

Tu registro no ha podido ser aprobado en este momento.

*POSIBLES RAZONES:*
- Información incompleta
- Zona fuera de cobertura
- Foto del local no clara
- Datos no verificables

Puedes registrarte nuevamente escribiendo: registro`;
            
        } else {
            // Estado no reconocido
            console.log('⚠️ Estado no reconocido:', estado.nuevo);
            return res.status(400).json({ 
                error: 'Estado no válido',
                estados_validos: ['Verificado', 'Rechazado'],
                recibido: estado.nuevo
            });
        }
        
        // ============================================
        // ENVIAR MENSAJE USANDO EL SERVICIO EXISTENTE
        // ============================================
        try {
            // Verificar el número del emisor (from) de Twilio
            const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
            console.log('📤 [SEND] From (Twilio):', fromNumber);
            console.log('📤 [SEND] To (Cliente):', numeroWhatsApp);
            console.log('📤 [SEND] Llamando a messageService.sendMessage()...');
            
            // Usar el messageService existente del bot
            await messageService.sendMessage(numeroWhatsApp, mensaje);
            
            console.log(`✅ [SEND] Notificación enviada exitosamente a ${numeroWhatsApp}`);
            
            // NO enviar catálogo adicional - solo un mensaje
            
            res.status(200).json({ 
                success: true,
                tipo: 'aprobacion_cliente',
                cliente_id: cliente.id,
                estado: estado.nuevo,
                mensaje: 'Notificación enviada'
            });
            
        } catch (error) {
            console.error('❌ Error enviando mensaje:', error);
            res.status(500).json({ 
                error: 'Error enviando mensaje',
                detalle: error.message
            });
        }
        
    } catch (error) {
        console.error('❌ Error general en webhook cliente:', error);
        res.status(500).json({ 
            error: 'Error procesando webhook',
            detalle: error.message
        });
    }
});

// Endpoint de prueba
console.log('📍 [WEBHOOK-CLIENTE] Registrando ruta GET /webhook-cliente/test');

router.get('/webhook-cliente/test', (req, res) => {
    console.log('🧪 [TEST] Endpoint de prueba llamado');
    res.json({
        status: 'ok',
        mensaje: 'Webhook de clientes funcionando',
        timestamp: new Date().toISOString(),
        messageService: messageService ? 'disponible' : 'no disponible'
    });
});

console.log('✅ [WEBHOOK-CLIENTE] Rutas registradas: POST /webhook-cliente, GET /webhook-cliente/test');

module.exports = router;
