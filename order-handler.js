            
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
        console.log('Mostrando catálogo...');
        
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
            const fecha = new Date(p.timestamp || p.fecha).toLocaleDateString('es-PE');
            respuesta += `*${index + 1}.* ${p.producto?.nombre || 'Producto'}
   ${p.cantidad}kg - ${this.formatearPrecio(p.total)}
   ${fecha}
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
                console.log('Comprobante guardado:', result);
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
        
        return `✅ *COMPROBANTE RECIBIDO*

*Código de pedido:* ${pedidoId}

Tu pedido ha sido registrado exitosamente.

Verificaremos tu pago en los próximos 30 minutos y te confirmaremos por este medio.

*Entrega estimada:* 24-48 horas

Guarda tu código para consultar el estado.

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
