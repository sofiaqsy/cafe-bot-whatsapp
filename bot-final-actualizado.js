From, respuestaFinal);
                    } else {
                        console.error('[ERROR] Error subiendo a Drive:', resultado.error);
                        await enviarMensaje(From, 'Error al guardar el comprobante. Por favor, escribe "listo" para continuar.');
                    }
                } catch (error) {
                    console.error('Error procesando imagen:', error.message);
                    
                    // Aunque falle la imagen, procesar el pedido
                    console.log('[AVISO] Procesando pedido aunque falle la imagen...');
                    
                    // Procesar como si hubiera escrito "listo"
                    const respuestaComprobante = await manejarMensaje(From, 'listo');
                    
                    // Obtener el pedido actualizado
                    const pedidoActualizado = Array.from(pedidosConfirmados.values())
                        .find(p => p.telefono === From && p.estado === 'Pendiente verificación');
                    
                    // Enviar notificación sin link pero con aviso
                    if (notificationService && pedidoActualizado) {
                        await notificationService.notificarComprobanteParaValidacion(
                            pedidoActualizado,
                            null, // Sin link porque falló
                            From // Pasar el número del cliente
                        );
                        console.log(`[NOTIF] Notificación enviada (sin imagen)`);
                    }
                    
                    await enviarMensaje(From, respuestaComprobante + 
                        '\n\n_Nota: Hubo un problema guardando la imagen, pero tu pedido fue registrado correctamente._');
                }
            } else {
                // Drive no configurado, pero aceptar la imagen como confirmación
                console.log('[AVISO] Drive no configurado, procesando como confirmación de pago');
                
                // Procesar como confirmación
                const respuesta = await manejarMensaje(From, 'listo');
                await enviarMensaje(From, respuesta + '\n\n_Imagen recibida como comprobante_');
            }
        } else {
            // No está en el paso correcto
            console.log(`[AVISO] Imagen recibida en paso incorrecto: ${userState.step}`);
            await enviarMensaje(From, 'Imagen recibida pero no esperada en este momento.\n\nEscribe *menu* para ver opciones.');
        }
    } else {
        // Mensaje de texto normal
        try {
            const respuesta = await manejarMensaje(From, Body);
            await enviarMensaje(From, respuesta);
        } catch (error) {
            console.error('Error en webhook:', error);
        }
    }
    
    res.status(200).send('OK');
});

// ============================================
// ENDPOINT PARA NOTIFICACIONES DE CAMBIO DE ESTADO
// ============================================

// Token secreto para validar webhooks desde Google Sheets
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'tu-token-secreto-seguro-2024';

// Endpoint para recibir notificaciones de cambio de estado
app.post('/webhook-estado', async (req, res) => {
    try {
        // Verificar autorización
        const authHeader = req.headers.authorization;
        if (!authHeader || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
            console.log('[AVISO] Intento de acceso no autorizado al webhook-estado');
            return res.status(401).json({ error: 'No autorizado' });
        }

        const { tipo, pedido, estado, cliente, metadata } = req.body;

        console.log('[NOTIF] Notificación de cambio de estado recibida:');
        console.log(`   Pedido: ${pedido?.id}`);
        console.log(`   Estado: ${estado?.anterior} → ${estado?.nuevo}`);
        console.log(`   Cliente: ${cliente?.whatsapp}`);

        // Validar datos requeridos
        if (!pedido?.id || !estado?.nuevo || !cliente?.whatsapp) {
            return res.status(400).json({ error: 'Datos incompletos' });
        }

        // Generar mensaje según el nuevo estado
        const mensaje = generarMensajeEstadoNotificacion(pedido, estado.nuevo);

        // Formatear número de WhatsApp
        const numeroWhatsApp = cliente.whatsapp.startsWith('whatsapp:') ? 
            cliente.whatsapp : `whatsapp:${cliente.whatsapp}`;

        // Enviar notificación al cliente
        if (twilioConfigured && client) {
            try {
                await client.messages.create({
                    body: mensaje,
                    from: TWILIO_PHONE_NUMBER,
                    to: numeroWhatsApp
                });

                console.log(`[OK] Notificación de estado enviada a ${numeroWhatsApp}`);
                res.status(200).json({ 
                    success: true, 
                    message: 'Notificación enviada',
                    pedido: pedido.id 
                });

            } catch (error) {
                console.error('[ERROR] Error enviando notificación:', error.message);
                res.status(500).json({ 
                    error: 'Error enviando notificación',
                    details: error.message 
                });
            }
        } else {
            // Modo desarrollo
            console.log('[DEV] Notificación que se enviaría:');
            console.log(mensaje);
            res.status(200).json({ 
                success: true, 
                message: 'Notificación simulada (modo dev)',
                pedido: pedido.id 
            });
        }

    } catch (error) {
        console.error('[ERROR] Error en webhook-estado:', error);
        res.status(500).json({ 
            error: 'Error procesando webhook',
            details: error.message 
        });
    }
});

