/**
 * Order Handler Module
 * Handles the order flow and business logic
 */

const stateManager = require('./state-manager');
const messageService = require('./message-service');
const productCatalog = require('./product-catalog');
const config = require('./config');

class OrderHandler {
    constructor() {
        this.orderCounter = 1000;
    }
    
    /**
     * Initialize with services
     */
    initialize(services) {
        this.sheetsService = services.sheets;
        this.driveService = services.drive;
        this.notificationService = services.notifications;
    }
    
    /**
     * Handle incoming message
     */
    async handleMessage(from, body, mediaUrl = null) {
        const userState = stateManager.getUserState(from);
        const messageText = body.trim().toLowerCase();
        
        // Add to history
        stateManager.addToHistory(from, body, 'user');
        
        console.log(`📨 Estado: ${userState}, Mensaje: ${body}`);
        
        try {
            switch (userState) {
                case 'inicio':
                    return await this.handleInitialState(from, messageText);
                    
                case 'esperando_opcion':
                    return await this.handleOptionSelection(from, messageText);
                    
                case 'seleccionando_producto':
                    return await this.handleProductSelection(from, messageText);
                    
                case 'ingresando_cantidad':
                    return await this.handleQuantityInput(from, body);
                    
                case 'ingresando_empresa':
                    return await this.handleCompanyInput(from, body);
                    
                case 'ingresando_email':
                    return await this.handleEmailInput(from, body);
                    
                case 'confirmando_pedido':
                    return await this.handleOrderConfirmation(from, messageText);
                    
                case 'esperando_comprobante':
                    return await this.handlePaymentProof(from, body, mediaUrl);
                    
                case 'reorden_confirmacion':
                    return await this.handleReorderConfirmation(from, messageText);
                    
                default:
                    return await this.handleUnknownState(from);
            }
        } catch (error) {
            console.error('❌ Error handling message:', error);
            await messageService.sendError(from);
            stateManager.resetUserState(from);
        }
    }
    
    /**
     * Handle initial state
     */
    async handleInitialState(from, message) {
        const customer = stateManager.getCustomerData(from);
        const pendingOrders = stateManager.getPendingOrders(from);
        
        // Send welcome
        await messageService.sendWelcome(from, customer?.nombre);
        await messageService.sendTyping(from, 1000);
        
        // Show pending orders if any
        if (pendingOrders.length > 0) {
            let pendingMessage = '📋 *Tienes pedidos pendientes:*\n\n';
            pendingOrders.forEach(order => {
                pendingMessage += `• Pedido #${order.id} - ${order.producto?.nombre || 'Producto'}\n`;
                pendingMessage += `  ${order.cantidad}kg - S/${order.total}\n`;
                pendingMessage += `  Estado: ${order.status}\n\n`;
            });
            pendingMessage += 'Envía el comprobante de pago para procesar tu pedido.\n\n';
            await messageService.sendMessage(from, pendingMessage);
        }
        
        // Show options
        let optionsMessage = '¿Qué deseas hacer?\n\n';
        optionsMessage += '*1* - Ver catálogo y hacer pedido\n';
        optionsMessage += '*2* - Consultar estado de pedido\n';
        
        if (customer && customer.ultimoPedido) {
            optionsMessage += '*3* - Repetir último pedido\n';
        }
        
        optionsMessage += '*0* - Hablar con un asesor';
        
        await messageService.sendMessage(from, optionsMessage);
        stateManager.setUserState(from, 'esperando_opcion');
    }
    
    /**
     * Handle option selection
     */
    async handleOptionSelection(from, option) {
        switch (option) {
            case '1':
                await messageService.sendMenu(from);
                stateManager.setUserState(from, 'seleccionando_producto');
                break;
                
            case '2':
                await this.showOrderStatus(from);
                break;
                
            case '3':
                const customer = stateManager.getCustomerData(from);
                if (customer?.ultimoPedido) {
                    await this.handleReorder(from);
                } else {
                    await messageService.sendMessage(from, '❌ No tienes pedidos anteriores para repetir.');
                    await this.handleInitialState(from, '');
                }
                break;
                
            case '0':
                await this.connectToAgent(from);
                break;
                
            default:
                await messageService.sendMessage(from, '❌ Opción no válida. Por favor selecciona 1, 2, 3 o 0.');
                break;
        }
    }
    
