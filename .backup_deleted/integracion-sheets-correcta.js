// Función mejorada para obtener pedidos activos desde Google Sheets
async function obtenerPedidosActivosDesdeSheets(telefono) {
    if (!googleSheets || !googleSheets.initialized) {
        return [];
    }
    
    try {
        // Normalizar teléfono
        const telefonoNormalizado = telefono
            .replace('whatsapp:', '')
            .replace(/[^0-9+]/g, '');
        
        // Leer todos los pedidos de la hoja PedidosWhatsApp
        const response = await googleSheets.sheets.spreadsheets.values.get({
            spreadsheetId: googleSheets.spreadsheetId,
            range: 'PedidosWhatsApp!A:T' // Columnas hasta Usuario WhatsApp
        });
        
        if (!response.data.values || response.data.values.length <= 1) {
            return [];
        }
        
        // Obtener índices de columnas (basado en encabezados)
        const headers = response.data.values[0];
        const indices = {
            id: headers.indexOf('ID Pedido'),
            fecha: headers.indexOf('Fecha'),
            hora: headers.indexOf('Hora'),
            empresa: headers.indexOf('Empresa'),
            telefono: headers.indexOf('Teléfono'),
            producto: headers.indexOf('Producto'),
            cantidad: headers.indexOf('Cantidad (kg)'),
            total: headers.indexOf('Total'),
            estado: headers.indexOf('Estado'),
            usuarioWhatsApp: headers.indexOf('Usuario WhatsApp')
        };
        
        // Filtrar pedidos del usuario que NO estén completados o cancelados
        const pedidosUsuario = response.data.values.slice(1).filter(row => {
            const telPedido = row[indices.usuarioWhatsApp] || row[indices.telefono] || '';
            const telNormalizado = telPedido.replace(/[^0-9+]/g, '');
            const estado = row[indices.estado] || '';
            
            // Coincide el teléfono y NO está completado/cancelado
            return telNormalizado === telefonoNormalizado && 
                   estado !== 'Completado' && 
                   estado !== 'Entregado' &&
                   estado !== 'Cancelado' &&
                   estado !== '';
        });
        
        // Convertir a formato de objeto
        const pedidosActivos = pedidosUsuario.map(row => {
            // Parsear fecha y hora
            const fechaStr = row[indices.fecha] || '';
            const horaStr = row[indices.hora] || '';
            let fechaCompleta;
            
            try {
                if (fechaStr && horaStr) {
                    // Combinar fecha y hora
                    const [dia, mes, año] = fechaStr.split('/');
                    fechaCompleta = new Date(`${año}-${mes}-${dia} ${horaStr}`);
                } else {
                    fechaCompleta = new Date();
                }
            } catch (e) {
                fechaCompleta = new Date();
            }
            
            return {
                id: row[indices.id] || 'SIN-ID',
                fecha: fechaCompleta,
                empresa: row[indices.empresa] || '',
                producto: row[indices.producto] || '',
                cantidad: parseFloat(row[indices.cantidad]) || 0,
                total: parseFloat(row[indices.total]) || 0,
                estado: row[indices.estado] || 'Pendiente'
            };
        });
        
        // Ordenar por fecha más reciente primero
        pedidosActivos.sort((a, b) => b.fecha - a.fecha);
        
        console.log(`📊 Pedidos activos encontrados en Sheets: ${pedidosActivos.length}`);
        return pedidosActivos;
        
    } catch (error) {
        console.error('Error obteniendo pedidos de Sheets:', error.message);
        return [];
    }
}