// Función para generar mensajes de notificación de estado
function generarMensajeEstadoNotificacion(pedido, nuevoEstado) {
    const { id, empresa, producto, cantidad } = pedido;
    
    const mensajes = {
        'Pago confirmado': `*PAGO CONFIRMADO!*
================================

Tu pedido *${id}* ha sido verificado exitosamente.

*Detalles:*
• ${producto}
• Cantidad: ${cantidad}kg
• Cliente: ${empresa}

*Próximos pasos:*
Procederemos con la preparación de tu pedido.

Tiempo estimado: 24-48 horas

Gracias por tu confianza!`,
        
        'En preparación': `*PEDIDO EN PREPARACIÓN*
================================

Tu pedido *${id}* está siendo preparado.

${producto} - ${cantidad}kg

Nuestro equipo está seleccionando los mejores granos para ti.

Te notificaremos cuando esté listo.`,
        
        'En camino': `*PEDIDO EN CAMINO!*
================================

Tu pedido *${id}* está en ruta.

${producto} - ${cantidad}kg
Dirección de entrega registrada

El repartidor se comunicará contigo al llegar.

Tiempo estimado: 2-4 horas

Prepara tu cafetera!`,
        
        'Listo para recoger': `*PEDIDO LISTO!*
================================

Tu pedido *${id}* está listo para recoger.

${producto} - ${cantidad}kg

*Dirección de recojo:*
Av. Ejemplo 123, Local 45

*Horario de atención:*
Lunes a Sábado: 9:00 AM - 6:00 PM

Te esperamos!`,
        
        'Entregado': `*PEDIDO ENTREGADO*
================================

Tu pedido *${id}* ha sido entregado exitosamente.

${producto} - ${cantidad}kg

Esperamos que disfrutes tu café!

*Tu opinión es importante*
Cómo fue tu experiencia?
Responde a este mensaje con tu comentario.

Gracias por tu preferencia!`,
        
        'Completado': `*PEDIDO COMPLETADO*
================================

Tu pedido *${id}* ha sido completado.

Gracias por tu compra!

Para nuevos pedidos, escribe *hola*`,
        
        'Cancelado': `*PEDIDO CANCELADO*
================================

Tu pedido *${id}* ha sido cancelado.

Si tienes alguna consulta, contáctanos.

Para realizar un nuevo pedido, escribe *hola*`
    };

    return mensajes[nuevoEstado] || `*ACTUALIZACIÓN DE PEDIDO*
================================

Pedido: *${id}*
Nuevo estado: *${nuevoEstado}*

${producto ? `Producto: ${producto}` : ''}
${cantidad ? `Cantidad: ${cantidad}kg` : ''}

Para más información, escribe *2* y luego tu código de pedido.`;
}

