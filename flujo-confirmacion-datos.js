// Función mejorada para el caso confirmar_pedido en bot-final.js
// Este código debe reemplazar el case 'confirmar_pedido':

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
                    
                    console.log(`👤 Cliente encontrado en Sheets: ${estadisticasCliente.empresa} (${estadisticasCliente.totalPedidos} pedidos)`);
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
                esClienteConocido: true,
                totalPedidosAnteriores: estadisticasCliente?.totalPedidos || 0
            };
            
            // Mensaje personalizado según historial
            let encabezado = '';
            if (estadisticasCliente) {
                if (estadisticasCliente.totalPedidos >= 10) {
                    encabezado = `🌟 *¡Hola de nuevo, cliente VIP!*\n_Gracias por tu preferencia (${estadisticasCliente.totalPedidos} pedidos)_\n\n`;
                } else if (estadisticasCliente.totalPedidos >= 5) {
                    encabezado = `⭐ *¡Bienvenido nuevamente!*\n_Ya son ${estadisticasCliente.totalPedidos} pedidos con nosotros_\n\n`;
                } else if (estadisticasCliente.totalPedidos >= 2) {
                    encabezado = `😊 *¡Qué gusto verte de nuevo!*\n_Este será tu pedido #${estadisticasCliente.totalPedidos + 1}_\n\n`;
                }
            }
            
            respuesta = encabezado;
            respuesta += `📋 *CONFIRMA TUS DATOS*\n`;
            respuesta += `━━━━━━━━━━━━━━━━━\n\n`;
            
            respuesta += `🏢 *Empresa:* ${datosClienteGuardado.empresa}\n`;
            respuesta += `👤 *Contacto:* ${datosClienteGuardado.contacto}\n`;
            respuesta += `📱 *Teléfono:* ${datosClienteGuardado.telefono}\n`;
            respuesta += `📍 *Dirección:* ${datosClienteGuardado.direccion}\n\n`;
            
            respuesta += `━━━━━━━━━━━━━━━━━\n\n`;
            respuesta += `¿Los datos son correctos?\n\n`;
            respuesta += `✅ Envía *SI* para continuar\n`;
            respuesta += `✏️ Envía *MODIFICAR* para actualizar\n`;
            respuesta += `❌ Envía *NO* para cancelar`;
            
            userState.step = 'confirmar_datos_cliente';
        } else {
            // Cliente nuevo - pedir datos
            respuesta = `🆕 *REGISTRO DE CLIENTE*\n\n`;
            respuesta += `Para procesar tu pedido necesitamos algunos datos.\n\n`;
            respuesta += `Por favor, ingresa el *nombre de tu empresa o negocio*:`;
            userState.step = 'datos_empresa';
        }
    } else if (mensaje.toLowerCase() === 'no') {
        userState.data = {};
        respuesta = `❌ Pedido cancelado.\n\n`;
        respuesta += `📱 *MENÚ PRINCIPAL*\n\n`;
        respuesta += `*1* - Ver catálogo\n`;
        respuesta += `*2* - Consultar pedido\n`;
        respuesta += `*3* - Información\n\n`;
        respuesta += `Envía el número de tu elección`;
        userState.step = 'menu_principal';
    } else {
        respuesta = `Por favor, responde:\n\n`;
        respuesta += `*SI* - Confirmar pedido\n`;
        respuesta += `*NO* - Cancelar\n`;
        respuesta += `*MENU* - Volver al menú`;
    }
    break;

