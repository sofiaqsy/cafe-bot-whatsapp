// Función CORREGIDA para obtener pedidos activos
async function obtenerPedidosActivosDesdeSheets(googleSheets, telefono) {
    if (!googleSheets || !googleSheets.initialized) {
        return [];
    }
    
    try {
        // IMPORTANTE: Normalizar teléfono quitando TODO
        let telefonoNormalizado = telefono;
        
        // Quitar whatsapp: si existe
        telefonoNormalizado = telefonoNormalizado.replace('whatsapp:', '');
        
        // Quitar +51 (puede venir como +51 o %2B51)
        telefonoNormalizado = telefonoNormalizado.replace('+51', '');
        telefonoNormalizado = telefonoNormalizado.replace('%2B51', '');
        
        // Quitar cualquier caracter que no sea número
        telefonoNormalizado = telefonoNormalizado.replace(/[^0-9]/g, '');
        
        console.log(`📦 Buscando pedidos para número normalizado: ${telefonoNormalizado}`);
        
        // Leer todos los pedidos
        const response = await googleSheets.sheets.spreadsheets.values.get({
            spreadsheetId: googleSheets.spreadsheetId,
            range: 'PedidosWhatsApp!A:T'
        });
        
        if (!response.data.values || response.data.values.length <= 1) {
            console.log('❌ No hay datos en PedidosWhatsApp');
            return [];
        }
        
        console.log(`📊 Total filas en Sheets: ${response.data.values.length}`);
        
        // Filtrar pedidos
        const pedidos = response.data.values;
        const pedidosActivos = [];
        let pedidosEncontrados = 0;
        
        for (let i = 1; i < pedidos.length; i++) {
            const row = pedidos[i];
            
            // Normalizar el WhatsApp de la columna T de la misma forma
            let whatsappPedido = String(row[19] || '');
            whatsappPedido = whatsappPedido.replace(/^'/, ''); // Quitar apóstrofe
            whatsappPedido = whatsappPedido.replace('+51', '');
            whatsappPedido = whatsappPedido.replace('%2B51', '');
            whatsappPedido = whatsappPedido.replace(/[^0-9]/g, '');
            
            const estado = row[14] || ''; // Columna O
            
            // Debug primeras filas
            if (i <= 3) {
                console.log(`  Fila ${i}: WhatsApp='${whatsappPedido}' vs Buscando='${telefonoNormalizado}', Estado='${estado}'`);
            }
            
            // Comparar números normalizados
            if (whatsappPedido === telefonoNormalizado) {
                pedidosEncontrados++;
                console.log(`✅ Pedido encontrado: ${row[0]} - Estado: ${estado}`);
                
                // Si no está completado/cancelado, agregarlo
                if (estado !== 'Completado' && 
                    estado !== 'Entregado' && 
                    estado !== 'Cancelado' &&
                    estado !== '') {
                    
                    // Parsear fecha
                    let fechaCompleta = new Date();
                    try {
                        const fechaStr = row[1];
                        const horaStr = row[2];
                        if (fechaStr && horaStr) {
                            const [dia, mes, año] = fechaStr.split('/');
                            fechaCompleta = new Date(`${año}-${mes}-${dia} ${horaStr}`);
                        }
                    } catch (e) {
                        // Usar fecha actual si hay error
                    }
                    
                    pedidosActivos.push({
                        id: row[0],
                        fecha: fechaCompleta,
                        empresa: row[3],
                        producto: row[7],
                        cantidad: parseFloat(row[8]) || 0,
                        total: parseFloat(row[12]) || 0,
                        estado: estado
                    });
                    
                    console.log(`  ➡️ Agregado a pedidos activos`);
                }
            }
        }
        
        // Ordenar por fecha más reciente
        pedidosActivos.sort((a, b) => b.fecha - a.fecha);
        
        console.log(`📦 Resultado: ${pedidosEncontrados} pedidos totales, ${pedidosActivos.length} activos`);
        return pedidosActivos;
        
    } catch (error) {
        console.error('❌ Error obteniendo pedidos:', error.message);
        return [];
    }
}

module.exports = {
    obtenerPedidosActivosDesdeSheets
};