// Panel admin
app.get('/admin', (req, res) => {
    const pedidos = Array.from(pedidosConfirmados.values());
    const totalVentas = pedidos.reduce((sum, p) => sum + p.total, 0);
    const totalKilos = pedidos.reduce((sum, p) => sum + p.cantidad, 0);
    const clientes = datosClientes.size;
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Admin - Coffee Express</title>
            <meta charset="utf-8">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: #f5f5f5;
                }
                h1 { color: #333; }
                .stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin: 20px 0;
                }
                .stat-card {
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                .stat-card h3 {
                    margin: 0;
                    color: #666;
                    font-size: 14px;
                }
                .stat-card .value {
                    font-size: 32px;
                    font-weight: bold;
                    color: #333;
                    margin: 10px 0;
                }
                table {
                    width: 100%;
                    background: white;
                    border-collapse: collapse;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    margin-top: 20px;
                }
                th, td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }
                th {
                    background: #667eea;
                    color: white;
                }
                tr:hover {
                    background: #f5f5f5;
                }
                .back-button {
                    display: inline-block;
                    padding: 10px 20px;
                    background: #667eea;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin-bottom: 20px;
                }
                .empty {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }
                .badge {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: bold;
                    background: #dbeafe;
                    color: #1e40af;
                }
                .badge.reorden {
                    background: #dcfce7;
                    color: #166534;
                }
            </style>
        </head>
        <body>
            <a href="/" class="back-button">← Volver</a>
            
            <h1>Panel de Administración</h1>
            
            <div class="stats">
                <div class="stat-card">
                    <h3>Total Pedidos</h3>
                    <div class="value">${pedidos.length}</div>
                </div>
                <div class="stat-card">
                    <h3>Total Ventas</h3>
                    <div class="value">S/${totalVentas.toFixed(2)}</div>
                </div>
                <div class="stat-card">
                    <h3>Kg Vendidos</h3>
                    <div class="value">${totalKilos} kg</div>
                </div>
                <div class="stat-card">
                    <h3>Clientes</h3>
                    <div class="value">${clientes}</div>
                </div>
                <div class="stat-card">
                    <h3>Pedidos Hoy</h3>
                    <div class="value">${pedidos.filter(p => 
                        new Date(p.fecha).toDateString() === new Date().toDateString()
                    ).length}</div>
                </div>
                <div class="stat-card">
                    <h3>Pendientes</h3>
                    <div class="value" style="color: orange;">${pedidos.filter(p => 
                        p.estado === 'Pendiente verificación'
                    ).length}</div>
                </div>
            </div>
            
            <h2>Pedidos Recientes</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Fecha/Hora</th>
                        <th>Empresa</th>
                        <th>Contacto</th>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Total</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${pedidos.length > 0 ? pedidos.reverse().map(p => `
                        <tr>
                            <td><strong>${p.id}</strong></td>
                            <td>${new Date(p.fecha).toLocaleString('es-PE')}</td>
                            <td><strong>${p.empresa}</strong></td>
                            <td>${p.contacto}<br><small>${p.telefono}</small></td>
                            <td>${p.producto.nombre}</td>
                            <td>${p.cantidad}kg</td>
                            <td><strong>S/${p.total.toFixed(2)}</strong></td>
                            <td>${p.esReorden ? '<span class="badge reorden">REORDEN</span>' : '<span class="badge">NUEVO</span>'}</td>
                            <td style="color: ${p.estado === 'Confirmado' ? 'green' : 'orange'};">
                                ${p.estado === 'Confirmado' ? 'Confirmado' : 'Pendiente'} ${p.estado}
                                ${p.comprobanteRecibido ? '<br><small>Comprobante recibido</small>' : ''}
                            </td>
                        </tr>
                    `).join('') : '<tr><td colspan="9" class="empty">No hay pedidos aún. Prueba el bot para generar pedidos.</td></tr>'}
                </tbody>
            </table>
        </body>
        </html>
    `);
});

// Puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`
    ========================================
    Bot de WhatsApp iniciado - v5.0
    Puerto: ${PORT}
    URL: http://localhost:${PORT}
    Webhook: /webhook
    Test: /test
    Admin: /admin
    Modo: ${DEV_MODE ? 'DESARROLLO' : 'PRODUCCIÓN'}
    ========================================
    
    ${DEV_MODE ? 'Los mensajes se mostrarán en la consola\n' : ''}
    
    FUNCIONALIDADES v5.0:
    [OK] Catálogo dinámico desde Google Sheets
    [OK] Sin emoticonos - interfaz profesional
    [OK] Muestra pedidos pendientes al inicio
    [OK] Opción "Volver a pedir" con historial
    [OK] Guarda datos del cliente
    [OK] Reorden va directo al pago
    [OK] Diferencia entre pedidos nuevos y reordenes
    [OK] Contador de clientes registrados
    [OK] Integración con Drive para comprobantes
    `);
    
    // Cargar catálogo inicial
    if (SPREADSHEET_ID) {
        obtenerCatalogo().then(catalogo => {
            if (catalogo && Object.keys(catalogo).length > 0) {
                console.log(`[OK] Catálogo inicial cargado: ${Object.keys(catalogo).length} productos`);
            } else {
                console.log('[INFO] Usando catálogo por defecto');
            }
        });
    }
});

module.exports = app;