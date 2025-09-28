/**
 * Message Service Module
 * Handles sending messages through Twilio or console (dev mode)
 */

const config = require('./config');
const stateManager = require('./state-manager');

class MessageService {
    constructor() {
        this.client = null;
        this.isConfigured = false;
        this.isDevelopment = config.app.isDevelopment;
        this.phoneNumber = config.twilio.phoneNumber;
    }
    
    /**
     * Initialize Twilio client
     */
    initialize(twilioClient) {
        if (twilioClient) {
            this.client = twilioClient;
            this.isConfigured = true;
            console.log('📱 Message service initialized with Twilio');
        } else if (this.isDevelopment) {
            console.log('🔧 Message service in development mode (console output)');
            this.isConfigured = true;
        }
        return this.isConfigured;
    }
    
    /**
     * Send a WhatsApp message
     */
    async sendMessage(to, message, mediaUrl = null) {
        // Add to conversation history
        stateManager.addToHistory(to, message, 'bot');
        
        if (this.isDevelopment) {
            // Development mode - output to console
            console.log('📤 [DEV] Mensaje a', to);
            console.log('━'.repeat(50));
            console.log(message);
            if (mediaUrl) {
                console.log('🖼️ Media:', mediaUrl);
            }
            console.log('━'.repeat(50));
            return { sid: 'dev-' + Date.now(), status: 'sent' };
        }
        
        if (!this.isConfigured || !this.client) {
            console.error('❌ Twilio no está configurado');
            return null;
        }
        
        try {
            const messageOptions = {
                from: this.phoneNumber,
                to: to,
                body: message
            };
            
            if (mediaUrl) {
                messageOptions.mediaUrl = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];
            }
            
            const result = await this.client.messages.create(messageOptions);
            console.log('✅ Mensaje enviado:', result.sid);
            return result;
        } catch (error) {
            console.error('❌ Error enviando mensaje:', error);
            throw error;
        }
    }
    
    /**
     * Send multiple messages with delay
     */
    async sendMessages(to, messages, delayMs = 1000) {
        const results = [];
        
        for (const message of messages) {
            const result = await this.sendMessage(to, message);
            results.push(result);
            
            if (delayMs > 0) {
                await this.delay(delayMs);
            }
        }
        
        return results;
    }
    
    /**
     * Send typing indicator (simulated with delay)
     */
    async sendTyping(to, durationMs = 2000) {
        if (this.isDevelopment) {
            console.log(`⌨️ [DEV] Typing indicator for ${durationMs}ms...`);
        }
        await this.delay(durationMs);
    }
    
    /**
     * Send welcome message
     */
    async sendWelcome(to, customerName = null) {
        const greeting = this.getGreeting();
        let message = `${greeting}! 👋\n\n`;
        
        if (customerName) {
            message += `¡Qué bueno verte de nuevo, ${customerName}! `;
        }
        
        message += `Bienvenido a *${config.business.name}* ☕\n\n`;
        message += `¿Cómo te puedo ayudar hoy?`;
        
        return this.sendMessage(to, message);
    }
    
    /**
     * Send menu
     */
    async sendMenu(to) {
        const productCatalog = require('./product-catalog');
        const menu = productCatalog.formatProductList();
        return this.sendMessage(to, menu);
    }
    
    /**
     * Send order confirmation
     */
    async sendOrderConfirmation(to, orderDetails) {
        let message = '✅ *PEDIDO CONFIRMADO*\n\n';
        message += `📋 *ID Pedido:* ${orderDetails.id}\n`;
        message += `☕ *Producto:* ${orderDetails.producto}\n`;
        message += `📦 *Cantidad:* ${orderDetails.cantidad}kg\n`;
        message += `💰 *Total:* S/${orderDetails.total}\n\n`;
        message += `👤 *Cliente:* ${orderDetails.empresa}\n`;
        message += `📧 *Email:* ${orderDetails.email}\n\n`;
        message += '📱 *Siguiente paso:* Envía tu comprobante de pago';
        
        return this.sendMessage(to, message);
    }
    
    /**
     * Send error message
     */
    async sendError(to, errorMessage = null) {
        const message = errorMessage || 
            '❌ Lo siento, ocurrió un error. Por favor intenta nuevamente o contacta soporte.';
        return this.sendMessage(to, message);
    }
    
    /**
     * Format phone number
     */
    formatPhoneNumber(phone) {
        // Remove any non-numeric characters
        let cleaned = phone.replace(/\D/g, '');
        
        // Add WhatsApp prefix if not present
        if (!phone.startsWith('whatsapp:')) {
            // Add country code if not present
            if (!cleaned.startsWith('51') && cleaned.length === 9) {
                cleaned = '51' + cleaned;
            }
            return 'whatsapp:+' + cleaned;
        }
        
        return phone;
    }
    
    /**
     * Get greeting based on time
     */
    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    }
    
    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Check if service is ready
     */
    isReady() {
        return this.isConfigured;
    }
}

// Export singleton instance
module.exports = new MessageService();