// Función actualizada para generar el menú con pedidos de Sheets
async function obtenerMenuConPedidosSheets(userState, telefono) {
    let headerPedidos = '';
    
    // Obtener pedidos activos desde Google Sheets
    const pedidosActivos = await obtenerPedidosActivosDesdeSheets(telefono);
    
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
            
            if (p.estado.includes('verificado') || p.estado.includes('Verificado')) {
                iconoEstado = '✅';
                textoEstado = 'Pago verificado';
            } else if (p.estado.includes('preparación') || p.estado.includes('Preparación')) {
                iconoEstado = '👨‍🍳';
                textoEstado = 'En preparación';
            } else if (p.estado.includes('camino') || p.estado.includes('Camino')) {
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
    
    // Si hay un pedido en proceso (aún no confirmado en memoria), mostrarlo
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
    if (sheetsConfigured && googleSheets) {
        try {
            const tieneHistorial = await verificarHistorialCliente(telefono);
            if (tieneHistorial) {
                menu += `*4* - Repetir pedido anterior 🔄\n`;
            }
        } catch (error) {
            // Si hay error, no mostrar opción 4
        }
    }
    
    menu += `\nEnvía el número de tu elección`;
    
    return menu;
}

// Función para verificar si el cliente tiene pedidos anteriores
async function verificarHistorialCliente(telefono) {
    if (!googleSheets || !googleSheets.initialized) {
        return false;
    }
    
    try {
        const telefonoNormalizado = telefono
            .replace('whatsapp:', '')
            .replace(/[^0-9+]/g, '');
        
        const response = await googleSheets.sheets.spreadsheets.values.get({
            spreadsheetId: googleSheets.spreadsheetId,
            range: 'PedidosWhatsApp!T:T' // Columna Usuario WhatsApp
        });
        
        if (!response.data.values || response.data.values.length <= 1) {
            return false;
        }
        
        // Buscar si existe al menos un pedido con este teléfono
        const tieneHistorial = response.data.values.slice(1).some(row => {
            const tel = row[0] ? row[0].replace(/[^0-9+]/g, '') : '';
            return tel === telefonoNormalizado;
        });
        
        return tieneHistorial;
    } catch (error) {
        return false;
    }
}

// Función actualizada para guardar pedido correctamente
async function guardarPedidoEnSheets(datosPedido) {
    if (!googleSheets || !googleSheets.initialized) {
        return false;
    }
    
    try {
        // Primero guardar o actualizar cliente en hoja Clientes
        const idCliente = await googleSheets.guardarCliente({
            whatsapp: datosPedido.telefono,
            empresa: datosPedido.empresa || datosPedido.cafeteria,
            contacto: datosPedido.contacto,
            telefonoContacto: datosPedido.telefonoContacto || datosPedido.telefono,
            direccion: datosPedido.direccion,
            totalPedido: datosPedido.total,
            cantidadKg: datosPedido.cantidad
        });
        
        // Luego guardar el pedido en PedidosWhatsApp
        const fecha = new Date();
        const fechaStr = fecha.toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
        const horaStr = fecha.toLocaleTimeString('es-PE', { timeZone: 'America/Lima' });
        
        const values = [[
            datosPedido.id,
            fechaStr,
            horaStr,
            datosPedido.empresa || datosPedido.cafeteria || 'Sin nombre',
            datosPedido.contacto || 'Sin contacto',
            datosPedido.telefono || 'Sin teléfono',
            datosPedido.direccion || 'Sin dirección',
            datosPedido.producto?.nombre || 'Producto',
            datosPedido.cantidad || 0,
            datosPedido.producto?.precio || 0,
            datosPedido.subtotal || datosPedido.total || 0,
            datosPedido.descuento || 0,
            datosPedido.total || 0,
            datosPedido.metodoPago || 'Transferencia',
            datosPedido.estado || 'Pendiente verificación',
            datosPedido.urlComprobante || '',
            datosPedido.observaciones || '',
            datosPedido.esReorden ? 'Reorden' : 'Nuevo',
            idCliente || '',
            datosPedido.telefono.replace('whatsapp:', '') // Usuario WhatsApp normalizado
        ]];
        
        await googleSheets.sheets.spreadsheets.values.append({
            spreadsheetId: googleSheets.spreadsheetId,
            range: 'PedidosWhatsApp!A:T',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: values }
        });
        
        console.log(`✅ Pedido ${datosPedido.id} guardado en PedidosWhatsApp`);
        console.log(`👤 Cliente ${idCliente} actualizado en hoja Clientes`);
        return true;
        
    } catch (error) {
        console.error('❌ Error guardando en Sheets:', error.message);
        return false;
    }
}

// Actualizar estado de pedido en Sheets
async function actualizarEstadoPedidoEnSheets(idPedido, nuevoEstado) {
    if (!googleSheets || !googleSheets.initialized) {
        return false;
    }
    
    try {
        // Buscar el pedido en la hoja
        const response = await googleSheets.sheets.spreadsheets.values.get({
            spreadsheetId: googleSheets.spreadsheetId,
            range: 'PedidosWhatsApp!A:A'
        });
        
        if (!response.data.values) {
            return false;
        }
        
        // Encontrar la fila del pedido
        const filaIndex = response.data.values.findIndex(row => row[0] === idPedido);
        
        if (filaIndex > 0) { // > 0 porque la fila 0 son los encabezados
            // Actualizar el estado (columna N = columna 14)
            await googleSheets.sheets.spreadsheets.values.update({
                spreadsheetId: googleSheets.spreadsheetId,
                range: `PedidosWhatsApp!N${filaIndex + 1}`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: [[nuevoEstado]]
                }
            });
            
            console.log(`✅ Estado actualizado en Sheets: ${idPedido} -> ${nuevoEstado}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error actualizando estado en Sheets:', error.message);
        return false;
    }
}

// Ejemplo de uso en el caso 'inicio'
case 'inicio':
    // Acceso directo con números
    if (['1', '2', '3', '4'].includes(mensaje)) {
        userState.step = 'menu_principal';
        userStates.set(from, userState);
        return manejarMensaje(from, mensaje);
    }
    
    // Acceso con saludos
    if (mensaje.toLowerCase().includes('hola') || 
        mensaje.toLowerCase().includes('buenas') ||
        mensaje.toLowerCase().includes('buenos')) {
        
        // Obtener menú con pedidos desde Sheets
        respuesta = await obtenerMenuConPedidosSheets(userState, from);
        userState.step = 'menu_principal';
    } else {
        respuesta = `Hola 👋\n\n`;
        respuesta += `Soy el asistente virtual de *${BUSINESS_CONFIG.name}*\n\n`;
        respuesta += `Escribe *hola* para ver el menú\n`;
        respuesta += `O envía directamente:\n`;
        respuesta += `*1* para ver catálogo\n`;
        respuesta += `*2* para consultar pedido\n`;
        respuesta += `*3* para información`;
    }
    break;
