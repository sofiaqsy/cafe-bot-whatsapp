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
        console.log('OrderHandler inicializado con servicios:');
        console.log(`   Sheets: ${this.sheetsService ? 'Sí' : 'No'}`);
        console.log(`   Drive: ${this.driveService ? 'Sí' : 'No'}`);
        console.log(`   Notifications: ${this.notificationService ? 'Sí' : 'No'}`);
    }
    
    /**
     * Handle incoming message - FLUJO EXACTO DEL ORIGINAL
     */
    async handleMessage(from, body, mediaUrl = null) {
        const mensaje = body.trim();
        let userState = stateManager.getUserState(from);
        
        // Obtener el objeto completo del estado (step + data) - Asegurar que siempre tenga data
        let fullState = stateManager.getTempOrder(from) || { step: 'inicio', data: {} };
        if (typeof userState === 'string') {
            fullState.step = userState;
        }
        // Asegurar que siempre existe fullState.data
        if (!fullState.data) {
            fullState.data = {};
        }
        
        // Add to history
        stateManager.addToHistory(from, body, 'user');
        
        console.log(`Estado: ${fullState.step}, Mensaje: ${body}`);
        
        // VERIFICACIÓN GLOBAL: Cliente con pedidos pendientes de verificación
        const pedidosUsuario = stateManager.getUserOrders(from);
        const pedidosPendientesVerif = pedidosUsuario.filter(p => {
            const estado = p.estado || p.status || '';
            return estado === 'Pendiente verificación' || estado === 'Pendiente verificacion';
        });
        
        // TEMPORALMENTE DESHABILITADO - WhatsApp requiere plantillas para mensajes iniciados por bot
        // Si tiene pedidos pendientes de verificación, mostrar mensaje y salir
        /*
        if (pedidosPendientesVerif.length > 0) {
            const respuestaPendiente = `Hola! Tu solicitud está en proceso.

Estamos verificando los datos de tu cafetería para poder enviarte la muestra de nuestro café premium.

En cuanto confirmemos tu solicitud, te avisaremos por aquí mismo.

*Tiempo estimado:* 2-3 horas

Mientras tanto, puedes preparar tu espacio para recibir nuestra muestra especial de café.`;
            return await messageService.sendMessage(from, respuestaPendiente);
        }
        */
        
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
            const respuesta = this.obtenerMenu(fullState, pedidosActivos, tieneHistorial, from);
            
            fullState.step = 'menu_principal';
            stateManager.setUserState(from, 'menu_principal');
            stateManager.setTempOrder(from, fullState);
            return await messageService.sendMessage(from, respuesta);
        }

        // Comando global: CANCELAR
        if (mensaje.toLowerCase() === 'cancelar') {
            let mensajeCancelacion = '';
            if (fullState.data && fullState.data.producto) {
                mensajeCancelacion = `Pedido de *${fullState.data.producto.nombre}* cancelado\n\n`;
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
            
            const respuesta = `${mensajeCancelacion}${this.obtenerMenu(fullState, pedidosActivos, tieneHistorial, from)}`;
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
                    
                    // Verificar si tiene pedidos en estado Pendiente verificación
                    const todosLosPedidos = stateManager.getUserOrders(from);
                    const pedidosPendientesVerificacion = todosLosPedidos.filter(p => {
                        const estado = p.estado || p.status || '';
                        return estado === 'Pendiente verificación';
                    });
                    
                    // Si tiene pedidos pendientes de verificación, mostrar mensaje especial
                    if (pedidosPendientesVerificacion.length > 0) {
                        respuesta = `Hola! Tu solicitud está en proceso.

Estamos verificando los datos de tu cafetería para poder enviarte la muestra de nuestro café premium.

En cuanto confirmemos tu solicitud, te avisaremos por aquí mismo.

*Tiempo estimado:* 2-3 horas

Mientras tanto, puedes preparar tu espacio para recibir nuestra muestra especial de café.`;
                        break;
                    }
                    
                    // IMPORTANTE: Obtener pedidos activos y mostrarlos en el menú
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
                    respuesta = saludoInicial + this.obtenerMenu(fullState, pedidosActivos, tieneHistorial, from);
                    
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
                const pedidosPendientesPago = stateManager.getPendingPaymentOrders(from);
                
                switch (mensaje) {
                    case '1':
                        // Asegurar que fullState.data existe antes de mostrar el catálogo
                        if (!fullState.data) {
                            fullState.data = {};
                        }
                        respuesta = await this.mostrarCatalogo(fullState);
                        fullState.step = 'seleccion_producto';
                        break;
                        
                    case '2':
                        respuesta = `*CONSULTAR PEDIDO*

Por favor, ingresa tu código de pedido
_Ejemplo: CAF-123456_

Escribe *menu* para volver`;
                        fullState.step = 'consulta_pedido';
                        break;
                        
                    case '3':
                        respuesta = `*INFORMACIÓN*

*${config.business.name}*
_Importadores de café peruano premium_

WhatsApp: ${config.business.phone}
Email: ${config.business.email}
Horario: ${config.business.horario}
Lima, Perú

*Servicios:*
• Venta al por mayor (mín. 5kg)
• Entregas a todo Lima
• Productos certificados

*Método de pago:*
Transferencia bancaria

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
                        
                    case '5':
                        if (pedidosPendientesPago.length > 0) {
                            respuesta = this.mostrarPedidosPendientesPago(from);
                            fullState.step = 'seleccionar_pedido_pendiente';
                        } else {
                            respuesta = `No tienes pedidos pendientes de pago.

${this.obtenerMenu(fullState, pedidosActivosMenu, tieneHistorialMenu, from)}`;
                        }
                        break;
                        
                    case 'pedido_completado':
                // Cualquier mensaje después de completar un pedido vuelve al menú
                const todosLosPedidosCompleto = stateManager.getUserOrders(from);
                const pedidosActivosCompleto = todosLosPedidosCompleto.filter(p => {
                    const estado = p.estado || p.status || '';
                    return estado !== 'Completado' && 
                           estado !== 'Entregado' && 
                           estado !== 'Cancelado';
                });
                const tieneHistorialCompleto = todosLosPedidosCompleto.length > 0;
                
                respuesta = this.obtenerMenu({ step: 'menu_principal', data: {} }, pedidosActivosCompleto, tieneHistorialCompleto, from);
                fullState.step = 'menu_principal';
                break;
                
            case 'info_mostrada':
                // Después de mostrar información, cualquier mensaje vuelve al menú
                const todosLosPedidosInfo = stateManager.getUserOrders(from);
                const pedidosActivosInfo = todosLosPedidosInfo.filter(p => {
                    const estado = p.estado || p.status || '';
                    return estado !== 'Completado' && 
                           estado !== 'Entregado' && 
                           estado !== 'Cancelado';
                });
                const tieneHistorialInfo = todosLosPedidosInfo.length > 0;
                
                respuesta = this.obtenerMenu({ step: 'menu_principal', data: {} }, pedidosActivosInfo, tieneHistorialInfo, from);
                fullState.step = 'menu_principal';
                break;
                
            case 'consulta_pedido':
                // Si escribe 'menu' o no es un código válido, volver al menú
                if (mensaje.toLowerCase() === 'menu' || mensaje.toLowerCase() === 'menú') {
                    return this.handleMessage(from, 'menu');
                }
                
                // Buscar el pedido
                const pedidoBuscado = stateManager.getConfirmedOrder(mensaje.toUpperCase());
                
                if (pedidoBuscado) {
                    respuesta = `📦 *DETALLE DEL PEDIDO*
━━━━━━━━━━━━━━━━━

*Código:* ${pedidoBuscado.id}
*Estado:* ${pedidoBuscado.estado || pedidoBuscado.status}
*Fecha:* ${pedidoBuscado.fecha || 'Hoy'}

*PRODUCTO:*
${pedidoBuscado.producto?.nombre || 'Producto'}
Cantidad: ${pedidoBuscado.cantidad}kg
Total: ${this.formatearPrecio(pedidoBuscado.total)}

*ENTREGA:*
${pedidoBuscado.empresa}
${pedidoBuscado.direccion}

━━━━━━━━━━━━━━━━━

_Escribe cualquier cosa para volver al menú_`;
                    fullState.step = 'info_mostrada';
                } else {
                    respuesta = `❌ No se encontró el pedido *${mensaje}*

Por favor, verifica el código e intenta nuevamente.

_Escribe *menu* para volver al menú principal_`;
                }
                break;
                        // Incluir opción 5 si hay pedidos pendientes de pago
                        const opciones = pedidosPendientesPago.length > 0 ? 
                            `${tieneHistorialMenu ? '\n*4* - Volver a pedir' : ''}\n*5* - 💳 Enviar comprobante pendiente` : 
                            `${tieneHistorialMenu ? '\n*4* - Volver a pedir' : ''}`;
                        
                        respuesta = `Por favor, envía un número válido:

*1* - Ver catálogo
*2* - Consultar pedido
*3* - Información${opciones}`;
                }
                break;
                
            case 'seleccion_producto':
                // Inicializar contador de intentos si no existe
                if (!fullState.data.intentosProducto) {
                    fullState.data.intentosProducto = 0;
                }
                
                const producto = productCatalog.getProduct(mensaje);
                if (producto) {
                    // Asegurar que fullState.data existe
                    if (!fullState.data) {
                        fullState.data = {};
                    }
                    
                    // Resetear contador de intentos
                    fullState.data.intentosProducto = 0;
                    
                    let mensajeCambio = '';
                    if (fullState.data.producto && fullState.data.producto.id !== producto.id) {
                        mensajeCambio = `_Cambiando de ${fullState.data.producto.nombre} a ${producto.nombre}_\n\n`;
                    }
                    
                    fullState.data.producto = producto;
                    delete fullState.data.cantidad;
                    delete fullState.data.total;
                    
                    respuesta = `${mensajeCambio}✅ Has seleccionado:
*${producto.nombre}*

Origen: ${producto.origen}
Notas: ${producto.descripcion}
Precio: ${this.formatearPrecio(producto.precio)}/kg

*¿Cuántos kilos necesitas?*
_Pedido mínimo: 5kg_`;
                    fullState.step = 'cantidad_producto';
                } else if (mensaje.toLowerCase() === 'menu' || mensaje.toLowerCase() === 'menú') {
                    return this.handleMessage(from, 'menu');
                } else {
                    // Manejar intentos inválidos
                    fullState.data.intentosProducto++;
                    
                    if (fullState.data.intentosProducto >= 3) {
                        // Después de 3 intentos, volver al menú
                        respuesta = `⚠️ *SELECCIÓN CANCELADA*\n\nNo se recibió una selección válida después de 3 intentos.\n\nVolviendo al menú principal...\n\n${this.obtenerMenu(fullState, [], false, from)}`;
                        fullState.step = 'menu_principal';
                        fullState.data = {};
                    } else {
                        const intentosRestantes = 3 - fullState.data.intentosProducto;
                        respuesta = `❌ *OPCIÓN NO VÁLIDA*\n\n⚠️ *Intento ${fullState.data.intentosProducto} de 3*\nTe quedan ${intentosRestantes} intento${intentosRestantes > 1 ? 's' : ''}.\n\nPor favor, selecciona un producto válido (1-5)\n\nO escribe *menu* para volver al menú`;
                    }
                }
                break;
                
            case 'cantidad_producto':
                const cantidad = parseFloat(mensaje);
                
                if (!isNaN(cantidad) && cantidad >= config.business.deliveryMin) {
                    // Verificar si hay stock suficiente
                    if (fullState.data.producto.stock && cantidad > fullState.data.producto.stock) {
                        respuesta = `Stock insuficiente.

*Stock disponible:* ${fullState.data.producto.stock}kg
*Cantidad solicitada:* ${cantidad}kg

Por favor, ingresa una cantidad menor o igual a ${fullState.data.producto.stock}kg:`;
                    } else {
                        fullState.data.cantidad = cantidad;
                        const total = cantidad * fullState.data.producto.precio;
                        fullState.data.total = total;

                        respuesta = `*RESUMEN DEL PEDIDO*

*${fullState.data.producto.nombre}*
Cantidad: *${cantidad} kg*
Precio unitario: ${this.formatearPrecio(fullState.data.producto.precio)}/kg

━━━━━━━━━━━━━━━━━
*TOTAL: ${this.formatearPrecio(total)}*
━━━━━━━━━━━━━━━━━

*¿Confirmar pedido?*
Envía *SI* para continuar
Envía *NO* para cancelar
Envía *MENU* para volver`;
                        fullState.step = 'confirmar_pedido';
                    }
                } else if (!isNaN(cantidad) && cantidad < config.business.deliveryMin) {
                    respuesta = `El pedido mínimo es de *5kg*

Has ingresado: ${cantidad}kg

Por favor, ingresa una cantidad de 5kg o más:`;
                } else {
                    respuesta = `Por favor, ingresa una cantidad válida en números.

_Ejemplo: 10_

Mínimo: 5kg`;
                }
                break;
                
            case 'confirmar_pedido':
                if (mensaje.toLowerCase() === 'si' || mensaje.toLowerCase() === 'sí') {
                    // Primero verificar si existe en Google Sheets
                    let clienteExistente = null;
                    if (this.sheetsService) {
                        try {
                            clienteExistente = await this.sheetsService.buscarCliente(from);
                            if (clienteExistente) {
                                console.log(`✅ Cliente existente encontrado en Sheets: ${clienteExistente.empresa}`);
                            }
                        } catch (error) {
                            console.error('Error buscando cliente en Sheets:', error);
                        }
                    }
                    
                    // Si existe en Sheets, usar esos datos
                    if (clienteExistente) {
                        fullState.data = {
                            ...fullState.data,
                            empresa: clienteExistente.empresa,
                            contacto: clienteExistente.contacto,
                            telefono: clienteExistente.telefonoContacto,
                            direccion: clienteExistente.direccion
                        };
                        
                        // Preguntar si quiere confirmar o cambiar los datos
                        respuesta = `*CLIENTE REGISTRADO*

Hemos encontrado tus datos:

Empresa: *${clienteExistente.empresa}*
Contacto: *${clienteExistente.contacto}*
Teléfono: *${clienteExistente.telefonoContacto}*
Dirección: *${clienteExistente.direccion}*

*¿Los datos son correctos?*

Envía *SI* para confirmar
Envía *NO* para actualizar los datos`;
                        fullState.step = 'confirmar_datos_cliente';
                    } else {
                        // No existe, verificar si hay datos guardados localmente
                        const datosGuardados = stateManager.getCustomerData(from);
                        
                        if (datosGuardados) {
                            // Usar datos guardados localmente
                            fullState.data = {
                                ...fullState.data,
                                ...datosGuardados
                            };
                            
                            respuesta = `✅ *PEDIDO CONFIRMADO*

Usando tus datos registrados:
${datosGuardados.empresa}
${datosGuardados.direccion}

━━━━━━━━━━━━━━━━━━

*MÉTODO DE PAGO*
Realiza la transferencia a:

*Cuenta BCP Soles:*
*${config.business.banking.bcpCuenta}*

*Cuenta Interbancaria (CCI):*
*${config.business.banking.cciCuenta}*

*Titular:* ${config.business.name}

━━━━━━━━━━━━━━━━━━

*Monto a transferir: ${this.formatearPrecio(fullState.data.total)}*

*Una vez realizada la transferencia, envía la foto del voucher o comprobante*

_El pedido será confirmado tras verificar el pago_`;
                            
                            fullState.step = 'esperando_comprobante';
                        } else {
                            // Primera vez, pedir datos
                            respuesta = `*DATOS DEL CLIENTE*

Por favor, ingresa el *nombre de tu empresa o negocio*:`;
                            fullState.step = 'datos_empresa';
                        }
                    }
                } else if (mensaje.toLowerCase() === 'no') {
                    fullState.data = {};
                    respuesta = `Pedido cancelado.

*MENÚ PRINCIPAL*

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
                
                respuesta = `Dirección guardada: *${mensaje}*

━━━━━━━━━━━━━━━━━

*MÉTODO DE PAGO*
Realiza la transferencia a:

*Cuenta BCP Soles:*
*${config.business.banking.bcpCuenta}*

*Cuenta Interbancaria (CCI):*
*${config.business.banking.cciCuenta}*

*Titular:* ${config.business.name}

━━━━━━━━━━━━━━━━━

*Monto a transferir: ${this.formatearPrecio(fullState.data.total)}*

*ENVÍO DE COMPROBANTE:*
${this.driveService ? 
`*Envía la foto del comprobante por WhatsApp*
_La imagen se guardará automáticamente_` : 
`*Opción 1 - Formulario Web:*
${config.business.forms.comprobantes}
_Sube tu imagen desde el teléfono_`}

*Opción alternativa:*
_Escribe *"listo"* o *"enviado"* para confirmar_

*Tu código de pedido es: ${pedidoTempId}*`;
                
                fullState.step = 'esperando_comprobante';
                break;
                
            case 'confirmar_datos_cliente':
                if (mensaje.toLowerCase() === 'si' || mensaje.toLowerCase() === 'sí') {
                    // Usar los datos existentes y continuar con el pago
                    respuesta = `✅ *PEDIDO CONFIRMADO*

Datos confirmados:
${fullState.data.empresa}
${fullState.data.direccion}

━━━━━━━━━━━━━━━━━━

*MÉTODO DE PAGO*
Realiza la transferencia a:

*Cuenta BCP Soles:*
*${config.business.banking.bcpCuenta}*

*Cuenta Interbancaria (CCI):*
*${config.business.banking.cciCuenta}*

*Titular:* ${config.business.name}

━━━━━━━━━━━━━━━━━━

*Monto a transferir: ${this.formatearPrecio(fullState.data.total)}*

*Una vez realizada la transferencia, envía la foto del voucher o comprobante*

_El pedido será confirmado tras verificar el pago_`;
                    
                    fullState.step = 'esperando_comprobante';
                } else if (mensaje.toLowerCase() === 'no') {
                    // Pedir nuevos datos
                    respuesta = `*ACTUALIZAR DATOS*

Por favor, ingresa el *nombre de tu empresa o negocio*:`;
                    fullState.step = 'datos_empresa';
                } else {
                    respuesta = `Por favor, responde:

*SI* - Los datos son correctos
*NO* - Quiero actualizar los datos`;
                }
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
                    
                    respuesta = `*REPETIR PEDIDO*

*${pedidoAnterior.producto.nombre}*
Cantidad: *${pedidoAnterior.cantidad} kg*
Total: *${this.formatearPrecio(pedidoAnterior.total)}*

*DATOS DE ENTREGA:*
${pedidoAnterior.empresa}
${pedidoAnterior.direccion}

━━━━━━━━━━━━━━━━━

*MÉTODO DE PAGO*
💳 Realiza la transferencia a:

*Cuenta BCP Soles:*
*${config.business.banking.bcpCuenta}*

*Cuenta Interbancaria (CCI):*
*${config.business.banking.cciCuenta}*

━━━━━━━━━━━━━━━━━

*Monto a transferir: ${this.formatearPrecio(pedidoAnterior.total)}*

*Envía la foto del voucher o comprobante*

_El pedido será confirmado tras verificar el pago_`;
                    
                    fullState.step = 'esperando_comprobante';
                } else {
                    respuesta = `Por favor, selecciona un número válido de la lista.

_Escribe *menu* para volver_`;
                }
                break;
                
            case 'seleccionar_pedido_pendiente':
                const pedidosPendientes = stateManager.getPendingPaymentOrders(from);
                const indicePendiente = parseInt(mensaje) - 1;
                
                if (indicePendiente >= 0 && indicePendiente < pedidosPendientes.length) {
                    const pedidoPendiente = pedidosPendientes[indicePendiente];
                    fullState.data = {
                        pedidoExistente: pedidoPendiente,
                        pedidoId: pedidoPendiente.id
                    };
                    
                    respuesta = `*ENVIAR COMPROBANTE PENDIENTE*

Pedido: *${pedidoPendiente.id}*
${pedidoPendiente.producto?.nombre || 'Producto'}
${pedidoPendiente.cantidad}kg - ${this.formatearPrecio(pedidoPendiente.total)}

━━━━━━━━━━━━━━━━━

*MÉTODO DE PAGO*
Realiza la transferencia a:

*Cuenta BCP Soles:*
*${config.business.banking.bcpCuenta}*

*Cuenta Interbancaria (CCI):*
*${config.business.banking.cciCuenta}*

*Titular:* ${config.business.name}

━━━━━━━━━━━━━━━━━

*Monto a transferir: ${this.formatearPrecio(pedidoPendiente.total)}*

*Envía la foto del comprobante ahora*

_O escribe *cancelar* para volver_`;
                    
                    fullState.step = 'esperando_comprobante_pendiente';
                } else if (mensaje.toLowerCase() === 'menu' || mensaje.toLowerCase() === 'menú') {
                    return this.handleMessage(from, 'menu');
                } else {
                    respuesta = `Por favor, selecciona un número válido de la lista.

_Escribe *menu* para volver_`;
                }
                break;
                
            case 'esperando_comprobante_pendiente':
                if (mediaUrl) {
                    // Actualizar el pedido existente con el comprobante
                    const pedidoId = fullState.data.pedidoId;
                    let driveUrl = null;
                    
                    // Primero subir a Drive si está disponible
                    if (this.driveService) {
                        try {
                            const fileName = `comprobante_${pedidoId}_${Date.now()}.jpg`;
                            const pedido = stateManager.getConfirmedOrder(pedidoId);
                            const metadata = {
                                pedidoId: pedidoId,
                                empresa: pedido.empresa,
                                contacto: pedido.contacto,
                                total: pedido.total,
                                fecha: new Date().toISOString()
                            };
                            const result = await this.driveService.subirImagenDesdeURL(mediaUrl, fileName, metadata);
                            console.log('Comprobante guardado en Drive:', result);
                            
                            if (result.success && result.webViewLink) {
                                driveUrl = result.webViewLink;
                                console.log('✅ URL de Drive obtenida:', driveUrl);
                            }
                        } catch (error) {
                            console.error('Error guardando en Drive:', error);
                        }
                    }
                    
                    // Actualizar el pedido con la URL de Drive (o Twilio si falla Drive)
                    const urlFinal = driveUrl || mediaUrl;
                    const actualizado = stateManager.updateOrderWithReceipt(pedidoId, urlFinal);
                    
                    if (actualizado) {
                        // Actualizar en Sheets con la URL correcta
                        if (this.sheetsService && this.sheetsService.actualizarComprobantePedido) {
                            try {
                                await this.sheetsService.actualizarComprobantePedido(pedidoId, urlFinal);
                                console.log('✅ Sheets actualizado con URL de Drive:', urlFinal);
                            } catch (error) {
                                console.error('Error actualizando comprobante en Sheets:', error);
                            }
                        }
                        
                        // Notificar admin con la URL correcta
                        if (this.notificationService && this.notificationService.notificarComprobanteParaValidacion) {
                            try {
                                const pedido = stateManager.getConfirmedOrder(pedidoId);
                                await this.notificationService.notificarComprobanteParaValidacion(pedido, urlFinal, from);
                            } catch (error) {
                                console.error('Error notificando admin:', error);
                            }
                        }
                        
                        respuesta = `✅ *COMPROBANTE RECIBIDO*
━━━━━━━━━━━━━━━━━

✅ Tu comprobante ha sido recibido exitosamente

*Código de pedido:* ${pedidoId}
*Estado:* ${ORDER_STATES.PENDING_VERIFICATION}

*Próximos pasos:*
1. Verificaremos tu pago (máx. 30 min)
2. Te confirmaremos por este medio
3. Coordinaremos la entrega (24-48h)

Gracias por completar tu pago!

_Escribe cualquier mensaje para volver al menú_`;
                    } else {
                        respuesta = `❌ Error al actualizar el pedido.

Por favor, intenta nuevamente o contacta soporte.

_Escribe *menu* para volver_`;
                    }
                    
                    fullState = { step: 'menu_principal', data: {} };
                } else if (mensaje.toLowerCase() === 'cancelar') {
                    fullState = { step: 'menu_principal', data: {} };
                    respuesta = this.obtenerMenu(fullState, stateManager.getActiveOrders(from), stateManager.getUserOrders(from).length > 0, from);
                } else {
                    respuesta = `Por favor, envía la foto del comprobante de pago.

_O escribe *cancelar* para volver al menú_`;
                }
                break;
                
            case 'esperando_comprobante':
                // Inicializar contador de intentos si no existe
                if (!fullState.data.intentosComprobante) {
                    fullState.data.intentosComprobante = 0;
                }
                
                // Si hay una imagen
                if (mediaUrl) {
                    respuesta = await this.procesarComprobante(from, fullState, mediaUrl);
                    fullState = { step: 'pedido_completado', data: {} };
                } 
                // Si quiere enviar después (opción 1 o palabras)
                else if (mensaje === '1' ||
                         mensaje.toLowerCase() === 'despues' || 
                         mensaje.toLowerCase() === 'después' ||
                         mensaje.toLowerCase() === 'luego' ||
                         mensaje.toLowerCase() === 'mas tarde' ||
                         mensaje.toLowerCase() === 'más tarde') {
                    // Guardar pedido como pendiente de pago
                    respuesta = await this.guardarPedidoPendientePago(from, fullState);
                    fullState = { step: 'menu_principal', data: {} };
                }
                // Si cancela (opción 2 o palabra)
                else if (mensaje === '2' || mensaje.toLowerCase() === 'cancelar') {
                    fullState.data = {};
                    respuesta = `Proceso de pago cancelado.\n\n*MENÚ PRINCIPAL*\n\n*1* - Ver catálogo\n*2* - Consultar pedido\n*3* - Información\n\nEnvía el número de tu elección`;
                    fullState.step = 'menu_principal';
                } 
                // Si es confirmación por texto (opción 3 o palabras)
                else if (mensaje === '3' ||
                         mensaje.toLowerCase().includes('listo') ||
                         mensaje.toLowerCase().includes('enviado') ||
                         mensaje.toLowerCase() === 'ok' ||
                         mensaje === '✅') {
                    respuesta = await this.procesarComprobante(from, fullState, null);
                    fullState = { step: 'pedido_completado', data: {} };
                }
                // Respuesta inválida - manejar intentos
                else {
                    fullState.data.intentosComprobante++;
                    
                    if (fullState.data.intentosComprobante >= 3) {
                        // Después de 3 intentos, cancelar automáticamente
                        fullState.data = {};
                        respuesta = `⚠️ *PEDIDO CANCELADO AUTOMÁTICAMENTE*\n\nNo recibimos una respuesta válida después de 3 intentos.\n\n━━━━━━━━━━━━━━━━━\n\nPara realizar un nuevo pedido:\n\n*MENÚ PRINCIPAL*\n\n*1* - Ver catálogo\n*2* - Consultar pedido\n*3* - Información\n\nEnvía el número de tu elección`;
                        fullState.step = 'menu_principal';
                    } else {
                        // Mostrar mensaje con contador de intentos
                        const intentosRestantes = 3 - fullState.data.intentosComprobante;
                        respuesta = `❌ *OPCIÓN NO VÁLIDA*\n\n⚠️ *Intento ${fullState.data.intentosComprobante} de 3*\nTe quedan ${intentosRestantes} intento${intentosRestantes > 1 ? 's' : ''}.\n\n━━━━━━━━━━━━━━━━━\n\nPor favor, elige una opción válida:\n\n📸 *Envía la foto del comprobante*\n\n*O escribe el número:*\n*1* - Enviar comprobante más tarde (24 horas)\n*2* - Cancelar el pedido\n*3* - Si ya hiciste la transferencia\n\n_Tu código de pedido: ${fullState.data.pedidoTempId || 'CAF-' + Date.now().toString().slice(-6)}_\n\n⚠️ *Si no eliges una opción válida, el pedido se cancelará automáticamente.*`;
                    }
                }
                break;
                
            case 'pedido_completado':
                // Cualquier mensaje después de completar pedido lleva al menú
                const todosLosPedidosCompleto = stateManager.getUserOrders(from);
                const pedidosActivosCompleto = todosLosPedidosCompleto.filter(p => {
                    const estado = p.estado || p.status || '';
                    return estado !== 'Completado' && 
                           estado !== 'Entregado' && 
                           estado !== 'Cancelado';
                });
                const tieneHistorialCompleto = todosLosPedidosCompleto.length > 0;
                
                respuesta = this.obtenerMenu({ step: 'menu_principal', data: {} }, pedidosActivosCompleto, tieneHistorialCompleto, from);
                fullState.step = 'menu_principal';
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
    obtenerMenu(userState, pedidosActivos, tieneHistorial, from = null) {
        // Obtener pedidos pendientes de pago del usuario
        const userId = from || userState.userId || userState.from || '';
        const pedidosPendientesPago = userId ? stateManager.getPendingPaymentOrders(userId) : [];
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
            
        // Agregar opción de enviar comprobante pendiente si hay pedidos pendientes de pago
        const opcionComprobantePendiente = pedidosPendientesPago.length > 0 ?
            `*5* - 💳 Enviar comprobante pendiente\n` : '';
        
        return `${headerPedidos}*MENÚ PRINCIPAL*

*1* - Ver catálogo y pedir
*2* - Consultar pedido
*3* - Información del negocio
${opcionReordenar}${opcionComprobantePendiente}
Envía el número de tu elección`;
    }
    
    /**
     * Mostrar catálogo
     */
    async mostrarCatalogo(userState) {
        console.log('Mostrando catálogo...');
        
        // Recargar catálogo desde Google Sheets para tener datos actualizados
        console.log('   Recargando catálogo desde Sheets...');
        await productCatalog.forceReload();
        
        let headerCatalogo = '';
        if (userState.data && userState.data.producto) {
            headerCatalogo = `*Tienes un pedido en proceso*
${userState.data.producto.nombre} - ${userState.data.cantidad || '?'}kg

_Selecciona un nuevo producto para reemplazarlo_
━━━━━━━━━━━━━━━━━

`;
        }
        
        // Verificar si productCatalog tiene productos cargados
        const productos = productCatalog.getAllProducts();
        console.log(`   Productos en catálogo: ${productos.length}`);
        
        if (productos.length > 0) {
            console.log('   Usando catálogo dinámico de Google Sheets');
            productos.forEach(p => {
                console.log(`     - ${p.numero}: ${p.nombre} (${p.precio}/kg)`);
            });
        } else {
            console.log('   No hay productos en el catálogo dinámico');
        }
        
        // Usar el catálogo dinámico de productCatalog
        const catalogoFormateado = productCatalog.formatProductList();
        console.log('   Catálogo formateado generado');
        
        return `${headerCatalogo}${catalogoFormateado}`;
    }
    
    /**
     * Mostrar historial de pedidos
     */
    mostrarHistorialPedidos(from) {
        const historial = stateManager.getUserOrders(from).slice(0, 5);
        let respuesta = `*TUS PEDIDOS ANTERIORES*
━━━━━━━━━━━━━━━━━

`;
        historial.forEach((p, index) => {
            // Manejar diferentes formatos de fecha
            let fechaStr = 'Fecha no disponible';
            
            try {
                if (p.timestamp) {
                    // Si tiene timestamp, usarlo
                    const fecha = new Date(p.timestamp);
                    if (!isNaN(fecha.getTime())) {
                        fechaStr = fecha.toLocaleDateString('es-PE');
                    }
                } else if (p.fecha) {
                    // Si tiene fecha string, intentar parsearla
                    // Formato esperado: "DD/MM/YYYY" o "YYYY-MM-DD"
                    if (p.fecha.includes('/')) {
                        // Formato DD/MM/YYYY
                        const partes = p.fecha.split('/');
                        if (partes.length === 3) {
                            const dia = parseInt(partes[0]);
                            const mes = parseInt(partes[1]) - 1; // Los meses en JS son 0-11
                            const año = parseInt(partes[2]);
                            const fecha = new Date(año, mes, dia);
                            if (!isNaN(fecha.getTime())) {
                                fechaStr = fecha.toLocaleDateString('es-PE');
                            } else {
                                fechaStr = p.fecha; // Usar la fecha original si no se puede parsear
                            }
                        } else {
                            fechaStr = p.fecha;
                        }
                    } else if (p.fecha.includes('-')) {
                        // Formato YYYY-MM-DD o similar
                        const fecha = new Date(p.fecha);
                        if (!isNaN(fecha.getTime())) {
                            fechaStr = fecha.toLocaleDateString('es-PE');
                        } else {
                            fechaStr = p.fecha;
                        }
                    } else {
                        fechaStr = p.fecha; // Usar fecha original si no se reconoce formato
                    }
                } else {
                    fechaStr = 'Reciente';
                }
            } catch (e) {
                console.error('Error parseando fecha:', e);
                fechaStr = p.fecha || 'Reciente';
            }
            
            respuesta += `*${index + 1}.* ${p.producto?.nombre || 'Producto'}
   ${p.cantidad}kg - ${this.formatearPrecio(p.total)}
   ${fechaStr}
   ${p.status === 'Confirmado' ? '✅' : ''} ${p.status || p.estado}

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
        console.log(`\nPROCESANDO COMPROBANTE`);
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
        
        // Guardar imagen en Drive si está disponible y actualizar URL
        let driveUrl = null;
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
                console.log('Comprobante guardado:', result);
                
                // Si se subió exitosamente a Drive, usar esa URL
                if (result.success && result.webViewLink) {
                    driveUrl = result.webViewLink;
                    pedidoCompleto.urlComprobante = driveUrl; // Actualizar con URL de Drive
                    console.log('✅ URL de Drive actualizada en el pedido:', driveUrl);
                }
            } catch (error) {
                console.error('Error guardando en Drive:', error);
            }
        }
        
        // Guardar pedido en memoria con la URL actualizada
        stateManager.addConfirmedOrder(pedidoId, pedidoCompleto);
        
        // Guardar en Sheets con la URL de Drive si está disponible
        if (this.sheetsService) {
            try {
                await this.sheetsService.saveOrder(pedidoCompleto);
                console.log('✅ Pedido guardado en Sheets con URL de Drive:', driveUrl || 'Sin comprobante');
            } catch (error) {
                console.error('Error guardando en Sheets:', error);
            }
        }
        
        // Notificar admin
        if (this.notificationService && this.notificationService.notificarNuevoPedido) {
            try {
                await this.notificationService.notificarNuevoPedido(pedidoCompleto);
                // Si hay comprobante, notificar también para validación
                // Usar URL de Drive si está disponible, sino usar URL de Twilio
                const urlParaNotificacion = driveUrl || mediaUrl;
                if (urlParaNotificacion && this.notificationService.notificarComprobanteParaValidacion) {
                    await this.notificationService.notificarComprobanteParaValidacion(pedidoCompleto, urlParaNotificacion, from);
                }
            } catch (error) {
                console.error('Error notificando admin:', error);
            }
        }
        
        return `✅ *COMPROBANTE RECIBIDO*
━━━━━━━━━━━━━━━━━

✅ Tu pedido ha sido registrado exitosamente

*Código de pedido:* ${pedidoId}
*Fecha:* ${new Date().toLocaleDateString('es-PE')}

*RESUMEN DEL PEDIDO:*
${userState.data.producto.nombre}
${userState.data.cantidad}kg
Total: ${this.formatearPrecio(userState.data.total)}

*DATOS DE ENTREGA:*
${userState.data.empresa}
${userState.data.contacto}
${userState.data.telefono}
${userState.data.direccion}

━━━━━━━━━━━━━━━━━

*ESTADO:* ${ORDER_STATES.PENDING_VERIFICATION}

*Próximos pasos:*
1. Verificaremos tu pago (máx. 30 min)
2. Te confirmaremos por este medio
3. Coordinaremos la entrega (24-48h)

*Guarda tu código: ${pedidoId}*

Puedes consultar el estado con tu código en cualquier momento.

Gracias por tu compra!

_Escribe cualquier mensaje para volver al menú_`;
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
            console.error(`No se encontró el pedido ${pedidoId}`);
            return false;
        }
        
        // Actualizar estado
        const estadoAnterior = pedido.status || pedido.estado;
        stateManager.updateOrderStatus(pedidoId, nuevoEstado);
        
        console.log(`Pedido ${pedidoId}: ${estadoAnterior} → ${nuevoEstado}`);
        
        // Si tenemos el número del cliente y el estado es "Pago confirmado", notificar
        if (from || pedido.userId || pedido.telefono) {
            const clientPhone = from || pedido.userId || pedido.telefono;
            
            if (nuevoEstado === ORDER_STATES.PAYMENT_CONFIRMED) {
                const mensaje = `✅ *PAGO CONFIRMADO*\n\n` +
                    `Tu pedido *${pedidoId}* ha sido verificado.\n` +
                    `Estamos preparando tu pedido.\n\n` +
                    `Entrega estimada: 24-48 horas\n\n` +
                    `Gracias por tu compra!`;
                    
                await messageService.sendMessage(clientPhone, mensaje);
            } else if (nuevoEstado === ORDER_STATES.IN_PREPARATION) {
                const mensaje = `*PEDIDO EN PREPARACIÓN*\n\n` +
                    `Tu pedido *${pedidoId}* está siendo preparado.\n\n` +
                    `Te avisaremos cuando esté listo.`;
                    
                await messageService.sendMessage(clientPhone, mensaje);
            } else if (nuevoEstado === ORDER_STATES.ON_THE_WAY) {
                const mensaje = `*PEDIDO EN CAMINO*\n\n` +
                    `Tu pedido *${pedidoId}* está en camino.\n\n` +
                    `Pronto llegará a tu dirección.`;
                    
                await messageService.sendMessage(clientPhone, mensaje);
            } else if (nuevoEstado === ORDER_STATES.DELIVERED) {
                const mensaje = `✅ *PEDIDO ENTREGADO*\n\n` +
                    `Tu pedido *${pedidoId}* ha sido entregado.\n\n` +
                    `Gracias por tu compra!\n` +
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
     * Mostrar pedidos pendientes de pago
     */
    mostrarPedidosPendientesPago(from) {
        const pedidosPendientes = stateManager.getPendingPaymentOrders(from);
        let respuesta = `*PEDIDOS PENDIENTES DE PAGO* 💳
━━━━━━━━━━━━━━━━━

`;
        
        if (pedidosPendientes.length === 0) {
            respuesta += `No tienes pedidos pendientes de pago.\n\n_Escribe *menu* para volver_`;
        } else {
            respuesta += `Tienes ${pedidosPendientes.length} pedido${pedidosPendientes.length > 1 ? 's' : ''} esperando comprobante:\n\n`;
            
            pedidosPendientes.forEach((pedido, index) => {
                const fecha = new Date(pedido.timestamp || pedido.fecha);
                const ahora = new Date();
                const horasTranscurridas = Math.floor((ahora - fecha) / (1000 * 60 * 60));
                const tiempoRestante = Math.max(0, 24 - horasTranscurridas);
                
                respuesta += `*${index + 1}.* Pedido *${pedido.id}*\n`;
                respuesta += `   ${pedido.producto?.nombre || 'Producto'}\n`;
                respuesta += `   ${pedido.cantidad}kg - ${this.formatearPrecio(pedido.total)}\n`;
                respuesta += `   ⏰ Tiempo restante: ${tiempoRestante}h\n`;
                if (tiempoRestante <= 3) {
                    respuesta += `   ⚠️ *¡Envía pronto el comprobante!*\n`;
                }
                respuesta += `\n`;
            });
            
            respuesta += `*Selecciona el número del pedido para enviar el comprobante*\n\n`;
            respuesta += `_O escribe *menu* para volver_`;
        }
        
        return respuesta;
    }
    
    /**
     * Guardar pedido como pendiente de pago
     */
    async guardarPedidoPendientePago(from, userState) {
        console.log(`\nGUARDANDO PEDIDO PENDIENTE DE PAGO`);
        console.log(`   from: ${from}`);
        
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
            telefono: userState.data.telefono || from,
            direccion: userState.data.direccion,
            metodoPago: 'Transferencia bancaria',
            status: ORDER_STATES.PENDING_PAYMENT,  // Estado: Pendiente de pago
            estado: ORDER_STATES.PENDING_PAYMENT,
            comprobanteRecibido: false,
            esReorden: userState.data.esReorden || false,
            urlComprobante: null,
            userId: from,
            fechaLimite: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas de límite
        };
        
        console.log(`   Pedido a guardar como pendiente:`);
        console.log(`     ID: ${pedidoCompleto.id}`);
        console.log(`     Estado: ${pedidoCompleto.estado}`);
        console.log(`     Total: ${pedidoCompleto.total}`);
        
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
        
        // Notificar admin si está disponible
        if (this.notificationService && this.notificationService.notificarPedidoPendiente) {
            try {
                await this.notificationService.notificarPedidoPendiente(pedidoCompleto);
            } catch (error) {
                console.error('Error notificando admin:', error);
            }
        }
        
        return `📝 *PEDIDO GUARDADO SIN COMPROBANTE*
━━━━━━━━━━━━━━━━━

✅ Tu pedido ha sido registrado

*Código de pedido:* ${pedidoId}
*Estado:* ${ORDER_STATES.PENDING_PAYMENT}

*RESUMEN:*
${userState.data.producto.nombre}
${userState.data.cantidad}kg - ${this.formatearPrecio(userState.data.total)}

⚠️ *IMPORTANTE:*
• Tienes *24 horas* para enviar el comprobante
• Después de este tiempo, el pedido se cancelará
• Para enviar el comprobante, escribe *menu* y selecciona la opción *5*

*DATOS BANCARIOS:*
*BCP:* ${config.business.banking.bcpCuenta}
*CCI:* ${config.business.banking.cciCuenta}

Guarda tu código: *${pedidoId}*

_Escribe cualquier mensaje para volver al menú_`;
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