case 'confirmar_datos_cliente':
    if (mensaje.toLowerCase() === 'si' || mensaje.toLowerCase() === 'sí') {
        // Datos confirmados, proceder al pago
        respuesta = `✅ *DATOS CONFIRMADOS*\n\n`;
        respuesta += `━━━━━━━━━━━━━━━━━\n\n`;
        respuesta += `*MÉTODO DE PAGO*\n`;
        respuesta += `💳 Realiza la transferencia a:\n\n`;
        respuesta += `*Cuenta BCP Soles:*\n`;
        respuesta += `*${BUSINESS_CONFIG.bcp_cuenta}*\n\n`;
        respuesta += `*Cuenta Interbancaria (CCI):*\n`;
        respuesta += `*${BUSINESS_CONFIG.cci_cuenta}*\n\n`;
        respuesta += `*Titular:* ${BUSINESS_CONFIG.name}\n\n`;
        respuesta += `━━━━━━━━━━━━━━━━━\n\n`;
        respuesta += `💰 *Monto a transferir: ${formatearPrecio(userState.data.total)}*\n\n`;
        respuesta += `📸 *Una vez realizada la transferencia, envía la foto del voucher o comprobante*\n\n`;
        respuesta += `_El pedido será confirmado tras verificar el pago_`;
        
        userState.step = 'esperando_comprobante';
        
    } else if (mensaje.toLowerCase() === 'modificar' || mensaje.toLowerCase() === 'editar') {
        // Permitir modificar datos
        respuesta = `✏️ *MODIFICAR DATOS*\n\n`;
        respuesta += `¿Qué dato deseas modificar?\n\n`;
        respuesta += `*1* - Empresa/Negocio\n`;
        respuesta += `*2* - Nombre de contacto\n`;
        respuesta += `*3* - Teléfono\n`;
        respuesta += `*4* - Dirección\n`;
        respuesta += `*5* - Todos los datos\n\n`;
        respuesta += `Envía el número de tu elección`;
        
        userState.step = 'seleccionar_dato_modificar';
        
    } else if (mensaje.toLowerCase() === 'no') {
        userState.data = {};
        respuesta = `❌ Proceso cancelado.\n\n`;
        respuesta += `📱 *MENÚ PRINCIPAL*\n\n`;
        respuesta += `*1* - Ver catálogo\n`;
        respuesta += `*2* - Consultar pedido\n`;
        respuesta += `*3* - Información\n\n`;
        respuesta += `Envía el número de tu elección`;
        userState.step = 'menu_principal';
    } else {
        respuesta = `Por favor, responde:\n\n`;
        respuesta += `✅ *SI* - Datos correctos\n`;
        respuesta += `✏️ *MODIFICAR* - Cambiar datos\n`;
        respuesta += `❌ *NO* - Cancelar`;
    }
    break;

case 'seleccionar_dato_modificar':
    switch (mensaje) {
        case '1':
            respuesta = `📝 Ingresa el nuevo *nombre de empresa/negocio*:\n\n`;
            respuesta += `Actual: ${userState.data.empresa}`;
            userState.step = 'modificar_empresa';
            break;
            
        case '2':
            respuesta = `📝 Ingresa el nuevo *nombre de contacto*:\n\n`;
            respuesta += `Actual: ${userState.data.contacto}`;
            userState.step = 'modificar_contacto';
            break;
            
        case '3':
            respuesta = `📝 Ingresa el nuevo *número de teléfono*:\n\n`;
            respuesta += `Actual: ${userState.data.telefono}`;
            userState.step = 'modificar_telefono';
            break;
            
        case '4':
            respuesta = `📝 Ingresa la nueva *dirección completa*:\n`;
            respuesta += `_Incluye distrito y referencias_\n\n`;
            respuesta += `Actual: ${userState.data.direccion}`;
            userState.step = 'modificar_direccion';
            break;
            
        case '5':
            respuesta = `📝 *ACTUALIZAR TODOS LOS DATOS*\n\n`;
            respuesta += `Por favor, ingresa el *nombre de tu empresa o negocio*:`;
            userState.step = 'datos_empresa';
            break;
            
        default:
            respuesta = `❌ Por favor, selecciona una opción válida (1-5)\n\n`;
            respuesta += `*1* - Empresa/Negocio\n`;
            respuesta += `*2* - Nombre de contacto\n`;
            respuesta += `*3* - Teléfono\n`;
            respuesta += `*4* - Dirección\n`;
            respuesta += `*5* - Todos los datos`;
    }
    break;

