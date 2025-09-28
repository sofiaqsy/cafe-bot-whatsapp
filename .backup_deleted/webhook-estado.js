// Agregar este código en bot-final.js después de los otros endpoints

// ============================================
// ENDPOINT PARA NOTIFICACIONES DE CAMBIO DE ESTADO
// ============================================

// Generar un token secreto seguro
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'genera-un-token-seguro-aqui';

// Endpoint para recibir notificaciones de cambio de estado desde Google Sheets
app.post('/webhook-estado', async (req, res) => {
    try {
        // Verificar autorización
        const authHeader = req.headers.authorization;
        if (!authHeader || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
            console.log('⚠️ Intento de acceso no autorizado al webhook');
            return res.status(401).json({ error: 'No autorizado' });
        }

        const { tipo, pedido, estado, cliente, metadata } = req.body;

        console.log('📊 Notificación de cambio de estado recibida:');
        console.log(`   Pedido: ${pedido.id}`);
        console.log(`   Estado anterior: ${estado.anterior}`);
        console.log(`   Estado nuevo: ${estado.nuevo}`);
        console.log(`   Cliente: ${cliente.whatsapp}`);

        // Validar datos requeridos
        if (!pedido?.id || !estado?.nuevo || !cliente?.whatsapp) {
            return res.status(400).json({ error: 'Datos incompletos' });
        }

        // Generar mensaje según el nuevo estado
        const mensaje = generarMensajeEstado(pedido, estado.nuevo);

        // Enviar notificación al cliente por WhatsApp
        if (twilioConfigured && client) {
            const numeroWhatsApp = cliente.whatsapp.startsWith('whatsapp:') ? 
                cliente.whatsapp : `whatsapp:${cliente.whatsapp}`;

            try {
                await client.messages.create({
                    body: mensaje,
                    from: TWILIO_PHONE_NUMBER,
                    to: numeroWhatsApp
                });

                console.log(`✅ Notificación enviada a ${numeroWhatsApp}`);
                
                // Registrar en memoria (opcional)
                if (pedidosConfirmados.has(pedido.id)) {
                    const pedidoGuardado = pedidosConfirmados.get(pedido.id);
                    pedidoGuardado.estado = estado.nuevo;
                    pedidoGuardado.ultimaActualizacion = metadata.timestamp;
                    pedidosConfirmados.set(pedido.id, pedidoGuardado);
                }

                res.status(200).json({ 
                    success: true, 
                    message: 'Notificación enviada',
                    pedido: pedido.id 
                });

            } catch (error) {
                console.error('❌ Error enviando WhatsApp:', error.message);
                res.status(500).json({ 
                    error: 'Error enviando notificación',
                    details: error.message 
                });
            }
        } else {
            // Modo desarrollo - solo log
            console.log('📱 MODO DEV - Mensaje que se enviaría:');
            console.log(mensaje);
            res.status(200).json({ 
                success: true, 
                message: 'Notificación simulada (modo dev)',
                pedido: pedido.id 
            });
        }

    } catch (error) {
        console.error('❌ Error en webhook-estado:', error);
        res.status(500).json({ 
            error: 'Error procesando webhook',
            details: error.message 
        });
    }
});

// Función para generar mensajes personalizados según el estado
function generarMensajeEstado(pedido, nuevoEstado) {
    const { id, empresa, producto, cantidad } = pedido;
    
    // Mensajes predefinidos para cada estado
    const mensajes = {
        'Pago verificado ✅': `✅ *¡PAGO CONFIRMADO!*
━━━━━━━━━━━━━━━━━

Tu pedido *${id}* ha sido verificado exitosamente.

📦 *Detalles:*
• ${producto}
• Cantidad: ${cantidad}kg
• Cliente: ${empresa}

⏱️ *Próximos pasos:*
Procederemos con la preparación de tu pedido.

Tiempo estimado: 24-48 horas

¡Gracias por tu confianza! ☕`,

        'En preparación': `👨‍🍳 *PEDIDO EN PREPARACIÓN*
━━━━━━━━━━━━━━━━━

Tu pedido *${id}* está siendo preparado.

📦 ${producto} - ${cantidad}kg

Nuestro equipo está seleccionando los mejores granos para ti.

⏱️ Te notificaremos cuando esté listo para envío.`,

        'En camino': `🚚 *¡PEDIDO EN CAMINO!*
━━━━━━━━━━━━━━━━━

Tu pedido *${id}* está en ruta.

📦 ${producto} - ${cantidad}kg
📍 Dirección de entrega registrada

El repartidor se comunicará contigo al llegar.

⏱️ Tiempo estimado: 2-4 horas

¡Prepara tu cafetera! ☕`,

        'Entregado': `✅ *PEDIDO ENTREGADO*
━━━━━━━━━━━━━━━━━

Tu pedido *${id}* ha sido entregado exitosamente.

📦 ${producto} - ${cantidad}kg

¡Esperamos que disfrutes tu café! ☕

⭐ *Tu opinión es importante*
¿Cómo fue tu experiencia?
Responde a este mensaje con tu comentario.

¡Gracias por tu preferencia!`,

        'Completado': `✅ *PEDIDO COMPLETADO*
━━━━━━━━━━━━━━━━━

Tu pedido *${id}* ha sido completado.

¡Gracias por tu compra!

Para nuevos pedidos, escribe *hola* 👋`,

        'Cancelado': `❌ *PEDIDO CANCELADO*
━━━━━━━━━━━━━━━━━

Tu pedido *${id}* ha sido cancelado.

Si tienes alguna consulta, contáctanos.

Para realizar un nuevo pedido, escribe *hola* 👋`
    };

    // Retornar mensaje predefinido o genérico
    return mensajes[nuevoEstado] || `📦 *ACTUALIZACIÓN DE PEDIDO*
━━━━━━━━━━━━━━━━━

Pedido: *${id}*
Nuevo estado: *${nuevoEstado}*

${producto ? `Producto: ${producto}` : ''}
${cantidad ? `Cantidad: ${cantidad}kg` : ''}

Para más información, escribe *2* y luego tu código de pedido.`;
}

// Endpoint de prueba para verificar que el webhook funciona
app.get('/webhook-estado/test', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Webhook de estado funcionando',
        timestamp: new Date().toISOString()
    });
});
