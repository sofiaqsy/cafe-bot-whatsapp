/**
 * Webhook Route Handler
 * Handles incoming WhatsApp messages from Twilio
 */

const express = require('express');
const router = express.Router();
const orderHandler = require('./order-handler');
const cafeGratisHandler = require('./cafe-gratis-handler');
const messageService = require('./message-service');
const stateManager = require('./state-manager');
const sheetsService = require('./sheets-service');

// Inicializar Google Sheets
sheetsService.initialize().then(() => {
    console.log('Sheets service inicializado en webhook-route');
}).catch(error => {
    console.error('Error inicializando sheets en webhook-route:', error);
});

/**
 * POST /webhook
 * Twilio webhook endpoint
 */
router.post('/', async (req, res) => {
    try {
        const { From, Body, MediaUrl0, MediaContentType0 } = req.body;
        
        console.log('\n📱 Mensaje recibido');
        console.log('De:', From);
        console.log('Mensaje:', Body);
        
        // Handle media if present
        let mediaUrl = null;
        if (MediaUrl0) {
            console.log('📎 Archivo adjunto:', MediaContentType0);
            mediaUrl = MediaUrl0;
        }
        
        // Process message
        // Primero intentar con el handler de café gratis
        const mensajeLimpio = Body ? Body.trim().toUpperCase() : '';
        
        // Verificar si es comando de café gratis
        const triggersProm = ['SOLICITO MUESTRA', 'SOLICITAR MUESTRA', 'MUESTRA GRATIS', 'PROMOCAFE', 'PROMO1KG'];
        
        if (triggersProm.some(trigger => mensajeLimpio.includes(trigger))) {
            const resultado = await cafeGratisHandler.procesarMensajePromo(From, Body, { mediaUrl: mediaUrl });
            if (resultado) {
                await messageService.sendMessage(From, resultado.respuesta);
                res.status(200).send('OK');
                return;
            }
        }
        
        // Verificar si está en flujo de promoción
        const state = stateManager.getUserState(From) || { step: 'inicio', data: {} };
        if (state && state.step && state.step.startsWith('promo_')) {
            const resultado = await cafeGratisHandler.procesarMensajePromo(From, Body, { mediaUrl: mediaUrl });
            if (resultado) {
                await messageService.sendMessage(From, resultado.respuesta);
                res.status(200).send('OK');
                return;
            }
        }
        
        // Si no es promoción, procesar con el handler normal
        await orderHandler.handleMessage(From, Body, mediaUrl);
        
        // IMPORTANTE: Siempre enviar respuesta 200 a Twilio
        res.status(200).send('OK');
        
    } catch (error) {
        console.error('❌ Error en webhook:', error);
        res.status(500).send('Error processing message');
    }
});

/**
 * GET /webhook
 * Health check for webhook
 */
router.get('/', (req, res) => {
    res.json({
        status: 'active',
        endpoint: 'webhook',
        timestamp: new Date().toISOString()
    });
});

/**
 * POST /status
 * Handle status callbacks from Twilio
 */
router.post('/status', (req, res) => {
    const { MessageStatus, MessageSid, ErrorCode, ErrorMessage, To } = req.body;
    
    // Log el status del mensaje
    if (ErrorCode) {
        console.error(`❌ Error en mensaje ${MessageSid}:`);
        console.error(`   Código: ${ErrorCode}`);
        console.error(`   Mensaje: ${ErrorMessage}`);
        console.error(`   Destinatario: ${To}`);
    } else {
        console.log(`📊 Status update:`);
        console.log(`   Estado: ${MessageStatus}`);
        console.log(`   ID: ${MessageSid}`);
        console.log(`   Para: ${To}`);
    }
    
    // Siempre responder 200 a Twilio
    res.sendStatus(200);
});

module.exports = router;