    /**
     * Handle product selection
     */
    async handleProductSelection(from, productId) {
        const product = productCatalog.getProduct(productId);
        
        if (!product) {
            await messageService.sendMessage(from, '❌ Producto no válido. Selecciona un número del 1 al 5.');
            return;
        }
        
        // Save product selection
        stateManager.setTempOrder(from, { producto: product });
        
        // Ask for quantity
        let message = `✅ Has seleccionado: *${product.nombre}*\n\n`;
        message += `💰 Precio: S/${product.precio} por kg\n\n`;
        message += '📦 ¿Cuántos kilos deseas? (mínimo 5kg)';
        
        await messageService.sendMessage(from, message);
        stateManager.setUserState(from, 'ingresando_cantidad');
    }
    
    /**
     * Handle quantity input
     */
    async handleQuantityInput(from, quantity) {
        const qty = parseInt(quantity);
        
        if (isNaN(qty) || qty < 5) {
            await messageService.sendMessage(from, '❌ Por favor ingresa una cantidad válida (mínimo 5kg)');
            return;
        }
        
        if (qty > 1000) {
            await messageService.sendMessage(from, '❌ Para pedidos mayores a 1000kg, contacta directamente con ventas.');
            return;
        }
        
        // Calculate total
        const tempOrder = stateManager.getTempOrder(from);
        const total = qty * tempOrder.producto.precio;
        
        stateManager.setTempOrder(from, { 
            cantidad: qty,
            total: total
        });
        
        // Check if customer exists
        const customer = stateManager.getCustomerData(from);
        
        if (customer) {
            // Skip to confirmation if we have customer data
            await this.showOrderSummary(from);
            stateManager.setUserState(from, 'confirmando_pedido');
        } else {
            // Ask for company name
            await messageService.sendMessage(from, '🏢 ¿Cuál es el nombre de tu empresa?');
            stateManager.setUserState(from, 'ingresando_empresa');
        }
    }
    
    /**
     * Handle company input
     */
    async handleCompanyInput(from, company) {
        if (company.length < 2) {
            await messageService.sendMessage(from, '❌ Por favor ingresa un nombre de empresa válido');
            return;
        }
        
        stateManager.setTempOrder(from, { empresa: company });
        
        await messageService.sendMessage(from, '📧 ¿Cuál es tu correo electrónico?');
        stateManager.setUserState(from, 'ingresando_email');
    }
    
