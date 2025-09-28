/**
 * State Manager Module
 * Manages conversation states and user sessions
 */

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
        this.confirmedOrders.set(orderId, {
            ...orderData,
            timestamp: new Date(),
            status: 'pending_payment'
        });
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
     * Get user orders
     */
    getUserOrders(userId) {
        const orders = [];
        this.confirmedOrders.forEach((order, orderId) => {
            if (order.userId === userId || order.telefono === userId) {
                orders.push({ ...order, id: orderId });
            }
        });
        return orders.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    /**
     * Get pending orders for user
     */
    getPendingOrders(userId) {
        return this.getUserOrders(userId).filter(
            order => order.status === 'pending_payment' || 
                    order.status === 'Pendiente verificación'
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
        return {
            activeSessions: this.userStates.size,
            totalOrders: this.confirmedOrders.size,
            pendingOrders: Array.from(this.confirmedOrders.values()).filter(
                o => o.status === 'pending_payment'
            ).length,
            registeredCustomers: this.customerData.size
        };
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
