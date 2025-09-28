/**
 * State Manager Module
 * Manages conversation states and user sessions
 */

const { ORDER_STATES, PENDING_STATES, ACTIVE_STATES } = require('./order-states');

class StateManager {
    constructor() {
        // User conversation states
        this.userStates = new Map();
        
        // Confirmed orders
        this.confirmedOrders = new Map();
        
        // Conversation history
        this.conversationHistory = new Map();
        
        // Customer data cache
        this.customerData = new Map();
        
        // Temporary order data
        this.tempOrderData = new Map();
        
        // Session timeouts (30 minutes)
        this.sessionTimeout = 30 * 60 * 1000;
        
        // Cleanup interval (every 10 minutes)
        this.startCleanupInterval();
    }
    
    /**
     * Get user state
     */
    getUserState(userId) {
        return this.userStates.get(userId) || 'inicio';
    }
    
    /**
     * Set user state
     */
    setUserState(userId, state) {
        this.userStates.set(userId, state);
        this.updateLastActivity(userId);
    }
    
    /**
     * Reset user state
     */
    resetUserState(userId) {
        this.userStates.delete(userId);
        this.tempOrderData.delete(userId);
    }
    
    /**
     * Get customer data
     */
    getCustomerData(userId) {
        return this.customerData.get(userId) || null;
    }
    
    /**
     * Set customer data
     */
    setCustomerData(userId, data) {
        this.customerData.set(userId, {
            ...data,
            lastUpdated: new Date()
        });
    }
    
    /**
     * Get temporary order data
     */
    getTempOrder(userId) {
        return this.tempOrderData.get(userId) || {};
    }
    
    /**
     * Set temporary order data
     */
    setTempOrder(userId, data) {
        const existing = this.getTempOrder(userId);
        this.tempOrderData.set(userId, {
            ...existing,
            ...data,
            lastUpdated: new Date()
        });
    }
    
    /**
     * Clear temporary order
     */
    clearTempOrder(userId) {
        this.tempOrderData.delete(userId);
    }
    
    /**
     * Add confirmed order
     */
    addConfirmedOrder(orderId, orderData) {
        // Usar el estado estándar de Google Sheets
        const defaultStatus = orderData.status || orderData.estado || ORDER_STATES.PENDING_VERIFICATION;
        
        // Asegurar que tenemos el userId
        const orderToSave = {
            ...orderData,
            timestamp: orderData.timestamp || new Date(),
            status: defaultStatus,
            estado: defaultStatus, // Mantener ambos por compatibilidad
            userId: orderData.userId || orderData.telefono // Asegurar userId
        };
        
        this.confirmedOrders.set(orderId, orderToSave);
        
        console.log(`\n📦 === GUARDANDO PEDIDO ===`);
        console.log(`   ID: ${orderId}`);
        console.log(`   Estado: ${defaultStatus}`);
        console.log(`   userId: ${orderToSave.userId}`);
        console.log(`   telefono: ${orderToSave.telefono || 'N/A'}`);
        console.log(`   empresa: ${orderToSave.empresa || 'N/A'}`);
        console.log(`   total: ${orderToSave.total || 0}`);
        console.log(`   Pedidos totales en memoria: ${this.confirmedOrders.size}`);
        console.log(`========================\n`);
        
        // Verificar inmediatamente si se puede encontrar
        const testFind = this.getUserOrders(orderToSave.userId);
        console.log(`   Prueba de búsqueda inmediata: ${testFind.length > 0 ? '✅ Encontrado' : '❌ No encontrado'}`);
    }
    
    /**
     * Get confirmed order
     */
    getConfirmedOrder(orderId) {
        return this.confirmedOrders.get(orderId);
    }
    
    /**
     * Update order status
     */
    updateOrderStatus(orderId, status) {
        const order = this.confirmedOrders.get(orderId);
        if (order) {
            order.status = status;
            order.lastUpdated = new Date();
            return true;
        }
        return false;
    }
    
    /**
     * Normalize phone number for comparison
     */
    normalizePhone(phone) {
        if (!phone) return '';
        // Eliminar todos los caracteres no numéricos
        return phone.replace(/[^0-9]/g, '');
    }
    
    /**
     * Get user orders
     */
    getUserOrders(userId) {
        const orders = [];
        
        // Normalizar el userId entrante
        const normalizedUserId = this.normalizePhone(userId);
        
        console.log(`\n🔍 DEBUG - Buscando pedidos`);
        console.log(`   userId original: ${userId}`);
        console.log(`   userId normalizado: ${normalizedUserId}`);
        console.log(`   Total de pedidos en memoria: ${this.confirmedOrders.size}`);
        
        // Mostrar todos los pedidos para debug
        if (this.confirmedOrders.size > 0) {
            console.log('   \nPedidos existentes:');
            this.confirmedOrders.forEach((order, orderId) => {
                const orderUserIdNorm = this.normalizePhone(order.userId);
                const orderPhoneNorm = this.normalizePhone(order.telefono);
                
                console.log(`   \n   Pedido ${orderId}:`);
                console.log(`     userId: '${order.userId}' -> norm: '${orderUserIdNorm}'`);
                console.log(`     telefono: '${order.telefono}' -> norm: '${orderPhoneNorm}'`);
                console.log(`     estado: ${order.status || order.estado}`);
                
                // Comparación simplificada: solo números
                const isMatch = (normalizedUserId && 
                    (orderUserIdNorm === normalizedUserId || 
                     orderPhoneNorm === normalizedUserId ||
                     (orderUserIdNorm && orderUserIdNorm.includes(normalizedUserId)) ||
                     (orderPhoneNorm && orderPhoneNorm.includes(normalizedUserId))));
                
                if (isMatch) {
                    console.log(`     ✅ MATCH! Agregando este pedido`);
                    orders.push({ ...order, id: orderId });
                } else {
                    console.log(`     ❌ No coincide (${normalizedUserId} vs ${orderUserIdNorm}/${orderPhoneNorm})`);
                }
            });
        } else {
            console.log('   ⚠️ No hay pedidos en memoria');
        }
        
        console.log(`\n📊 Resultado final: ${orders.length} pedidos encontrados\n`);
        
        return orders.sort((a, b) => {
            const dateA = a.timestamp || a.fecha || 0;
            const dateB = b.timestamp || b.fecha || 0;
            return dateB - dateA;
        });
    }
    
