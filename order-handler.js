/**
 * Order Handler Module (CORREGIDO)
 * Handles the order flow and business logic
 * Mantiene el flujo exacto del bot-final.js original
 */

const stateManager = require('./state-manager');
const messageService = require('./message-service');
const productCatalog = require('./product-catalog');
const config = require('./config');
const { ORDER_STATES } = require('./order-states');

class OrderHandler {
    constructor() {
        this.orderCounter = 1000;
    }
    
    /**
     * Initialize with services
     */
    initialize(services) {
        this.sheetsService = services.sheets;
        this.driveService = services.drive;
        this.notificationService = services.notifications;
    }
    
    /**
     * Handle incoming message - FLUJO EXACTO DEL ORIGINAL
     */
    async handleMessage(from, body, mediaUrl = null) {
        const mensaje = body.trim();
        let userState = stateManager.getUserState(from);
        
        // Obtener el objeto completo del estado (step + data)
        let fullState = stateManager.getTempOrder(from) || { step: 'inicio', data: {} };
        if (typeof userState === 'string') {
            fullState.step = userState;
        }
        
        // Add to history
        stateManager.addToHistory(from, body, 'user');
        
        console.log(`📨 Estado: ${fullState.step}, Mensaje: ${body}`);
        
        // Comando global: MENÚ
        if (mensaje.toLowerCase() === 'menu' || mensaje.toLowerCase() === 'menú') {
            const todosLosPedidos = stateManager.getUserOrders(from);
            const pedidosActivos = todosLosPedidos.filter(p => {
                const estado = p.estado || p.status || '';
                return estado !== 'Completado' && 
                       estado !== 'Entregado' && 
                       estado !== 'Cancelado';
            });
            const tieneHistorial = todosLosPedidos.length > 0;
            
            // Construir menú con pedidos activos
            const respuesta = this.obtenerMenu(fullState, pedidosActivos, tieneHistorial);
            
            fullState.step = 'menu_principal';
            stateManager.setUserState(from, 'menu_principal');
            stateManager.setTempOrder(from, fullState);
            return await messageService.sendMessage(from, respuesta);
        }

        // Comando global: CANCELAR
        if (mensaje.toLowerCase() === 'cancelar') {
            let mensajeCancelacion = '';
            if (fullState.data && fullState.data.producto) {
                mensajeCancelacion = `❌ Pedido de *${fullState.data.producto.nombre}* cancelado\n\n`;
            }
            fullState = { step: 'menu_principal', data: {} };
            
            // Obtener pedidos activos
            const todosLosPedidos = stateManager.getUserOrders(from);
            const pedidosActivos = todosLosPedidos.filter(p => {
                const estado = p.estado || p.status || '';
                return estado !== 'Completado' && 
                       estado !== 'Entregado' && 
                       estado !== 'Cancelado';
            });
            const tieneHistorial = todosLosPedidos.length > 0;
            
            const respuesta = `${mensajeCancelacion}${this.obtenerMenu(fullState, pedidosActivos, tieneHistorial)}`;
            stateManager.setUserState(from, 'menu_principal');
            stateManager.setTempOrder(from, fullState);
            return await messageService.sendMessage(from, respuesta);
        }

        // Flujo principal
        let respuesta = '';
        
        switch (fullState.step) {
            case 'inicio':
                // Acceso directo con números
                if (['1', '2', '3', '4'].includes(mensaje)) {
                    fullState.step = 'menu_principal';
                    stateManager.setUserState(from, 'menu_principal');
                    stateManager.setTempOrder(from, fullState);
                    return this.handleMessage(from, mensaje);
                }
                
                // Acceso con saludos
                if (mensaje.toLowerCase().includes('hola') || 
                    mensaje.toLowerCase().includes('buenas') ||
                    mensaje.toLowerCase().includes('buenos')) {
                    
                    // IMPORTANTE: Obtener pedidos activos y mostrarlos en el menú
                    const todosLosPedidos = stateManager.getUserOrders(from);
                    const pedidosActivos = todosLosPedidos.filter(p => {
                        const estado = p.estado || p.status || '';
                        return estado !== 'Completado' && 
                               estado !== 'Entregado' && 
                               estado !== 'Cancelado';
                    });
                    const tieneHistorial = todosLosPedidos.length > 0;
                    
                    // Obtener cliente si existe
                    const customer = stateManager.getCustomerData(from);
                    
                    // Construir saludo personalizado
                    let saludoInicial = '';
                    const greeting = this.getGreeting();
                    
                    if (customer && customer.contacto) {
                        saludoInicial = `${greeting} ${customer.contacto}!\n\nBienvenido de vuelta a *${config.business.name}*\n\n`;
                    } else {
                        saludoInicial = `${greeting}!\n\nBienvenido a *${config.business.name}*\n\n`;
                    }
                    
                    // Combinar saludo con menú (que ya incluye los pedidos activos)
                    respuesta = saludoInicial + this.obtenerMenu(fullState, pedidosActivos, tieneHistorial);
                    
                    fullState.step = 'menu_principal';
                    stateManager.setUserState(from, 'menu_principal');
                    stateManager.setTempOrder(from, fullState);
                } else {
                    // MENSAJE COMPLETO EN UNA SOLA RESPUESTA
                    respuesta = `Hola

Soy el asistente virtual de *${config.business.name}*

Escribe *hola* para ver el menú
O envía directamente:
*1* para ver catálogo
*2* para consultar pedido
*3* para información`;
                }
                break;
                
            case 'menu_principal':
                const todosLosPedidosMenu = stateManager.getUserOrders(from);
                const pedidosActivosMenu = todosLosPedidosMenu.filter(p => {
                    const estado = p.estado || p.status || '';
                    return estado !== 'Completado' && 
                           estado !== 'Entregado' && 
                           estado !== 'Cancelado';
                });
                const tieneHistorialMenu = todosLosPedidosMenu.length > 0;
                
                switch (mensaje) {
                    case '1':
                        respuesta = this.mostrarCatalogo(fullState);
                        fullState.step = 'seleccion_producto';
                        break;
                        
                    case '2':
                        respuesta = `🔍 *CONSULTAR PEDIDO*

Por favor, ingresa tu código de pedido
_Ejemplo: CAF-123456_

Escribe *menu* para volver`;
                        fullState.step = 'consulta_pedido';
                        break;
                        
                    case '3':
                        respuesta = `ℹ️ *INFORMACIÓN*

*${config.business.name}*
_Importadores de café peruano premium_

📱 WhatsApp: ${config.business.phone}
📧 Email: ${config.business.email}
🕒 Horario: ${config.business.horario}
📍 Lima, Perú

*Servicios:*
• Venta al por mayor (mín. 5kg)
• Entregas a todo Lima
• Productos certificados

*Método de pago:*
💳 Transferencia bancaria

Escribe *menu* para volver`;
                        fullState.step = 'info_mostrada';
                        break;
                        
                    case '4':
                        if (tieneHistorialMenu) {
                            respuesta = this.mostrarHistorialPedidos(from);
                            fullState.step = 'seleccionar_reorden';
                        } else {
                            respuesta = `Por favor, envía un número válido:

*1* - Ver catálogo
*2* - Consultar pedido
*3* - Información`;
                        }
                        break;
                        
                    default:
                        respuesta = `Por favor, envía un número válido:

*1* - Ver catálogo
*2* - Consultar pedido
*3* - Información${tieneHistorialMenu ? '\n*4* - Volver a pedir' : ''}`;
                }
                break;
                
            case 'seleccion_producto':
                const producto = productCatalog.getProduct(mensaje);
                if (producto) {
                    let mensajeCambio = '';
                    if (fullState.data && fullState.data.producto && fullState.data.producto.id !== producto.id) {
                        mensajeCambio = `_Cambiando de ${fullState.data.producto.nombre} a ${producto.nombre}_\n\n`;
                    }
                    
                    fullState.data.producto = producto;
                    delete fullState.data.cantidad;
                    delete fullState.data.total;
                    
                    respuesta = `${mensajeCambio}✅ Has seleccionado:
*${producto.nombre}*

📍 Origen: ${producto.origen}
🎯 Notas: ${producto.descripcion}
💰 Precio: ${this.formatearPrecio(producto.precio)}/kg

*¿Cuántos kilos necesitas?*
_Pedido mínimo: 5kg_`;
                    fullState.step = 'cantidad_producto';
                } else if (mensaje.toLowerCase() === 'menu' || mensaje.toLowerCase() === 'menú') {
                    return this.handleMessage(from, 'menu');
                } else {
                    respuesta = `❌ Por favor, selecciona un producto válido (1-5)

O escribe *menu* para volver al menú`;
                }
                break;
                
            case 'cantidad_producto':
                const cantidad = parseFloat(mensaje);
                
                if (!isNaN(cantidad) && cantidad >= config.business.deliveryMin) {
                    fullState.data.cantidad = cantidad;
                    const total = cantidad * fullState.data.producto.precio;
                    fullState.data.total = total;

                    respuesta = `📊 *RESUMEN DEL PEDIDO*

📦 *${fullState.data.producto.nombre}*
⚖️ Cantidad: *${cantidad} kg*
💵 Precio unitario: ${this.formatearPrecio(fullState.data.producto.precio)}/kg

━━━━━━━━━━━━━━━━━
💰 *TOTAL: ${this.formatearPrecio(total)}*
━━━━━━━━━━━━━━━━━

*¿Confirmar pedido?*
Envía *SI* para continuar
Envía *NO* para cancelar
Envía *MENU* para volver`;
                    fullState.step = 'confirmar_pedido';
                } else if (!isNaN(cantidad) && cantidad < config.business.deliveryMin) {
                    respuesta = `❌ El pedido mínimo es de *5kg*

Has ingresado: ${cantidad}kg

Por favor, ingresa una cantidad de 5kg o más:`;
                } else {
                    respuesta = `❌ Por favor, ingresa una cantidad válida en números.

_Ejemplo: 10_

Mínimo: 5kg`;
                }
                break;
                
            case 'confirmar_pedido':
                if (mensaje.toLowerCase() === 'si' || mensaje.toLowerCase() === 'sí') {
                    // Verificar si ya tenemos datos del cliente
                    const datosGuardados = stateManager.getCustomerData(from);
                    
                    if (datosGuardados) {
                        // Ya tenemos los datos, usar los guardados
                        fullState.data = {
                            ...fullState.data,
                            ...datosGuardados
                        };
                        
                        // Ir directo al pago
                        respuesta = `✅ *PEDIDO CONFIRMADO*

Usando tus datos registrados:
🏢 ${datosGuardados.empresa}
📍 ${datosGuardados.direccion}

━━━━━━━━━━━━━━━━━

*MÉTODO DE PAGO*
💳 Realiza la transferencia a:

*Cuenta BCP Soles:*
*${config.business.banking.bcpCuenta}*

*Cuenta Interbancaria (CCI):*
*${config.business.banking.cciCuenta}*

*Titular:* ${config.business.name}

━━━━━━━━━━━━━━━━━

💰 *Monto a transferir: ${this.formatearPrecio(fullState.data.total)}*

📸 *Una vez realizada la transferencia, envía la foto del voucher o comprobante*

_El pedido será confirmado tras verificar el pago_`;
                        
                        fullState.step = 'esperando_comprobante';
                    } else {
                        // Primera vez, pedir datos - NO PEDIR EMAIL
                        respuesta = `👤 *DATOS DEL CLIENTE*

Por favor, ingresa el *nombre de tu empresa o negocio*:`;
                        fullState.step = 'datos_empresa';
                    }
                } else if (mensaje.toLowerCase() === 'no') {
                    fullState.data = {};
                    respuesta = `❌ Pedido cancelado.

📱 *MENÚ PRINCIPAL*

*1* - Ver catálogo
*2* - Consultar pedido
*3* - Información

Envía el número de tu elección`;
                    fullState.step = 'menu_principal';
                } else if (mensaje.toLowerCase() === 'menu' || mensaje.toLowerCase() === 'menú') {
                    return this.handleMessage(from, 'menu');
                } else {
                    respuesta = `Por favor, responde:

*SI* - Confirmar pedido
*NO* - Cancelar
*MENU* - Volver al menú`;
                }
                break;
                
            case 'datos_empresa':
                fullState.data.empresa = mensaje;
                respuesta = `✅ Empresa: *${mensaje}*

Ahora ingresa el *nombre del contacto*:`;
                fullState.step = 'datos_contacto';
                break;
                
            case 'datos_contacto':
                fullState.data.contacto = mensaje;
                respuesta = `✅ Contacto: *${mensaje}*

Ingresa tu *número de teléfono*:`;
                fullState.step = 'datos_telefono';
                break;
                
            case 'datos_telefono':
                fullState.data.telefono = mensaje;
                respuesta = `✅ Teléfono: *${mensaje}*

Ingresa la *dirección de entrega completa*:
_Incluye distrito y referencia_`;
                fullState.step = 'datos_direccion';
                break;
                
            case 'datos_direccion':
                fullState.data.direccion = mensaje;
                
                // Generar ID del pedido
                const pedidoTempId = 'CAF-' + Date.now().toString().slice(-6);
                fullState.data.pedidoTempId = pedidoTempId;
                
                // Guardar datos del cliente para futuros pedidos - SIN EMAIL
                stateManager.setCustomerData(from, {
                    empresa: fullState.data.empresa,
                    contacto: fullState.data.contacto,
                    telefono: fullState.data.telefono,
                    direccion: fullState.data.direccion
                });
                
                respuesta = `✅ Dirección guardada: *${mensaje}*

━━━━━━━━━━━━━━━━━

*MÉTODO DE PAGO*
💳 Realiza la transferencia a:

*Cuenta BCP Soles:*
*${config.business.banking.bcpCuenta}*

*Cuenta Interbancaria (CCI):*
*${config.business.banking.cciCuenta}*

*Titular:* ${config.business.name}

━━━━━━━━━━━━━━━━━

💰 *Monto a transferir: ${this.formatearPrecio(fullState.data.total)}*

📸 *ENVÍO DE COMPROBANTE:*
${this.driveService ? 
`✅ *Envía la foto del comprobante por WhatsApp*
_La imagen se guardará automáticamente_` : 
`*Opción 1 - Formulario Web 🌐:*
${config.business.forms.comprobantes}
_Sube tu imagen desde el teléfono_`}

*Opción alternativa:*
_Escribe *"listo"* o *"enviado"* para confirmar_

💡 *Tu código de pedido es: ${pedidoTempId}*`;
                
                fullState.step = 'esperando_comprobante';
                break;
                
            case 'seleccionar_reorden':
                const historialReorden = stateManager.getUserOrders(from).slice(0, 5);
                const indice = parseInt(mensaje) - 1;
                
                if (indice >= 0 && indice < historialReorden.length) {
                    const pedidoAnterior = historialReorden[indice];
                    
                    // Copiar datos del pedido anterior
                    fullState.data = {
                        producto: pedidoAnterior.producto,
                        cantidad: pedidoAnterior.cantidad,
                        total: pedidoAnterior.total,
                        empresa: pedidoAnterior.empresa,
                        contacto: pedidoAnterior.contacto,
                        telefono: pedidoAnterior.telefono,
                        direccion: pedidoAnterior.direccion,
                        esReorden: true
                    };
                    
                    // Guardar datos del cliente para futuros pedidos
                    stateManager.setCustomerData(from, {
                        empresa: pedidoAnterior.empresa,
                        contacto: pedidoAnterior.contacto,
                        telefono: pedidoAnterior.telefono,
                        direccion: pedidoAnterior.direccion
                    });
                    
                    respuesta = `🔄 *REPETIR PEDIDO*

📦 *${pedidoAnterior.producto.nombre}*
⚖️ Cantidad: *${pedidoAnterior.cantidad} kg*
💰 Total: *${this.formatearPrecio(pedidoAnterior.total)}*

*DATOS DE ENTREGA:*
🏢 ${pedidoAnterior.empresa}
📍 ${pedidoAnterior.direccion}

━━━━━━━━━━━━━━━━━

*MÉTODO DE PAGO*
💳 Realiza la transferencia a:

*Cuenta BCP Soles:*
*${config.business.banking.bcpCuenta}*

*Cuenta Interbancaria (CCI):*
*${config.business.banking.cciCuenta}*

━━━━━━━━━━━━━━━━━

💰 *Monto a transferir: ${this.formatearPrecio(pedidoAnterior.total)}*

📸 *Envía la foto del voucher o comprobante*

_El pedido será confirmado tras verificar el pago_`;
                    
                    fullState.step = 'esperando_comprobante';
                } else {
                    respuesta = `❌ Por favor, selecciona un número válido de la lista.

_Escribe *menu* para volver_`;
                }
                break;
                
            case 'esperando_comprobante':
                // Si hay una imagen
                if (mediaUrl) {
                    respuesta = await this.procesarComprobante(from, fullState, mediaUrl);
                    fullState = { step: 'pedido_completado', data: {} };
                } 
                // Si es confirmación por texto
                else if (mensaje.toLowerCase().includes('listo') ||
                         mensaje.toLowerCase().includes('enviado') ||
                         mensaje.toLowerCase() === 'ok' ||
                         mensaje === '✅') {
                    respuesta = await this.procesarComprobante(from, fullState, null);
                    fullState = { step: 'pedido_completado', data: {} };
                }
                // Si cancela
                else if (mensaje.toLowerCase() === 'cancelar') {
                    fullState.data = {};
                    respuesta = `❌ Proceso de pago cancelado.

📱 *MENÚ PRINCIPAL*

*1* - Ver catálogo
*2* - Consultar pedido
*3* - Información

Envía el número de tu elección`;
                    fullState.step = 'menu_principal';
                } 
                // Recordatorio
                else {
                    respuesta = `📸 *Por favor, envía la foto del comprobante de transferencia*

⚠️ Si no puedes enviar la imagen ahora, escribe *"listo"* o *"enviado"* después de realizar la transferencia.

_O escribe *cancelar* para cancelar el proceso_`;
                }
                break;
                
            default:
                // Estado desconocido, reiniciar
                fullState = { step: 'inicio', data: {} };
                respuesta = `Hola

Soy el asistente virtual de *${config.business.name}*

Escribe *hola* para ver el menú
O envía directamente:
*1* para ver catálogo
*2* para consultar pedido
*3* para información`;
        }
        
        // Guardar estado actualizado
        stateManager.setUserState(from, fullState.step);
        stateManager.setTempOrder(from, fullState);
        
        // Enviar respuesta
        await messageService.sendMessage(from, respuesta);
    }
    