case 'modificar_empresa':
    userState.data.empresa = mensaje;
    // Actualizar en memoria local
    datosClientes.set(from, {
        ...datosClientes.get(from),
        empresa: mensaje
    });
    respuesta = `✅ Empresa actualizada: *${mensaje}*\n\n`;
    // Volver a mostrar todos los datos
    respuesta += `📋 *DATOS ACTUALIZADOS*\n`;
    respuesta += `━━━━━━━━━━━━━━━━━\n\n`;
    respuesta += `🏢 *Empresa:* ${userState.data.empresa}\n`;
    respuesta += `👤 *Contacto:* ${userState.data.contacto}\n`;
    respuesta += `📱 *Teléfono:* ${userState.data.telefono}\n`;
    respuesta += `📍 *Dirección:* ${userState.data.direccion}\n\n`;
    respuesta += `¿Continuar con estos datos?\n\n`;
    respuesta += `✅ *SI* - Proceder al pago\n`;
    respuesta += `✏️ *MODIFICAR* - Cambiar otro dato`;
    userState.step = 'confirmar_datos_cliente';
    break;

case 'modificar_contacto':
    userState.data.contacto = mensaje;
    datosClientes.set(from, {
        ...datosClientes.get(from),
        contacto: mensaje
    });
    respuesta = `✅ Contacto actualizado: *${mensaje}*\n\n`;
    // Mostrar datos actualizados
    respuesta += `📋 *DATOS ACTUALIZADOS*\n`;
    respuesta += `━━━━━━━━━━━━━━━━━\n\n`;
    respuesta += `🏢 *Empresa:* ${userState.data.empresa}\n`;
    respuesta += `👤 *Contacto:* ${userState.data.contacto}\n`;
    respuesta += `📱 *Teléfono:* ${userState.data.telefono}\n`;
    respuesta += `📍 *Dirección:* ${userState.data.direccion}\n\n`;
    respuesta += `¿Continuar con estos datos?\n\n`;
    respuesta += `✅ *SI* - Proceder al pago\n`;
    respuesta += `✏️ *MODIFICAR* - Cambiar otro dato`;
    userState.step = 'confirmar_datos_cliente';
    break;

case 'modificar_telefono':
    userState.data.telefono = mensaje;
    datosClientes.set(from, {
        ...datosClientes.get(from),
        telefono: mensaje
    });
    respuesta = `✅ Teléfono actualizado: *${mensaje}*\n\n`;
    // Mostrar datos actualizados
    respuesta += `📋 *DATOS ACTUALIZADOS*\n`;
    respuesta += `━━━━━━━━━━━━━━━━━\n\n`;
    respuesta += `🏢 *Empresa:* ${userState.data.empresa}\n`;
    respuesta += `👤 *Contacto:* ${userState.data.contacto}\n`;
    respuesta += `📱 *Teléfono:* ${userState.data.telefono}\n`;
    respuesta += `📍 *Dirección:* ${userState.data.direccion}\n\n`;
    respuesta += `¿Continuar con estos datos?\n\n`;
    respuesta += `✅ *SI* - Proceder al pago\n`;
    respuesta += `✏️ *MODIFICAR* - Cambiar otro dato`;
    userState.step = 'confirmar_datos_cliente';
    break;

case 'modificar_direccion':
    userState.data.direccion = mensaje;
    datosClientes.set(from, {
        ...datosClientes.get(from),
        direccion: mensaje
    });
    respuesta = `✅ Dirección actualizada: *${mensaje}*\n\n`;
    // Mostrar datos actualizados
    respuesta += `📋 *DATOS ACTUALIZADOS*\n`;
    respuesta += `━━━━━━━━━━━━━━━━━\n\n`;
    respuesta += `🏢 *Empresa:* ${userState.data.empresa}\n`;
    respuesta += `👤 *Contacto:* ${userState.data.contacto}\n`;
    respuesta += `📱 *Teléfono:* ${userState.data.telefono}\n`;
    respuesta += `📍 *Dirección:* ${userState.data.direccion}\n\n`;
    respuesta += `¿Continuar con estos datos?\n\n`;
    respuesta += `✅ *SI* - Proceder al pago\n`;
    respuesta += `✏️ *MODIFICAR* - Cambiar otro dato`;
    userState.step = 'confirmar_datos_cliente';
    break;
