/**
 * Test para verificar funcionalidad de comprobantes pendientes
 * Ejecutar con: node test-comprobante-pendiente.js
 */

const orderHandler = require('./order-handler');
const stateManager = require('./state-manager');
const { ORDER_STATES } = require('./order-states');

// Simular un usuario de WhatsApp
const testUserId = 'whatsapp:+51999888777';

async function simularFlujo() {
    console.log('🧪 INICIANDO PRUEBAS DE COMPROBANTES PENDIENTES');
    console.log('=' .repeat(50));
    
    // Inicializar servicios (simulados)
    orderHandler.initialize({
        sheets: null,
        drive: null, 
        notifications: null
    });
    
    // Limpiar datos previos
    stateManager.clearAll();
    
    console.log('\n📱 Simulando flujo de pedido...\n');
    
    // 1. Usuario saluda
    console.log('Usuario: "hola"');
    await orderHandler.handleMessage(testUserId, 'hola');
    
    // 2. Usuario selecciona catálogo
    console.log('\nUsuario: "1" (Ver catálogo)');
    await orderHandler.handleMessage(testUserId, '1');
    
    // 3. Usuario selecciona producto
    console.log('\nUsuario: "1" (Selecciona producto)');
    await orderHandler.handleMessage(testUserId, '1');
    
    // 4. Usuario ingresa cantidad
    console.log('\nUsuario: "10" (10kg)');
    await orderHandler.handleMessage(testUserId, '10');
    
    // 5. Usuario confirma pedido
    console.log('\nUsuario: "si" (Confirmar)');
    await orderHandler.handleMessage(testUserId, 'si');
    
    // 6. Datos del cliente
    console.log('\nUsuario ingresa datos del cliente...');
    await orderHandler.handleMessage(testUserId, 'Café Lima SAC');
    await orderHandler.handleMessage(testUserId, 'Juan Pérez');
    await orderHandler.handleMessage(testUserId, '999888777');
    await orderHandler.handleMessage(testUserId, 'Av. Larco 123, Miraflores');
    
    // 7. PRUEBA PRINCIPAL: Usuario elige "después" para el comprobante
    console.log('\n🔥 PRUEBA CLAVE: Usuario escribe "despues"');
    await orderHandler.handleMessage(testUserId, 'despues');
    
    // Verificar que el pedido se guardó como pendiente de pago
    const pedidosPendientes = stateManager.getPendingPaymentOrders(testUserId);
    console.log(`\n✅ Pedidos pendientes de pago: ${pedidosPendientes.length}`);
    
    if (pedidosPendientes.length > 0) {
        const pedido = pedidosPendientes[0];
        console.log(`   - ID: ${pedido.id}`);
        console.log(`   - Estado: ${pedido.estado}`);
        console.log(`   - Total: S/${pedido.total}`);
        console.log(`   - Comprobante recibido: ${pedido.comprobanteRecibido ? 'Sí' : 'No'}`);
    }
    
    // 8. Usuario vuelve al menú
    console.log('\n\nUsuario: "menu"');
    await orderHandler.handleMessage(testUserId, 'menu');
    
    // Verificar que aparece la opción 5
    console.log('\n📋 El menú ahora debe mostrar:');
    console.log('   *5* - 💳 Enviar comprobante pendiente');
    
    // 9. Usuario selecciona opción 5
    console.log('\n\nUsuario: "5" (Enviar comprobante pendiente)');
    await orderHandler.handleMessage(testUserId, '5');
    
    // 10. Usuario selecciona el pedido pendiente
    console.log('\nUsuario: "1" (Selecciona primer pedido pendiente)');
    await orderHandler.handleMessage(testUserId, '1');
    
    // 11. Simular envío de comprobante (con URL simulada)
    console.log('\n📸 Simulando envío de imagen del comprobante...');
    const mediaUrlSimulada = 'https://ejemplo.com/comprobante.jpg';
    
    // Obtener el estado actual antes de enviar comprobante
    const estadoAntes = stateManager.getUserState(testUserId);
    console.log(`   Estado antes: ${estadoAntes}`);
    
    // Simular envío del comprobante
    await orderHandler.handleMessage(testUserId, 'comprobante', mediaUrlSimulada);
    
    // Verificar que el pedido se actualizó
    const pedidosActualizados = stateManager.getUserOrders(testUserId);
    const pedidoActualizado = pedidosActualizados.find(p => p.estado === ORDER_STATES.PENDING_VERIFICATION);
    
    console.log('\n📊 RESULTADOS FINALES:');
    console.log('=' .repeat(50));
    
    if (pedidoActualizado) {
        console.log('✅ Pedido actualizado correctamente:');
        console.log(`   - ID: ${pedidoActualizado.id}`);
        console.log(`   - Estado: ${pedidoActualizado.estado}`);
        console.log(`   - Comprobante: ${pedidoActualizado.urlComprobante ? 'Recibido' : 'No recibido'}`);
    } else {
        console.log('❌ Error: El pedido no se actualizó correctamente');
    }
    
    // Mostrar estadísticas finales
    const stats = stateManager.getStats();
    console.log('\n📈 Estadísticas finales:');
    console.log(`   - Pedidos totales: ${stats.totalOrders}`);
    console.log(`   - Pedidos pendientes: ${stats.pendingOrders}`);
    console.log(`   - Pedidos activos: ${stats.activeOrders}`);
    
    console.log('\n✅ PRUEBA COMPLETADA');
}

// Ejecutar prueba
simularFlujo().catch(console.error);
