// Archivo de actualización para integrar notificaciones de validación
// Este código debe agregarse en los puntos correctos de bot-final.js

// PUNTO 1: Cuando se recibe un comprobante por texto (escribe "listo")
// Buscar: pedidosConfirmados.set(pedidoId, pedidoCompleto);
// Agregar después:

// Enviar notificación para validación si está configurado
if (notificationService && pedidoCompleto.comprobanteRecibido) {
    // Notificar al administrador para que valide el comprobante
    await notificationService.notificarComprobanteParaValidacion(pedidoCompleto);
    console.log(`📤 Notificación de validación enviada para pedido ${pedidoId}`);
}

// PUNTO 2: En el webhook cuando se recibe imagen
// Después de procesar la imagen exitosamente, agregar:

// Si se subió a Drive correctamente
if (resultado.success) {
    // Obtener el pedido actualizado
    const pedidoActualizado = pedidosConfirmados.get(pedidoId);
    
    // Enviar notificación con link del comprobante
    if (notificationService && pedidoActualizado) {
        await notificationService.notificarComprobanteParaValidacion(
            pedidoActualizado,
            resultado.webViewLink || resultado.filePath
        );
        console.log(`📤 Notificación con comprobante enviada para validación`);
    }
}

// PUNTO 3: Para responder a la validación desde el grupo
// Agregar este caso en manejarMensaje() para procesar confirmaciones desde el grupo:

case 'validacion_desde_grupo':
    // Este caso se activa cuando el admin responde desde el grupo
    // Detectar si el mensaje viene del grupo admin
    const esGrupoAdmin = from.includes('@g.us') || 
                         from === process.env.WHATSAPP_ADMIN_GROUP;
    
    if (esGrupoAdmin) {
        // Buscar si el mensaje contiene un ID de pedido
        const regexPedido = /CAF-\d{6}/g;
        const pedidosEnMensaje = mensaje.match(regexPedido);
        
        if (pedidosEnMensaje && mensaje.includes('✅')) {
            const pedidoId = pedidosEnMensaje[0];
            const pedido = pedidosConfirmados.get(pedidoId);
            
            if (pedido) {
                // Actualizar estado del pedido
                pedido.estado = 'Pago verificado';
                pedido.fechaVerificacion = new Date();
                pedidosConfirmados.set(pedidoId, pedido);
                
                // Notificar al cliente que su pago fue verificado
                if (pedido.telefono) {
                    await enviarMensaje(pedido.telefono, 
                        `✅ *PAGO VERIFICADO*\n\n` +
                        `Tu pedido ${pedidoId} ha sido verificado.\n` +
                        `Prepararemos tu pedido de inmediato.\n\n` +
                        `⏰ Entrega estimada: 24-48 horas\n\n` +
                        `¡Gracias por tu compra! ☕`
                    );
                }
                
                respuesta = `✅ Pedido ${pedidoId} marcado como verificado`;
            }
        }
    }
    break;
