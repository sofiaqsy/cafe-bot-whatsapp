// VERSIÓN CORREGIDA: Trabajando CON +51 en todos lados
// Este archivo reemplaza sheets-lectura-datos.js

// Función para buscar cliente existente en Sheets
async function buscarClienteEnSheets(googleSheets, telefono) {
    if (!googleSheets || !googleSheets.initialized) {
        return null;
    }
    
    try {
        // Normalizar teléfono para que siempre tenga +51
        let telefonoNormalizado = telefono
            .replace('whatsapp:', '')
            .replace(/[^0-9+]/g, '');
        
        // Asegurar formato +51
        if (!telefonoNormalizado.startsWith('+51')) {
            if (telefonoNormalizado.startsWith('51')) {
                telefonoNormalizado = '+' + telefonoNormalizado;
            } else {
                telefonoNormalizado = '+51' + telefonoNormalizado;
            }
        }
        
        console.log(`🔍 Buscando cliente con WhatsApp: ${telefonoNormalizado}`);
        
        // Leer todos los clientes de la hoja
        const response = await googleSheets.sheets.spreadsheets.values.get({
            spreadsheetId: googleSheets.spreadsheetId,
            range: 'Clientes!A:G'
        });
        
        if (!response.data.values || response.data.values.length <= 1) {
            console.log('📋 No hay clientes registrados');
            return null;
        }
        
        // Buscar el cliente por WhatsApp (columna B)
        const clientes = response.data.values;
        for (let i = 1; i < clientes.length; i++) {
            const row = clientes[i];
            
            // Normalizar el WhatsApp guardado también
            let whatsappCliente = String(row[1] || '')
                .replace(/^'/, '') // Quitar apóstrofe si Excel lo agregó
                .replace(/[^0-9+]/g, '');
            
            // Asegurar formato +51
            if (!whatsappCliente.startsWith('+51')) {
                if (whatsappCliente.startsWith('51')) {
                    whatsappCliente = '+' + whatsappCliente;
                } else if (whatsappCliente.length > 0) {
                    whatsappCliente = '+51' + whatsappCliente;
                }
            }
            
            if (whatsappCliente === telefonoNormalizado) {
                console.log(`✅ Cliente encontrado: ${row[2]} (${row[0]})`);
                return {
                    idCliente: row[0],
                    whatsapp: row[1],
                    empresa: row[2],
                    contacto: row[3],
                    telefono: row[4] || row[1],
                    email: row[5] || '',
                    direccion: row[6] || ''
                };
            }
        }
        
        console.log('❌ Cliente no encontrado en base de datos');
        return null;
    } catch (error) {
        console.error('Error buscando cliente:', error.message);
        return null;
    }
}

// Función para obtener pedidos activos desde Sheets
async function obtenerPedidosActivosDesdeSheets(googleSheets, telefono) {
    if (!googleSheets || !googleSheets.initialized) {
        return [];
    }
    
    try {
        // Normalizar teléfono para que siempre tenga +51
        let telefonoNormalizado = telefono
            .replace('whatsapp:', '')
            .replace(/[^0-9+]/g, '');
        
        // Asegurar que tenga +51
        if (!telefonoNormalizado.startsWith('+51')) {
            if (telefonoNormalizado.startsWith('51')) {
                telefonoNormalizado = '+' + telefonoNormalizado;
            } else {
                telefonoNormalizado = '+51' + telefonoNormalizado;
            }
        }
        
        console.log(`📦 Buscando pedidos activos para: ${telefonoNormalizado}`);
        
        // Leer todos los pedidos
        const response = await googleSheets.sheets.spreadsheets.values.get({
            spreadsheetId: googleSheets.spreadsheetId,
            range: 'PedidosWhatsApp!A:T'
        });
        
        if (!response.data.values || response.data.values.length <= 1) {
            console.log('📄 No hay datos en PedidosWhatsApp');
            return [];
        }
        
        console.log(`📄 Total filas en Sheets: ${response.data.values.length}`);
        
        // Filtrar pedidos del usuario
        const pedidos = response.data.values;
        const pedidosActivos = [];
        let pedidosEncontrados = 0;
        
        for (let i = 1; i < pedidos.length; i++) {
            const row = pedidos[i];
            
            // Normalizar el WhatsApp de la columna T
            // Excel/Sheets puede agregar apóstrofe al inicio
            let whatsappPedido = String(row[19] || '')
                .replace(/^'/, '')  // Quitar apóstrofe inicial
                .replace(/[^0-9+]/g, ''); // Mantener + y números
            
            // Asegurar formato con +51
            if (!whatsappPedido.startsWith('+51')) {
                if (whatsappPedido.startsWith('51')) {
                    whatsappPedido = '+' + whatsappPedido;
                } else if (whatsappPedido.length > 0) {
                    whatsappPedido = '+51' + whatsappPedido;
                }
            }
            
            const estado = row[14] || ''; // Columna O
            
            // Debug primeras filas
            if (i <= 3) {
                console.log(`  Fila ${i}: WhatsApp='${whatsappPedido}' vs Buscando='${telefonoNormalizado}', Estado='${estado}'`);
            }
            
            // Comparar números normalizados
            if (whatsappPedido === telefonoNormalizado) {
                pedidosEncontrados++;
                console.log(`✅ Pedido encontrado: ${row[0]} - Estado: ${estado}`);
                
                if (estado !== 'Completado' && 
                    estado !== 'Entregado' && 
                    estado !== 'Cancelado' &&
                    estado !== '') {
                    
                    // Parsear fecha y hora
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
        
        // Ordenar por fecha más reciente primero
        pedidosActivos.sort((a, b) => b.fecha - a.fecha);
        
        console.log(`📦 Resultado: ${pedidosEncontrados} pedidos totales, ${pedidosActivos.length} activos`);
        return pedidosActivos;
        
    } catch (error) {
        console.error('❌ Error obteniendo pedidos:', error.message);
        return [];
    }
}

// Función para generar el menú con pedidos activos
async function generarMenuConPedidos(googleSheets, telefono, userState) {
    let headerPedidos = '';
    
    // Obtener pedidos activos desde Sheets
    const pedidosActivos = await obtenerPedidosActivosDesdeSheets(googleSheets, telefono);
    
    // Si hay pedidos activos, mostrarlos
    if (pedidosActivos.length > 0) {
        headerPedidos = `📦 *TUS PEDIDOS EN CURSO*\n`;
        headerPedidos += `━━━━━━━━━━━━━━━━━\n\n`;
        
        pedidosActivos.forEach(p => {
            // Calcular tiempo transcurrido correctamente
            let tiempoTexto = '';
            
            // Validar que p.fecha sea una fecha válida
            if (p.fecha && !isNaN(p.fecha.getTime())) {
                const ahora = new Date();
                const tiempoMs = ahora - p.fecha;
                const minutos = Math.floor(tiempoMs / (1000 * 60));
                
                // Si es negativo (fecha futura), mostrar "Reciente"
                if (minutos < 0) {
                    tiempoTexto = 'Reciente';
                } else if (minutos === 0) {
                    tiempoTexto = 'Ahora mismo';
                } else if (minutos < 60) {
                    // Mostrar minutos
                    tiempoTexto = `${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
                } else if (minutos < 1440) {
                    // Mostrar horas
                    const horas = Math.floor(minutos / 60);
                    tiempoTexto = `${horas} ${horas === 1 ? 'hora' : 'horas'}`;
                } else {
                    // Mostrar días
                    const dias = Math.floor(minutos / 1440);
                    tiempoTexto = `${dias} ${dias === 1 ? 'día' : 'días'}`;
                }
            } else {
                // Si no hay fecha válida, mostrar "Hoy"
                tiempoTexto = 'Hoy';
            }
            
            // Determinar ícono según estado
            let iconoEstado = '⏳';
            let textoEstado = p.estado;
            
            if (p.estado && (p.estado.includes('verificado') || p.estado.includes('✅'))) {
                iconoEstado = '✅';
                textoEstado = 'Pago verificado';
            } else if (p.estado && p.estado.includes('preparación')) {
                iconoEstado = '👨‍🍳';
                textoEstado = 'En preparación';
            } else if (p.estado && p.estado.includes('camino')) {
                iconoEstado = '🚚';
                textoEstado = 'En camino';
            } else if (p.estado && p.estado.includes('Pendiente')) {
                iconoEstado = '⏳';
                textoEstado = 'Pendiente verificación';
            }
            
            headerPedidos += `${iconoEstado} *${p.id}*\n`;
            headerPedidos += `   ${p.producto}\n`;
            headerPedidos += `   ${p.cantidad}kg - S/${p.total.toFixed(2)}\n`;
            headerPedidos += `   Estado: *${textoEstado}*\n`;
            
            // Mostrar tiempo con "Hace" solo cuando corresponde
            if (tiempoTexto === 'Ahora mismo' || tiempoTexto === 'Reciente' || tiempoTexto === 'Hoy') {
                headerPedidos += `   ⏱️ ${tiempoTexto}\n\n`;
            } else {
                headerPedidos += `   ⏱️ Hace ${tiempoTexto}\n\n`;
            }
        });
        
        headerPedidos += `💡 _Usa el código para consultar detalles_\n`;
        headerPedidos += `━━━━━━━━━━━━━━━━━\n\n`;
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
    
    menu += `\nEnvía el número de tu elección`;
    
    return menu;
}

// Función para verificar si tiene historial
async function verificarHistorialCliente(googleSheets, telefono) {
    const pedidos = await obtenerPedidosActivosDesdeSheets(googleSheets, telefono);
    return pedidos.length > 0;
}

// Función para obtener el último pedido
async function obtenerUltimoPedidoCliente(googleSheets, telefono) {
    const pedidos = await obtenerPedidosActivosDesdeSheets(googleSheets, telefono);
    return pedidos.length > 0 ? pedidos[0] : null;
}

module.exports = {
    buscarClienteEnSheets,
    obtenerPedidosActivosDesdeSheets,
    generarMenuConPedidos,
    verificarHistorialCliente,
    obtenerUltimoPedidoCliente
};
