/**
 * Message Service Module (CORREGIDO)
 * Handles sending messages through Twilio or console (dev mode)
 * Mantiene el formato exacto del bot-final.js original
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
     * Send a WhatsApp message - FORMATO EXACTO DEL ORIGINAL
     */
    async sendMessage(to, message, mediaUrl = null) {
        // Add to conversation history
        stateManager.addToHistory(to, message, 'bot');
        
        if (this.isDevelopment) {
            // Development mode - FORMATO EXACTO DEL ORIGINAL
            console.log('\n' + '='.repeat(60));
            console.log('📤 MENSAJE DEL BOT (MODO DEV)');
            console.log('Para: ' + to);
            console.log('-'.repeat(60));
            console.log(message);
            console.log('='.repeat(60) + '\n');
            
            return { 
                sid: 'dev-' + Date.now(),
                status: 'simulated',
                to: to,
                body: message
            };
        }
        
        if (!this.isConfigured || !this.client) {
            console.log(`📤 MODO DEMO - Mensaje a ${to}:`, message.substring(0, 100) + '...');
            return { sid: 'demo-' + Date.now() };
        }
        
        try {
            // Intentar primero con la plantilla aprobada
            try {
                const templateMessage = await this.client.messages.create({
                    from: this.phoneNumber,
                    to: to,
                    contentSid: 'HX867d323c3e098ec9fda6d0c422b150fb', // Tu plantilla aprobada
                    contentVariables: JSON.stringify({
                        '1': message  // El mensaje va en la variable {{1}}
                    })
                });
                console.log(`✅ Mensaje enviado a ${to} usando plantilla`);
                return templateMessage;
            } catch (templateError) {
                // Si falla la plantilla, intentar mensaje directo (para sesiones activas)
                console.log('⚠️ Plantilla falló, intentando mensaje directo...');
                console.log('   Número TO original:', to);
                console.log('   Número FROM:', this.phoneNumber);
                
                // Asegurar formato correcto
                let formattedTo = to;
                if (!to.startsWith('whatsapp:')) {
                    formattedTo = 'whatsapp:' + to;
                }
                
                // Asegurar que tenga el + después de whatsapp:
                if (formattedTo.startsWith('whatsapp:') && !formattedTo.includes('+')) {
                    formattedTo = formattedTo.replace('whatsapp:', 'whatsapp:+');
                }
                
                // Eliminar espacios si existen
                formattedTo = formattedTo.replace(/\s/g, '');
                
                console.log('   Número TO formateado:', formattedTo);
                
                const messageOptions = {
                    from: this.phoneNumber,
                    to: formattedTo,
                    body: message
                };
                
                if (mediaUrl) {
                    messageOptions.mediaUrl = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];
                }
                
                const result = await this.client.messages.create(messageOptions);
                console.log(`✅ Mensaje enviado a ${formattedTo} (sesión activa)`);
                return result;
            }
        } catch (error) {
            console.error('❌ Error enviando mensaje:', error.message);
            console.error('   Código:', error.code);
            // No lanzar el error para no bloquear el flujo
            return null;
        }
    }
    
    /**
     * Send multiple messages with delay - NO USADO EN EL FLUJO ORIGINAL
     * Mantenido por compatibilidad pero el bot original envía todo en un mensaje
     */
    async sendMessages(to, messages, delayMs = 1000) {
        // El bot original no divide mensajes, envía todo junto
        const fullMessage = Array.isArray(messages) ? messages.join('\n\n') : messages;
        return this.sendMessage(to, fullMessage);
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
     * Send welcome message - NO SE USA EN EL FLUJO ORIGINAL
     * El bot original maneja el saludo directamente en order-handler
     */
    async sendWelcome(to, customerName = null) {
        // No se usa en el flujo original
        return null;
    }
    
    /**
     * Send menu - NO SE USA, el menú se genera en order-handler
     */
    async sendMenu(to) {
        // No se usa en el flujo original
        return null;
    }
    
    /**
     * Send order confirmation - NO SE USA
     */
    async sendOrderConfirmation(to, orderDetails) {
        // No se usa en el flujo original
        return null;
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
