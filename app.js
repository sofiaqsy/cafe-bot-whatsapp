/**
 * CAFE BOT - WhatsApp Bot for Coffee Shop
 * Main Application Entry Point
 * Version: 5.0.0 (Refactored)
 * 
 * This is the refactored version with modular architecture
 * Original bot-final.js has been split into multiple modules for better maintainability
 */

const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Import modules
const config = require('./config');
const serviceInitializer = require('./service-initializer');
const stateManager = require('./state-manager');
const messageService = require('./message-service');
const orderHandler = require('./order-handler');
const sheetsService = require('./sheets-service');

// Import routes
const homeRoutes = require('./home-routes');
const webhookRoute = require('./webhook-route');
const adminRoute = require('./admin-route');
const webhookEstado = require('./webhook-estado');
const webhookCliente = require('./webhook-cliente');
// Setup middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));

// Setup routes
app.use('/', homeRoutes);
app.use('/webhook', webhookRoute);
app.use('/admin', adminRoute);
app.use('/', webhookEstado); // Webhook de estado en la raíz
app.use('/', webhookCliente); // Webhook de clientes

// Ruta para status callbacks de Twilio
app.post('/status', (req, res) => {
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
// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: config.app.isDevelopment ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.url}`
    });
});

/**
 * Initialize application
 */
async function initializeApp() {
    try {
        console.log('\n🚀 Iniciando Café Bot v5.0 (Refactorizado)...\n');
        
        // Initialize all services
        const services = await serviceInitializer.initialize();
        
        // Make services available globally through app.locals
        app.locals.services = services;
        app.locals.config = config;
        app.locals.stateManager = stateManager;
        
        // Start server
        const PORT = config.app.port;
        
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════╗
║       ☕ CAFÉ BOT v5.0 INICIADO ☕         ║
║         (Arquitectura Modular)              ║
╠════════════════════════════════════════════╣
║  📍 Puerto: ${PORT.toString().padEnd(31)}║
║  🌐 URL: http://localhost:${PORT.toString().padEnd(17)}║
║  📱 Webhook: /webhook                      ║
║  🔧 Test: /test                            ║
║  📊 Admin: /admin                          ║
║  💚 Health: /health                        ║
║  ⚙️  Modo: ${config.app.isDevelopment ? '🔧 DESARROLLO' : '✅ PRODUCCIÓN'}                  ║
╠════════════════════════════════════════════╣
║  📦 Módulos Cargados:                      ║
║  ✅ config.js - Configuración              ║
║  ✅ state-manager.js - Estados             ║
║  ✅ message-service.js - Mensajes          ║
║  ✅ order-handler.js - Pedidos             ║
║  ✅ product-catalog.js - Productos         ║
║  ✅ service-initializer.js - Servicios     ║
╠════════════════════════════════════════════╣
║  🔌 Servicios Externos:                    ║
║  ${services.sheets ? '✅' : '❌'} Google Sheets                        ║
║  ${services.drive ? '✅' : '❌'} Google Drive                          ║
║  ${services.twilio ? '✅' : '❌'} Twilio WhatsApp                      ║
║  ${services.notifications ? '✅' : '❌'} Notificaciones                       ║
╠════════════════════════════════════════════╣
║  📈 Arquitectura Mejorada:                 ║
║  • Código modular y mantenible             ║
║  • Separación de responsabilidades         ║
║  • Gestión centralizada de estado          ║
║  • Configuración unificada                 ║
║  • Manejo robusto de errores               ║
║  • Servicios desacoplados                  ║
╚════════════════════════════════════════════╝

${config.app.isDevelopment ? '💡 Modo desarrollo: Los mensajes se mostrarán en consola\n' : ''}
📚 Documentación: Ver README-REFACTORED.md
🔧 Configuración: Editar archivo .env
            `);
        });
        
    } catch (error) {
        console.error('❌ Error fatal iniciando la aplicación:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\n🔄 SIGTERM recibido, cerrando servidor...');
    await serviceInitializer.shutdown();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\n🔄 SIGINT recibido, cerrando servidor...');
    await serviceInitializer.shutdown();
    process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Rejection:', error);
    process.exit(1);
});

// Initialize application
initializeApp();

module.exports = app;