    /**
     * Obtener menú con pedidos activos
     */
    obtenerMenu(userState, pedidosActivos, tieneHistorial) {
        let headerPedidos = '';
        
        // Mostrar pedidos activos si existen
        if (pedidosActivos && pedidosActivos.length > 0) {
            headerPedidos = `*TUS PEDIDOS ACTIVOS:*
`;
            headerPedidos += `━━━━━━━━━━━━━━━━━
`;
            
            pedidosActivos.forEach(p => {
                // Calcular tiempo transcurrido de forma segura
                let tiempoTexto = 'Hoy';
                
                try {
                    const fechaPedido = p.timestamp || p.fecha;
                    if (fechaPedido) {
                        const fecha = new Date(fechaPedido);
                        const ahora = new Date();
                        
                        if (!isNaN(fecha.getTime())) {
                            const tiempoMs = ahora - fecha;
                            const minutos = Math.floor(tiempoMs / (1000 * 60));
                            
                            if (minutos < 0) {
                                tiempoTexto = 'Reciente';
                            } else if (minutos < 60) {
                                tiempoTexto = `${minutos} min`;
                            } else if (minutos < 1440) {
                                const horas = Math.floor(minutos / 60);
                                tiempoTexto = `${horas} ${horas === 1 ? 'hora' : 'horas'}`;
                            } else {
                                const dias = Math.floor(minutos / 1440);
                                tiempoTexto = `${dias} ${dias === 1 ? 'día' : 'días'}`;
                            }
                        }
                    }
                } catch (e) {
                    tiempoTexto = 'Hoy';
                }
                
                // Obtener el nombre del producto correctamente
                let nombreProducto = 'Producto';
                if (typeof p.producto === 'string') {
                    nombreProducto = p.producto;
                } else if (p.producto && p.producto.nombre) {
                    nombreProducto = p.producto.nombre;
                }
                
                // Formatear el pedido
                headerPedidos += `\n*${p.id}*\n`;
                headerPedidos += `${nombreProducto}\n`;
                headerPedidos += `${p.cantidad}kg - S/${(p.total || 0).toFixed(2)}\n`;
                headerPedidos += `Estado: *${p.estado}*\n`;
                headerPedidos += `Hace ${tiempoTexto}\n`;
            });
            
            headerPedidos += `\n_Usa el código para consultar detalles_\n`;
            headerPedidos += `━━━━━━━━━━━━━━━━━\n\n`;
        }
        
        // Si hay un pedido en proceso (aún no confirmado), mostrarlo
        if (userState.data && userState.data.producto) {
            const cantidadStr = userState.data.cantidad ? `${userState.data.cantidad}kg` : 'cantidad por definir';
            const totalStr = userState.data.total ? `S/${userState.data.total.toFixed(2)}` : 'por calcular';
            
            headerPedidos += `*PEDIDO ACTUAL (sin confirmar)*\n`;
            headerPedidos += `━━━━━━━━━━━━━━━━━\n`;
            headerPedidos += `${userState.data.producto.nombre}\n`;
            headerPedidos += `Cantidad: ${cantidadStr}\n`;
            headerPedidos += `Total: ${totalStr}\n`;
            headerPedidos += `━━━━━━━━━━━━━━━━━\n\n`;
            headerPedidos += `_Escribe *cancelar* para eliminar_\n\n`;
        }
        
        // Agregar opción de reordenar si tiene historial
        const opcionReordenar = tieneHistorial ? 
            `*4* - Volver a pedir\n` : '';
        
        return `${headerPedidos}*MENÚ PRINCIPAL*

*1* - Ver catálogo y pedir
*2* - Consultar pedido
*3* - Información del negocio
${opcionReordenar}
Envía el número de tu elección`;
    }
    
