// Función simplificada para probar si encuentra pedidos
async function verificarPedidosCliente(googleSheets, telefono) {
    if (!googleSheets || !googleSheets.initialized) {
        console.log('⚠️ Google Sheets no inicializado');
        return { encontrados: 0, pedidos: [] };
    }
    
    try {
        // Normalizar teléfono
        const telefonoNormalizado = telefono
            .replace('whatsapp:', '')
            .replace(/[^0-9+]/g, '');
        
        console.log(`🔍 Buscando pedidos para: ${telefonoNormalizado}`);
        
        // Leer TODA la hoja para debug
        const response = await googleSheets.sheets.spreadsheets.values.get({
            spreadsheetId: googleSheets.spreadsheetId,
            range: 'PedidosWhatsApp!A:T'
        });
        
        if (!response.data.values || response.data.values.length <= 1) {
            console.log('❌ No hay datos en PedidosWhatsApp');
            return { encontrados: 0, pedidos: [] };
        }
        
        console.log(`📊 Total de filas en Sheets: ${response.data.values.length}`);
        
        // Verificar encabezados
        const headers = response.data.values[0];
        console.log('📋 Encabezados encontrados:');
        console.log('   Columna O (Estado):', headers[14]);
        console.log('   Columna T (Usuario_WhatsApp):', headers[19]);
        
        // Buscar pedidos
        let pedidosEncontrados = 0;
        const pedidosActivos = [];
        
        for (let i = 1; i < response.data.values.length; i++) {
            const row = response.data.values[i];
            const whatsappPedido = row[19] ? String(row[19]).replace(/[^0-9+]/g, '') : '';
            const estado = row[14] || '';
            
            // Debug: mostrar todos los WhatsApp encontrados
            if (i <= 5) { // Solo primeros 5 para no saturar logs
                console.log(`   Fila ${i}: WhatsApp='${whatsappPedido}', Estado='${estado}'`);
            }
            
            if (whatsappPedido === telefonoNormalizado) {
                pedidosEncontrados++;
                console.log(`✅ Pedido encontrado en fila ${i}:`);
                console.log(`   ID: ${row[0]}`);
                console.log(`   Estado: ${estado}`);
                console.log(`   WhatsApp: ${whatsappPedido}`);
                
                // Si no está completado/cancelado, agregarlo
                if (estado !== 'Completado' && 
                    estado !== 'Entregado' && 
                    estado !== 'Cancelado') {
                    
                    pedidosActivos.push({
                        id: row[0],
                        producto: row[7],
                        cantidad: row[8],
                        total: row[12],
                        estado: estado
                    });
                    console.log(`   ➡️ Agregado a pedidos activos`);
                } else {
                    console.log(`   ⏭️ Omitido (estado: ${estado})`);
                }
            }
        }
        
        console.log(`📦 Resumen: ${pedidosEncontrados} pedidos totales, ${pedidosActivos.length} activos`);
        
        return {
            encontrados: pedidosEncontrados,
            pedidos: pedidosActivos
        };
        
    } catch (error) {
        console.error('❌ Error verificando pedidos:', error.message);
        return { encontrados: 0, pedidos: [] };
    }
}

// Función mejorada para generar menú con debug
async function generarMenuConPedidosDebug(googleSheets, telefono, userState) {
    console.log('\n========== GENERANDO MENÚ ==========');
    console.log(`📱 Para teléfono: ${telefono}`);
    
    let headerPedidos = '';
    
    if (!googleSheets || !googleSheets.initialized) {
        console.log('⚠️ Google Sheets no configurado - usando menú básico');
    } else {
        // Verificar pedidos con debug
        const resultado = await verificarPedidosCliente(googleSheets, telefono);
        
        if (resultado.pedidos.length > 0) {
            headerPedidos = `📦 *TUS PEDIDOS EN CURSO*\n`;
            headerPedidos += `━━━━━━━━━━━━━━━━━\n\n`;
            
            resultado.pedidos.forEach(p => {
                // Determinar ícono según estado
                let iconoEstado = '⏳';
                let textoEstado = p.estado || 'Pendiente';
                
                if (p.estado && (p.estado.includes('verificado') || p.estado.includes('✅'))) {
                    iconoEstado = '✅';
                    textoEstado = 'Pago verificado';
                } else if (p.estado && p.estado.includes('preparación')) {
                    iconoEstado = '👨‍🍳';
                    textoEstado = 'En preparación';
                } else if (p.estado && p.estado.includes('camino')) {
                    iconoEstado = '🚚';
                    textoEstado = 'En camino';
                }
                
                headerPedidos += `${iconoEstado} *${p.id}*\n`;
                headerPedidos += `   ${p.producto}\n`;
                headerPedidos += `   ${p.cantidad}kg - S/${parseFloat(p.total).toFixed(2)}\n`;
                headerPedidos += `   Estado: *${textoEstado}*\n\n`;
            });
            
            headerPedidos += `💡 _Usa el código para consultar detalles_\n`;
            headerPedidos += `━━━━━━━━━━━━━━━━━\n\n`;
        } else if (resultado.encontrados > 0) {
            console.log('ℹ️ Tiene pedidos pero ninguno activo');
        } else {
            console.log('ℹ️ Cliente sin pedidos anteriores');
        }
    }
    
    // Si hay un pedido en proceso (aún no confirmado), mostrarlo
    if (userState.data && userState.data.producto) {
        const cantidadStr = userState.data.cantidad ? `${userState.data.cantidad}kg` : 'cantidad por definir';
        const totalStr = userState.data.total ? `S/${userState.data.total.toFixed(2)}` : 'por calcular';
        
        headerPedidos += `🛒 *PEDIDO ACTUAL (sin confirmar)*\n`;
        headerPedidos += `━━━━━━━━━━━━━━━━━\n`;
        headerPedidos += `📦 ${userState.data.producto.nombre}\n`;
        headerPedidos += `⚖️ Cantidad: ${cantidadStr}\n`;
        headerPedidos += `💰 Total: ${totalStr}\n`;
        headerPedidos += `━━━━━━━━━━━━━━━━━\n\n`;
        headerPedidos += `💡 _Escribe *cancelar* para eliminar_\n\n`;
    }
    
    // Menú principal
    let menu = headerPedidos;
    menu += `📱 *MENÚ PRINCIPAL*\n\n`;
    menu += `*1* - Ver catálogo y pedir ☕\n`;
    menu += `*2* - Consultar pedido 📦\n`;
    menu += `*3* - Información del negocio ℹ️\n`;
    
    // Opción 4 si tiene historial
    if (resultado.encontrados > 0) {
        menu += `*4* - Repetir pedido anterior 🔄\n`;
    }
    
    menu += `\nEnvía el número de tu elección`;
    
    console.log('========== MENÚ GENERADO ==========\n');
    
    return menu;
}

module.exports = {
    verificarPedidosCliente,
    generarMenuConPedidosDebug
};
