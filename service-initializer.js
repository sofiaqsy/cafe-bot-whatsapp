/**
 * Service Initializer Module
 * Initializes all external services (Sheets, Drive, Twilio, etc.)
 */

const config = require('./config');

class ServiceInitializer {
    constructor() {
        this.services = {
            sheets: null,
            drive: null,
            twilio: null,
            notifications: null
        };
    }
    
    /**
     * Initialize all services
     */
    async initialize() {
        console.log('🔧 Inicializando servicios...\n');
        
        // Initialize Google Sheets
        if (config.sheets.enabled) {
            this.services.sheets = await this.initializeSheets();
        }
        
        // Initialize Google Drive
        if (config.drive.enabled) {
            this.services.drive = await this.initializeDrive();
        }
        
        // Initialize Twilio
        if (config.twilio.enabled && !config.app.isDevelopment) {
            this.services.twilio = await this.initializeTwilio();
        }
        
        // Initialize Notifications
        if (config.notifications.enabled && this.services.twilio) {
            this.services.notifications = await this.initializeNotifications();
        }
        
        // Initialize Message Service
        await this.initializeMessageService();
        
        // Initialize Order Handler
        await this.initializeOrderHandler();
        
        return this.services;
    }
    
    /**
     * Initialize Google Sheets
     */
    async initializeSheets() {
        try {
            const googleSheets = require('./google-sheets');
            const initialized = await googleSheets.initialize();
            
            if (initialized) {
                console.log('✅ Google Sheets conectado');
                console.log(`   📊 Spreadsheet ID: ${config.sheets.spreadsheetId}`);
                return googleSheets;
            } else {
                console.log('⚠️ Google Sheets no se pudo inicializar');
                return null;
            }
        } catch (error) {
            console.error('❌ Error inicializando Google Sheets:', error.message);
            return null;
        }
    }
    
    /**
     * Initialize Google Drive
     */
    async initializeDrive() {
        try {
            const driveService = require('./google-drive-service');
            const initialized = await driveService.initialize();
            
            if (initialized) {
                console.log('✅ Google Drive conectado');
                console.log(`   📁 Folder ID: ${config.drive.folderId}`);
                return driveService;
            } else {
                console.log('⚠️ Google Drive no se pudo inicializar');
                return null;
            }
        } catch (error) {
            console.error('❌ Error inicializando Google Drive:', error.message);
            return null;
        }
    }
    
    /**
     * Initialize Twilio
     */
    async initializeTwilio() {
        try {
            const twilio = require('twilio');
            const client = twilio(
                config.twilio.accountSid,
                config.twilio.authToken
            );
            
            // Test connection
            await client.api.accounts(config.twilio.accountSid).fetch();
            
            console.log('✅ Twilio configurado');
            console.log(`   📱 Número: ${config.twilio.phoneNumber}`);
            return client;
        } catch (error) {
            console.error('❌ Error inicializando Twilio:', error.message);
            return null;
        }
    }
    
    /**
     * Initialize Notification Service
     */
    async initializeNotifications() {
        try {
            const NotificationService = require('./notification-service');
            const service = new NotificationService(
                this.services.twilio,
                config.twilio.phoneNumber
            );
            
            console.log('✅ Servicio de notificaciones activo');
            console.log(`   📱 Admin: ${config.notifications.adminPhone}`);
            return service;
        } catch (error) {
            console.error('❌ Error inicializando notificaciones:', error.message);
            return null;
        }
    }
    
    /**
     * Initialize Message Service
     */
    async initializeMessageService() {
        try {
            const messageService = require('./message-service');
            messageService.initialize(this.services.twilio);
            console.log('✅ Servicio de mensajes configurado');
            return true;
        } catch (error) {
            console.error('❌ Error inicializando servicio de mensajes:', error.message);
            return false;
        }
    }
    
    /**
     * Initialize Order Handler
     */
    async initializeOrderHandler() {
        try {
            const orderHandler = require('./order-handler');
            orderHandler.initialize(this.services);
            console.log('✅ Manejador de pedidos configurado');
            return true;
        } catch (error) {
            console.error('❌ Error inicializando manejador de pedidos:', error.message);
            return false;
        }
    }
    
    /**
     * Get service status
     */
    getStatus() {
        return {
            sheets: this.services.sheets !== null,
            drive: this.services.drive !== null,
            twilio: this.services.twilio !== null,
            notifications: this.services.notifications !== null,
            isDevelopment: config.app.isDevelopment
        };
    }
    
    /**
     * Shutdown services gracefully
     */
    async shutdown() {
        console.log('🔄 Cerrando servicios...');
        
        // Add cleanup logic here if needed
        
        console.log('✅ Servicios cerrados correctamente');
    }
}

// Export singleton instance
module.exports = new ServiceInitializer();