    /**
     * Mostrar catálogo
     */
    mostrarCatalogo(userState) {
        let headerCatalogo = '';
        if (userState.data && userState.data.producto) {
            headerCatalogo = `🔄 *Tienes un pedido en proceso*
${userState.data.producto.nombre} - ${userState.data.cantidad || '?'}kg

_Selecciona un nuevo producto para reemplazarlo_
━━━━━━━━━━━━━━━━━

`;
        }
        
        // Usar el catálogo dinámico de productCatalog
        const catalogoFormateado = productCatalog.formatProductList();
        
        return `${headerCatalogo}${catalogoFormateado}`;
    }
    
    /**
     * Mostrar historial de pedidos
     */
    mostrarHistorialPedidos(from) {
        const historial = stateManager.getUserOrders(from).slice(0, 5);
        let respuesta = `🔄 *TUS PEDIDOS ANTERIORES*
━━━━━━━━━━━━━━━━━

`;
        historial.forEach((p, index) => {
            const fecha = new Date(p.timestamp || p.fecha).toLocaleDateString('es-PE');
            respuesta += `*${index + 1}.* ${p.producto?.nombre || 'Producto'}
   📦 ${p.cantidad}kg - ${this.formatearPrecio(p.total)}
   📅 ${fecha}
   ${p.status === 'Confirmado' ? '✅' : '⏳'} ${p.status || p.estado}

`;
        });
        
        respuesta += `*Envía el número del pedido que deseas repetir*

_O escribe *menu* para volver_`;
        
        return respuesta;
    }
    
