// Funciones para leer datos de Google Sheets y mejorar la experiencia del cliente

// Función para buscar cliente existente en Sheets
async function buscarClienteEnSheets(googleSheets, telefono) {
    if (!googleSheets || !googleSheets.initialized) {
        return null;
    }
    
    try {
        // Normalizar teléfono
        const telefonoNormalizado = telefono
            .replace('whatsapp:', '')
            .replace('+51', '') // Quitar prefijo de Perú
            .replace(/[^0-9]/g, ''); // Solo números
        
        console.log(`🔍 Buscando cliente con WhatsApp: ${telefonoNormalizado}`);
        
        // Leer todos los clientes de la hoja
        const response = await googleSheets.sheets.spreadsheets.values.get({
            spreadsheetId: googleSheets.spreadsheetId,
            range: 'Clientes!A:G' // Hasta columna G (Dirección)
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
            const whatsappCliente = row[1] ? 
                row[1].replace('+51', '').replace(/[^0-9]/g, '') : '';
            
            if (whatsappCliente === telefonoNormalizado) {
                console.log(`✅ Cliente encontrado: ${row[2]} (${row[0]})`);
                return {
                    idCliente: row[0],          // A: ID_Cliente
                    whatsapp: row[1],           // B: WhatsApp
                    empresa: row[2],            // C: Empresa
                    contacto: row[3],           // D: Nombre_Contacto
                    telefono: row[4] || row[1], // E: Telefono_Contacto
                    email: row[5] || '',        // F: Email
                    direccion: row[6] || ''     // G: Direccion
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
        // Normalizar teléfono
        const telefonoNormalizado = telefono
            .replace('whatsapp:', '')
            .replace(/[^0-9+]/g, '');
        
        console.log(`📦 Buscando pedidos activos para: ${telefonoNormalizado}`);
        
        // Leer todos los pedidos
        const response = await googleSheets.sheets.spreadsheets.values.get({
            spreadsheetId: googleSheets.spreadsheetId,
            range: 'PedidosWhatsApp!A:T' // Todas las columnas
        });
        
        if (!response.data.values || response.data.values.length <= 1) {
            return [];
        }
        
        // Filtrar pedidos del usuario
        const pedidos = response.data.values;
        const pedidosActivos = [];
        
        for (let i = 1; i < pedidos.length; i++) {
            const row = pedidos[i];
            // Normalizar el WhatsApp de la columna T también
            const whatsappPedido = row[19] ? 
                String(row[19])
                    .replace(/^'/, '')  // Quitar apóstrofe inicial si existe
                    .replace('+51', '') // Quitar prefijo
                    .replace(/[^0-9]/g, '') : ''; // Solo números
            const estado = row[14] || ''; // Columna O
            
            // Solo pedidos del usuario que NO estén completados/cancelados
            if (whatsappPedido === telefonoNormalizado) {
                if (estado !== 'Completado' && 
                    estado !== 'Entregado' && 
                    estado !== 'Cancelado' &&
                    estado !== '') {
                    
                    // Parsear fecha y hora
                    let fechaCompleta = new Date();
                    try {
                        const fechaStr = row[1]; // Columna B: Fecha
                        const horaStr = row[2];  // Columna C: Hora
                        if (fechaStr && horaStr) {
                            const [dia, mes, año] = fechaStr.split('/');
                            fechaCompleta = new Date(`${año}-${mes}-${dia} ${horaStr}`);
                        }
                    } catch (e) {
                        // Usar fecha actual si hay error
                    }
                    
                    pedidosActivos.push({
                        id: row[0],              // A: ID_Pedido
                        fecha: fechaCompleta,
                        empresa: row[3],         // D: Empresa
                        producto: row[7],        // H: Producto
                        cantidad: parseFloat(row[8]) || 0,  // I: Cantidad_kg
                        total: parseFloat(row[12]) || 0,    // M: Total
                        estado: estado           // O: Estado
                    });
                }
            }
        }
        
        // Ordenar por fecha más reciente primero
        pedidosActivos.sort((a, b) => b.fecha - a.fecha);
        
        console.log(`📊 Pedidos activos encontrados: ${pedidosActivos.length}`);
        return pedidosActivos;
        
    } catch (error) {
        console.error('Error obteniendo pedidos:', error.message);
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
            // Calcular tiempo transcurrido
            const ahora = new Date();
            const tiempoMs = ahora - p.fecha;
            const minutos = Math.floor(tiempoMs / (1000 * 60));
            
            let tiempoTexto = '';
            if (minutos < 60) {
                tiempoTexto = `${minutos} min`;
            } else if (minutos < 1440) {
                tiempoTexto = `${Math.floor(minutos/60)} horas`;
            } else {
                tiempoTexto = `${Math.floor(minutos/1440)} días`;
            }
            
            // Determinar ícono según estado
            let iconoEstado = '⏳';
            let textoEstado = p.estado;
            
            if (p.estado.includes('verificado') || p.estado.includes('✅')) {
                iconoEstado = '✅';
                textoEstado = 'Pago verificado';
            } else if (p.estado.includes('preparación')) {
                iconoEstado = '👨‍🍳';
                textoEstado = 'En preparación';
            } else if (p.estado.includes('camino')) {
                iconoEstado = '🚚';
                textoEstado = 'En camino';
            } else if (p.estado.includes('Pendiente')) {
                iconoEstado = '⏳';
                textoEstado = 'Pendiente verificación';
            }
            
            headerPedidos += `${iconoEstado} *${p.id}*\n`;
            headerPedidos += `   ${p.producto}\n`;
            headerPedidos += `   ${p.cantidad}kg - S/${p.total.toFixed(2)}\n`;
            headerPedidos += `   Estado: *${textoEstado}*\n`;
            headerPedidos += `   ⏱️ Hace ${tiempoTexto}\n\n`;
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
    
    // Verificar si tiene historial para mostrar opción 4
    if (pedidosActivos.length > 0 || await verificarHistorialCliente(googleSheets, telefono)) {
        menu += `*4* - Repetir pedido anterior 🔄\n`;
    }
    
    menu += `\nEnvía el número de tu elección`;
    
    return menu;
}

// Función para verificar si tiene historial
async function verificarHistorialCliente(googleSheets, telefono) {
    if (!googleSheets || !googleSheets.initialized) {
        return false;
    }
    
    try {
        const telefonoNormalizado = telefono
            .replace('whatsapp:', '')
            .replace(/[^0-9+]/g, '');
        
        const response = await googleSheets.sheets.spreadsheets.values.get({
            spreadsheetId: googleSheets.spreadsheetId,
            range: 'PedidosWhatsApp!T:T' // Solo columna Usuario WhatsApp
        });
        
        if (!response.data.values || response.data.values.length <= 1) {
            return false;
        }
        
        // Buscar si existe al menos un pedido
        return response.data.values.slice(1).some(row => {
            const tel = row[0] ? row[0].replace(/[^0-9+]/g, '') : '';
            return tel === telefonoNormalizado;
        });
    } catch (error) {
        return false;
    }
}

// Función para obtener el último pedido del cliente
async function obtenerUltimoPedidoCliente(googleSheets, telefono) {
    if (!googleSheets || !googleSheets.initialized) {
        return null;
    }
    
    try {
        const telefonoNormalizado = telefono
            .replace('whatsapp:', '')
            .replace(/[^0-9+]/g, '');
        
        const response = await googleSheets.sheets.spreadsheets.values.get({
            spreadsheetId: googleSheets.spreadsheetId,
            range: 'PedidosWhatsApp!A:T'
        });
        
        if (!response.data.values || response.data.values.length <= 1) {
            return null;
        }
        
        const pedidos = response.data.values;
        let ultimoPedido = null;
        let fechaMasReciente = null;
        
        for (let i = 1; i < pedidos.length; i++) {
            const row = pedidos[i];
            const whatsappPedido = row[19] ? row[19].replace(/[^0-9+]/g, '') : '';
            
            if (whatsappPedido === telefonoNormalizado) {
                const fechaStr = row[1];
                const horaStr = row[2];
                let fecha;
                
                try {
                    const [dia, mes, año] = fechaStr.split('/');
                    fecha = new Date(`${año}-${mes}-${dia} ${horaStr}`);
                } catch (e) {
                    fecha = new Date();
                }
                
                if (!fechaMasReciente || fecha > fechaMasReciente) {
                    fechaMasReciente = fecha;
                    ultimoPedido = {
                        id: row[0],
                        empresa: row[3],
                        contacto: row[4],
                        telefono: row[5],
                        direccion: row[6],
                        producto: row[7],
                        cantidad: parseFloat(row[8]) || 0,
                        precio: parseFloat(row[9]) || 0,
                        total: parseFloat(row[12]) || 0
                    };
                }
            }
        }
        
        return ultimoPedido;
    } catch (error) {
        console.error('Error obteniendo último pedido:', error.message);
        return null;
    }
}

module.exports = {
    buscarClienteEnSheets,
    obtenerPedidosActivosDesdeSheets,
    generarMenuConPedidos,
    verificarHistorialCliente,
    obtenerUltimoPedidoCliente
};