    /**
     * Get pending orders for user
     */
    getPendingOrders(userId) {
        const allOrders = this.getUserOrders(userId);
        const pendingOrders = allOrders.filter(
            order => {
                const status = order.status || order.estado || '';
                // Usar los estados pendientes definidos
                return PENDING_STATES.includes(status);
            }
        );
        
        console.log(`⏳ Pedidos pendientes para ${userId}: ${pendingOrders.length}`);
        if (pendingOrders.length > 0) {
            pendingOrders.forEach(order => {
                console.log(`   - ${order.id}: ${order.status || order.estado}`);
            });
        }
        
        return pendingOrders;
    }
    
    /**
     * Get active orders for user (pending + in process)
     */
    getActiveOrders(userId) {
        const allOrders = this.getUserOrders(userId);
        return allOrders.filter(
            order => {
                const status = order.status || order.estado || '';
                return ACTIVE_STATES.includes(status);
            }
        );
    }
    
    /**
     * Add to conversation history
     */
    addToHistory(userId, message, type = 'user') {
        if (!this.conversationHistory.has(userId)) {
            this.conversationHistory.set(userId, []);
        }
        
        this.conversationHistory.get(userId).push({
            type,
            message,
            timestamp: new Date()
        });
        
        // Keep only last 50 messages
        const history = this.conversationHistory.get(userId);
        if (history.length > 50) {
            history.splice(0, history.length - 50);
        }
    }
    
    /**
     * Get conversation history
     */
    getHistory(userId) {
        return this.conversationHistory.get(userId) || [];
    }
    
    /**
     * Update last activity timestamp
     */
    updateLastActivity(userId) {
        if (!this.lastActivity) {
            this.lastActivity = new Map();
        }
        this.lastActivity.set(userId, Date.now());
    }
    
    /**
     * Cleanup expired sessions
     */
    cleanupExpiredSessions() {
        const now = Date.now();
        const expired = [];
        
        if (this.lastActivity) {
            this.lastActivity.forEach((time, userId) => {
                if (now - time > this.sessionTimeout) {
                    expired.push(userId);
                }
            });
        }
        
        // Clean up expired sessions
        expired.forEach(userId => {
            this.userStates.delete(userId);
            this.tempOrderData.delete(userId);
            this.conversationHistory.delete(userId);
            if (this.lastActivity) {
                this.lastActivity.delete(userId);
            }
        });
        
        if (expired.length > 0) {
            console.log(`🧹 Cleaned up ${expired.length} expired sessions`);
        }
    }
    
    /**
     * Start cleanup interval
     */
    startCleanupInterval() {
        setInterval(() => {
            this.cleanupExpiredSessions();
        }, 10 * 60 * 1000); // Every 10 minutes
    }
    
    /**
     * Get statistics
     */
    getStats() {
        const pendingCount = Array.from(this.confirmedOrders.values()).filter(
            o => {
                const status = o.status || o.estado || '';
                return PENDING_STATES.includes(status);
            }
        ).length;
        
        const activeCount = Array.from(this.confirmedOrders.values()).filter(
            o => {
                const status = o.status || o.estado || '';
                return ACTIVE_STATES.includes(status);
            }
        ).length;
        
        return {
            activeSessions: this.userStates.size,
            totalOrders: this.confirmedOrders.size,
            pendingOrders: pendingCount,
            activeOrders: activeCount,
            registeredCustomers: this.customerData.size
        };
    }
    
    /**
     * Debug: Show all orders
     */
    debugShowAllOrders() {
        console.log('\n🔍 DEBUG - Todos los pedidos en memoria:');
        console.log('='.repeat(50));
        
        if (this.confirmedOrders.size === 0) {
            console.log('No hay pedidos en memoria');
        } else {
            this.confirmedOrders.forEach((order, id) => {
                console.log(`\nPedido: ${id}`);
                console.log(`  Usuario: ${order.userId || 'N/A'}`);
                console.log(`  Teléfono: ${order.telefono || 'N/A'}`);
                console.log(`  Estado: ${order.status || order.estado || 'N/A'}`);
                console.log(`  Empresa: ${order.empresa || 'N/A'}`);
                console.log(`  Total: ${order.total || 0}`);
            });
        }
        console.log('='.repeat(50));
    }
    
    /**
     * Clear all data (use with caution)
     */
    clearAll() {
        this.userStates.clear();
        this.confirmedOrders.clear();
        this.conversationHistory.clear();
        this.customerData.clear();
        this.tempOrderData.clear();
        console.log('⚠️ All state data cleared');
    }
}

// Export singleton instance
module.exports = new StateManager();