    /**
     * Procesar comprobante
     */
    async procesarComprobante(from, userState, mediaUrl) {
        console.log(`\n🎯 PROCESANDO COMPROBANTE`);
        console.log(`   from (userId): ${from}`);
        console.log(`   mediaUrl: ${mediaUrl ? 'Sí' : 'No'}`);
        
        const pedidoId = userState.data.pedidoTempId || 'CAF-' + Date.now().toString().slice(-6);
        
        const pedidoCompleto = {
            id: pedidoId,
            fecha: new Date(),
            timestamp: new Date(),
            producto: userState.data.producto,
            cantidad: userState.data.cantidad,
            total: userState.data.total,
            empresa: userState.data.empresa,
            contacto: userState.data.contacto,
            telefono: userState.data.telefono || from,  // Teléfono que ingresó el cliente
            direccion: userState.data.direccion,
            metodoPago: 'Transferencia bancaria',
            status: ORDER_STATES.PENDING_VERIFICATION,
            estado: ORDER_STATES.PENDING_VERIFICATION,
            comprobanteRecibido: true,
            esReorden: userState.data.esReorden || false,
            urlComprobante: mediaUrl || null,
            userId: from  // IMPORTANTE: El from de WhatsApp es el userId
        };
        
        console.log(`   Pedido a guardar:`);
        console.log(`     ID: ${pedidoCompleto.id}`);
        console.log(`     userId: ${pedidoCompleto.userId}`);
        console.log(`     telefono: ${pedidoCompleto.telefono}`);
        console.log(`     empresa: ${pedidoCompleto.empresa}`);
        
        // Guardar pedido
        stateManager.addConfirmedOrder(pedidoId, pedidoCompleto);
        
        // Guardar en Sheets si está disponible
        if (this.sheetsService) {
            try {
                await this.sheetsService.saveOrder(pedidoCompleto);
            } catch (error) {
                console.error('Error guardando en Sheets:', error);
            }
        }
        
        // Guardar imagen en Drive si está disponible
        if (this.driveService && mediaUrl) {
            try {
                const fileName = `comprobante_${pedidoId}_${Date.now()}.jpg`;
                const metadata = {
                    pedidoId: pedidoId,
                    empresa: pedidoCompleto.empresa,
                    contacto: pedidoCompleto.contacto,
                    total: pedidoCompleto.total,
                    fecha: new Date().toISOString()
                };
                const result = await this.driveService.subirImagenDesdeURL(mediaUrl, fileName, metadata);
                console.log('📸 Comprobante guardado:', result);
            } catch (error) {
                console.error('Error guardando en Drive:', error);
            }
        }
        
        // Notificar admin
        if (this.notificationService && this.notificationService.notificarNuevoPedido) {
            try {
                await this.notificationService.notificarNuevoPedido(pedidoCompleto);
                // Si hay comprobante, notificar también para validación
                if (mediaUrl && this.notificationService.notificarComprobanteParaValidacion) {
                    await this.notificationService.notificarComprobanteParaValidacion(pedidoCompleto, mediaUrl, from);
                }
            } catch (error) {
                console.error('Error notificando admin:', error);
            }
        }
        
        return `📸 *¡COMPROBANTE RECIBIDO!*
━━━━━━━━━━━━━━━━━

✅ Tu pedido ha sido registrado exitosamente

📋 *Código de pedido:* ${pedidoId}
📅 *Fecha:* ${new Date().toLocaleDateString('es-PE')}

*RESUMEN DEL PEDIDO:*
📦 ${userState.data.producto.nombre}
⚖️ ${userState.data.cantidad}kg
💰 Total: ${this.formatearPrecio(userState.data.total)}

*DATOS DE ENTREGA:*
🏢 ${userState.data.empresa}
👤 ${userState.data.contacto}
📱 ${userState.data.telefono}
📍 ${userState.data.direccion}

━━━━━━━━━━━━━━━━━

⏳ *ESTADO:* ${ORDER_STATES.PENDING_VERIFICATION}

🔍 *Próximos pasos:*
1️⃣ Verificaremos tu pago (máx. 30 min)
2️⃣ Te confirmaremos por este medio
3️⃣ Coordinaremos la entrega (24-48h)

💡 *Guarda tu código: ${pedidoId}*

Puedes consultar el estado con tu código en cualquier momento.

¡Gracias por tu compra! ☕

_Escribe *menu* para realizar otro pedido_`;
    }
    
