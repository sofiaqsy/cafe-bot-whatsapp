/**
 * Order States Configuration
 * Estados estándar para pedidos - Compatible con Google Sheets
 */

const ORDER_STATES = {
    PENDING_PAYMENT: 'Pendiente de pago',  // Pedido confirmado pero sin comprobante
    PENDING_VERIFICATION: 'Pendiente verificación',  // Comprobante recibido, esperando validación
    PAYMENT_CONFIRMED: 'Pago confirmado',
    IN_PREPARATION: 'En preparación',
    ON_THE_WAY: 'En camino',
    READY_FOR_PICKUP: 'Listo para recoger',
    DELIVERED: 'Entregado',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado'
};

// Estados que se consideran "pendientes" (requieren acción del cliente)
const PENDING_STATES = [
    ORDER_STATES.PENDING_PAYMENT,
    ORDER_STATES.PENDING_VERIFICATION
];

// Estados que se consideran "activos" (en proceso)
const ACTIVE_STATES = [
    ORDER_STATES.PENDING_PAYMENT,
    ORDER_STATES.PENDING_VERIFICATION,
    ORDER_STATES.PAYMENT_CONFIRMED,
    ORDER_STATES.IN_PREPARATION,
    ORDER_STATES.ON_THE_WAY,
    ORDER_STATES.READY_FOR_PICKUP
];

// Estados finales
const FINAL_STATES = [
    ORDER_STATES.DELIVERED,
    ORDER_STATES.COMPLETED,
    ORDER_STATES.CANCELLED
];

module.exports = {
    ORDER_STATES,
    PENDING_STATES,
    ACTIVE_STATES,
    FINAL_STATES
};