    /**
     * Handle email input
     */
    async handleEmailInput(from, email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email)) {
            await messageService.sendMessage(from, '❌ Por favor ingresa un email válido');
            return;
        }
        
        const tempOrder = stateManager.getTempOrder(from);
        stateManager.setTempOrder(from, { email: email });
        
        // Save customer data
        stateManager.setCustomerData(from, {
            telefono: from,
            empresa: tempOrder.empresa,
            email: email,
            nombre: tempOrder.empresa,
            fechaRegistro: new Date()
        });
        
        // Show order summary
        await this.showOrderSummary(from);
        stateManager.setUserState(from, 'confirmando_pedido');
    }
    
    /**
     * Show order summary
     */
    async showOrderSummary(from) {
        const tempOrder = stateManager.getTempOrder(from);
        const customer = stateManager.getCustomerData(from);
        
        let message = '📋 *RESUMEN DE TU PEDIDO*\n\n';
        message += `☕ *Producto:* ${tempOrder.producto.nombre}\n`;
        message += `📦 *Cantidad:* ${tempOrder.cantidad}kg\n`;
        message += `💰 *Total:* S/${tempOrder.total}\n\n`;
        message += `🏢 *Empresa:* ${customer.empresa}\n`;
        message += `📧 *Email:* ${customer.email}\n\n`;
        message += '¿Confirmas tu pedido?\n';
        message += '*SI* - Confirmar pedido\n';
        message += '*NO* - Cancelar';
        
        await messageService.sendMessage(from, message);
    }
    
    /**
     * Handle order confirmation
     */
    async handleOrderConfirmation(from, response) {
        if (response === 'si' || response === 'sí' || response === 's') {
            // Generate order ID
            const orderId = this.generateOrderId();
            const tempOrder = stateManager.getTempOrder(from);
            const customer = stateManager.getCustomerData(from);
            
            // Create order
            const order = {
                id: orderId,
                ...tempOrder,
                ...customer,
                fecha: new Date(),
                estado: 'Pendiente verificación',
                userId: from
            };
            
            // Save order
            stateManager.addConfirmedOrder(orderId, order);
            
            // Save to sheets if available
            if (this.sheetsService) {
                try {
                    await this.sheetsService.saveOrder(order);
                } catch (error) {
                    console.error('Error saving to sheets:', error);
                }
            }
            
            // Send confirmation
            await messageService.sendOrderConfirmation(from, order);
            await messageService.sendTyping(from, 2000);
            
            // Send payment instructions
            await this.sendPaymentInstructions(from, order);
            
            // Notify admin
            if (this.notificationService) {
                await this.notificationService.notifyNewOrder(order);
            }
            
            // Update state
            stateManager.setUserState(from, 'esperando_comprobante');
            stateManager.clearTempOrder(from);
            
        } else if (response === 'no' || response === 'n') {
            await messageService.sendMessage(from, '❌ Pedido cancelado. ¿Hay algo más en lo que pueda ayudarte?');
            stateManager.resetUserState(from);
            await this.handleInitialState(from, '');
        } else {
            await messageService.sendMessage(from, '❓ Por favor responde *SI* para confirmar o *NO* para cancelar');
        }
    }
    
    /**
     * Send payment instructions
     */
    async sendPaymentInstructions(from, order) {
        let message = '💳 *INSTRUCCIONES DE PAGO*\n\n';
        message += `Total a pagar: *S/${order.total}*\n\n`;
        message += '🏦 *Cuentas bancarias:*\n';
        message += `BCP: ${config.business.banking.bcpCuenta}\n`;
        message += `CCI: ${config.business.banking.cciCuenta}\n\n`;
        message += '📸 *Importante:*\n';
        message += '1. Realiza el pago\n';
        message += '2. Envía la foto del comprobante aquí\n';
        message += '3. Recibirás confirmación en minutos\n\n';
        message += '_Tu pedido será procesado apenas confirmemos el pago._';
        
        await messageService.sendMessage(from, message);
    }
    
    /**
     * Handle payment proof
     */
    async handlePaymentProof(from, message, mediaUrl) {
        if (!mediaUrl || mediaUrl.length === 0) {
            await messageService.sendMessage(from, 
                '📸 Por favor envía una foto de tu comprobante de pago');
            return;
        }
        
        const orders = stateManager.getPendingOrders(from);
        if (orders.length === 0) {
            await messageService.sendMessage(from, 
                '❌ No tienes pedidos pendientes de pago');
            stateManager.resetUserState(from);
            return;
        }
        
        const order = orders[0];
        
        // Update order status
        stateManager.updateOrderStatus(order.id, 'Pago recibido - En verificación');
        
        // Save image to Drive if configured
        if (this.driveService) {
            try {
                const imageUrl = await this.driveService.saveImage(mediaUrl, order.id);
                console.log('📸 Comprobante guardado:', imageUrl);
            } catch (error) {
                console.error('Error saving to Drive:', error);
            }
        }
        
        // Send confirmation
        let confirmMessage = '✅ *COMPROBANTE RECIBIDO*\n\n';
        confirmMessage += `Pedido: #${order.id}\n`;
        confirmMessage += 'Estado: En verificación\n\n';
        confirmMessage += '⏱️ Verificaremos tu pago en los próximos minutos.\n';
        confirmMessage += 'Te notificaremos cuando esté confirmado.\n\n';
        confirmMessage += '¡Gracias por tu compra! ☕';
        
        await messageService.sendMessage(from, confirmMessage);
        
        // Notify admin
        if (this.notificationService) {
            await this.notificationService.notifyPaymentReceived(order, mediaUrl);
        }
        
        // Reset state
        stateManager.resetUserState(from);
    }
    
    /**
     * Handle reorder
     */
    async handleReorder(from) {
        const customer = stateManager.getCustomerData(from);
        const lastOrder = customer.ultimoPedido;
        
        if (!lastOrder) {
            await messageService.sendMessage(from, '❌ No encontré pedidos anteriores');
            return await this.handleInitialState(from, '');
        }
        
        let message = '🔄 *REPETIR ÚLTIMO PEDIDO*\n\n';
        message += `☕ Producto: ${lastOrder.producto}\n`;
        message += `📦 Cantidad: ${lastOrder.cantidad}kg\n`;
        message += `💰 Total: S/${lastOrder.total}\n\n`;
        message += '¿Confirmas repetir este pedido?\n';
        message += '*SI* - Confirmar\n';
        message += '*NO* - Ver catálogo';
        
        await messageService.sendMessage(from, message);
        
        // Save temp order for reorder
        stateManager.setTempOrder(from, {
            ...lastOrder,
            esReorden: true
        });
        
        stateManager.setUserState(from, 'reorden_confirmacion');
    }
    
    /**
     * Handle reorder confirmation
     */
    async handleReorderConfirmation(from, response) {
        if (response === 'si' || response === 'sí' || response === 's') {
            // Process as confirmed order
            stateManager.setUserState(from, 'confirmando_pedido');
            return await this.handleOrderConfirmation(from, 'si');
        } else {
            // Show catalog
            await messageService.sendMenu(from);
            stateManager.setUserState(from, 'seleccionando_producto');
            stateManager.clearTempOrder(from);
        }
    }
    
    /**
     * Show order status
     */
    async showOrderStatus(from) {
        const orders = stateManager.getUserOrders(from);
        
        if (orders.length === 0) {
            await messageService.sendMessage(from, 
                '📭 No tienes pedidos registrados');
        } else {
            let message = '📋 *ESTADO DE TUS PEDIDOS*\n\n';
            
            orders.slice(0, 5).forEach(order => {
                message += `*Pedido #${order.id}*\n`;
                message += `📅 ${new Date(order.timestamp).toLocaleDateString('es-PE')}\n`;
                message += `☕ ${order.producto?.nombre || 'Producto'}\n`;
                message += `📦 ${order.cantidad}kg - S/${order.total}\n`;
                message += `Estado: ${order.status}\n\n`;
            });
            
            await messageService.sendMessage(from, message);
        }
        
        await messageService.sendTyping(from, 1000);
        await this.handleInitialState(from, '');
    }
    
    /**
     * Connect to human agent
     */
    async connectToAgent(from) {
        let message = '👤 *CONTACTO CON ASESOR*\n\n';
        message += `📞 Teléfono: ${config.business.phone}\n`;
        message += `📧 Email: ${config.business.email}\n`;
        message += `🕐 Horario: ${config.business.horario}\n\n`;
        message += 'Un asesor te atenderá pronto.\n';
        message += '_Mientras tanto, puedes seguir usando el bot._';
        
        await messageService.sendMessage(from, message);
        
        // Notify admin if configured
        if (this.notificationService) {
            await this.notificationService.notifyAgentRequest(from);
        }
        
        stateManager.resetUserState(from);
    }
    
    /**
     * Handle unknown state
     */
    async handleUnknownState(from) {
        await messageService.sendMessage(from, 
            '🔄 Parece que hubo un problema. Empecemos de nuevo.');
        stateManager.resetUserState(from);
        return await this.handleInitialState(from, '');
    }
    
    /**
     * Generate unique order ID
     */
    generateOrderId() {
        const prefix = 'PED';
        const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const counter = (++this.orderCounter).toString().padStart(4, '0');
        return `${prefix}${date}${counter}`;
    }
}

// Export singleton instance
module.exports = new OrderHandler();