    /**
     * Obtener menú simple (solo opciones, sin pedidos)
     */
    obtenerMenuSimple(tieneHistorial) {
        const opcionReordenar = tieneHistorial ? 
            `*4* - Volver a pedir\n` : '';
        
        return `*MENÚ PRINCIPAL*

*1* - Ver catálogo y pedir
*2* - Consultar pedido
*3* - Información del negocio
${opcionReordenar}
Envía el número de tu elección`;
    }
    
    /**
     * Obtener saludo según la hora
     */
    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    }
    
    /**
     * Actualizar estado de pedido
     */
    async actualizarEstadoPedido(pedidoId, nuevoEstado, from = null) {
        const pedido = stateManager.getConfirmedOrder(pedidoId);
        
        if (!pedido) {
            console.error(`❌ No se encontró el pedido ${pedidoId}`);
            return false;
        }
        
        // Actualizar estado
        const estadoAnterior = pedido.status || pedido.estado;
        stateManager.updateOrderStatus(pedidoId, nuevoEstado);
        
        console.log(`🔄 Pedido ${pedidoId}: ${estadoAnterior} → ${nuevoEstado}`);
        
        // Si tenemos el número del cliente y el estado es "Pago confirmado", notificar
        if (from || pedido.userId || pedido.telefono) {
            const clientPhone = from || pedido.userId || pedido.telefono;
            
            if (nuevoEstado === ORDER_STATES.PAYMENT_CONFIRMED) {
                const mensaje = `✅ *PAGO CONFIRMADO*\n\n` +
                    `Tu pedido *${pedidoId}* ha sido verificado.\n` +
                    `Estamos preparando tu pedido.\n\n` +
                    `⏰ Entrega estimada: 24-48 horas\n\n` +
                    `¡Gracias por tu compra! ☕`;
                    
                await messageService.sendMessage(clientPhone, mensaje);
            } else if (nuevoEstado === ORDER_STATES.IN_PREPARATION) {
                const mensaje = `🎆 *PEDIDO EN PREPARACIÓN*\n\n` +
                    `Tu pedido *${pedidoId}* está siendo preparado.\n\n` +
                    `Te avisaremos cuando esté listo.`;
                    
                await messageService.sendMessage(clientPhone, mensaje);
            } else if (nuevoEstado === ORDER_STATES.ON_THE_WAY) {
                const mensaje = `🚚 *PEDIDO EN CAMINO*\n\n` +
                    `Tu pedido *${pedidoId}* está en camino.\n\n` +
                    `Pronto llegará a tu dirección.`;
                    
                await messageService.sendMessage(clientPhone, mensaje);
            } else if (nuevoEstado === ORDER_STATES.DELIVERED) {
                const mensaje = `✅ *PEDIDO ENTREGADO*\n\n` +
                    `Tu pedido *${pedidoId}* ha sido entregado.\n\n` +
                    `¡Gracias por tu compra! ☕\n` +
                    `Esperamos verte pronto.`;
                    
                await messageService.sendMessage(clientPhone, mensaje);
            }
        }
        
        // Actualizar en Sheets si está disponible
        if (this.sheetsService) {
            try {
                await this.sheetsService.updateOrderStatus(pedidoId, nuevoEstado);
            } catch (error) {
                console.error('Error actualizando estado en Sheets:', error);
            }
        }
        
        return true;
    }
    
    /**
     * Formatear precio
     */
    formatearPrecio(precio) {
        return `S/ ${precio.toFixed(2)}`;
    }
    
    /**
     * Generate unique order ID
     */
    generateOrderId() {
        const prefix = 'CAF';
        const timestamp = Date.now().toString().slice(-6);
        return `${prefix}-${timestamp}`;
    }
}

// Export singleton instance
module.exports = new OrderHandler();
