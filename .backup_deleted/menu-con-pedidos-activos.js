// Función mejorada para obtener el menú con pedidos en curso
function obtenerMenuConPedidos(userState, telefono) {
    let headerPedidos = '';
    
    // Obtener todos los pedidos del cliente
    const pedidosCliente = Array.from(pedidosConfirmados.values())
        .filter(p => p.telefono === telefono)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    // Filtrar pedidos activos (no completados)
    const pedidosActivos = pedidosCliente.filter(p => 
        p.estado === 'Pendiente verificación' || 
        p.estado === 'Pago verificado ✅' ||
        p.estado === 'En preparación' ||
        p.estado === 'En camino'
    );
    
    // Si hay pedidos activos, mostrarlos
    if (pedidosActivos.length > 0) {
        headerPedidos = `📦 *TUS PEDIDOS EN CURSO*\n`;
        headerPedidos += `━━━━━━━━━━━━━━━━━\n\n`;
        
        pedidosActivos.forEach(p => {
            const tiempo = Math.round((new Date() - new Date(p.fecha)) / (1000 * 60));
            let tiempoTexto = '';
            if (tiempo < 60) {
                tiempoTexto = `${tiempo} min`;
            } else if (tiempo < 1440) {
                tiempoTexto = `${Math.round(tiempo/60)} horas`;
            } else {
                tiempoTexto = `${Math.round(tiempo/1440)} días`;
            }
            
            // Determinar ícono según estado
            let iconoEstado = '⏳';
            let colorEstado = '';
            switch(p.estado) {
                case 'Pago verificado ✅':
                    iconoEstado = '✅';
                    colorEstado = 'Verificado';
                    break;
                case 'En preparación':
                    iconoEstado = '👨‍🍳';
                    colorEstado = 'Preparando';
                    break;
                case 'En camino':
                    iconoEstado = '🚚';
                    colorEstado = 'En camino';
                    break;
                default:
                    iconoEstado = '⏳';
                    colorEstado = 'Pendiente';
            }
            
            headerPedidos += `${iconoEstado} *${p.id}*\n`;
            headerPedidos += `   ${p.producto.nombre}\n`;
            headerPedidos += `   ${p.cantidad}kg - ${formatearPrecio(p.total)}\n`;
            headerPedidos += `   Estado: *${colorEstado}*\n`;
            headerPedidos += `   ⏱️ Hace ${tiempoTexto}\n\n`;
        });
        
        headerPedidos += `💡 _Usa el código para consultar detalles_\n`;
        headerPedidos += `━━━━━━━━━━━━━━━━━\n\n`;
    }
    
    // Si hay un pedido en proceso (aún no confirmado), mostrarlo también
    if (userState.data && userState.data.producto) {
        const cantidadStr = userState.data.cantidad ? `${userState.data.cantidad}kg` : 'cantidad por definir';
        const totalStr = userState.data.total ? formatearPrecio(userState.data.total) : 'por calcular';
        
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
    
    // Si tiene historial, agregar opción de reordenar
    if (pedidosCliente.length > 0) {
        menu += `*4* - Repetir pedido anterior 🔄\n`;
    }
    
    menu += `\nEnvía el número de tu elección`;
    
    return menu;
}

// Caso mejorado para confirmar_pedido sin mensajes de bienvenida
case 'confirmar_pedido':
    if (mensaje.toLowerCase() === 'si' || mensaje.toLowerCase() === 'sí') {
        // Buscar si el cliente ya existe
        let datosClienteGuardado = null;
        let estadisticasCliente = null;
        
        // Primero buscar en Google Sheets si está configurado
        if (sheetsConfigured && googleSheets && googleSheets.buscarCliente) {
            try {
                estadisticasCliente = await googleSheets.obtenerEstadisticasCliente(from);
                
                if (estadisticasCliente.existe) {
                    datosClienteGuardado = {
                        empresa: estadisticasCliente.empresa,
                        contacto: estadisticasCliente.contacto,
                        telefono: estadisticasCliente.telefonoContacto || estadisticasCliente.whatsapp,
                        direccion: estadisticasCliente.direccion
                    };
                    
                    console.log(`👤 Cliente encontrado: ${estadisticasCliente.empresa} (${estadisticasCliente.totalPedidos} pedidos previos)`);
                }
            } catch (error) {
                console.log('⚠️ No se pudo verificar cliente en Sheets');
            }
        }
        
        // Si no está en Sheets, buscar en memoria local
        if (!datosClienteGuardado) {
            datosClienteGuardado = datosClientes.get(from);
        }
        
        if (datosClienteGuardado) {
            // Cliente conocido - Mostrar datos para confirmar
            userState.data = {
                ...userState.data,
                ...datosClienteGuardado,
                esClienteConocido: true
            };
            
            respuesta = `📋 *CONFIRMA TUS DATOS DE ENTREGA*\n`;
            respuesta += `━━━━━━━━━━━━━━━━━\n\n`;
            
            respuesta += `🏢 *Empresa:* ${datosClienteGuardado.empresa}\n`;
            respuesta += `👤 *Contacto:* ${datosClienteGuardado.contacto}\n`;
            respuesta += `📱 *Teléfono:* ${datosClienteGuardado.telefono}\n`;
            respuesta += `📍 *Dirección:* ${datosClienteGuardado.direccion}\n\n`;
            
            respuesta += `━━━━━━━━━━━━━━━━━\n\n`;
            respuesta += `¿Los datos son correctos?\n\n`;
            respuesta += `✅ Envía *SI* para continuar al pago\n`;
            respuesta += `✏️ Envía *MODIFICAR* para actualizar datos\n`;
            respuesta += `❌ Envía *NO* para cancelar pedido`;
            
            userState.step = 'confirmar_datos_cliente';
        } else {
            // Cliente nuevo - pedir datos
            respuesta = `👤 *DATOS PARA LA ENTREGA*\n\n`;
            respuesta += `Por favor, ingresa el *nombre de tu empresa o negocio*:`;
            userState.step = 'datos_empresa';
        }
    } else if (mensaje.toLowerCase() === 'no') {
        userState.data = {};
        const pedidosActivos = obtenerPedidosPendientes(from);
        respuesta = `❌ Pedido cancelado.\n\n`;
        respuesta += obtenerMenuConPedidos(userState, from);
        userState.step = 'menu_principal';
    } else {
        respuesta = `Por favor, responde:\n\n`;
        respuesta += `*SI* - Confirmar pedido\n`;
        respuesta += `*NO* - Cancelar\n`;
        respuesta += `*MENU* - Volver al menú`;
    }
    break;

// Función para obtener estadísticas del dashboard
function obtenerEstadisticasDashboard() {
    const pedidos = Array.from(pedidosConfirmados.values());
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Pedidos por estado
    const estadisticas = {
        total: pedidos.length,
        pendientesVerificacion: pedidos.filter(p => p.estado === 'Pendiente verificación').length,
        verificados: pedidos.filter(p => p.estado === 'Pago verificado ✅').length,
        enPreparacion: pedidos.filter(p => p.estado === 'En preparación').length,
        enCamino: pedidos.filter(p => p.estado === 'En camino').length,
        completados: pedidos.filter(p => p.estado === 'Completado').length,
        pedidosHoy: pedidos.filter(p => new Date(p.fecha) >= hoy).length,
        ventasHoy: pedidos
            .filter(p => new Date(p.fecha) >= hoy)
            .reduce((sum, p) => sum + p.total, 0)
    };
    
    return estadisticas;
}

// Actualizar el caso de inicio para mostrar pedidos activos
case 'inicio':
    const pedidosActivosInicio = obtenerPedidosPendientes(from);
    
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
        
        respuesta = obtenerMenuConPedidos(userState, from);
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

// Actualizar caso menu_principal
case 'menu_principal':
    switch (mensaje) {
        case '1':
            // Mostrar catálogo...
            break;
        case '2':
            // Consultar pedido...
            break;
        case '3':
            // Información...
            break;
        case '4':
            const historial = obtenerHistorialPedidos(from);
            if (historial.length > 0) {
                // Mostrar pedidos anteriores para reordenar...
            }
            break;
        default:
            respuesta = obtenerMenuConPedidos(userState, from);
    }
    break;
