#!/bin/bash

echo "📱 ACTUALIZACIÓN DE BOT-FINAL.JS PARA NOTIFICACIONES"
echo "===================================================="
echo ""
echo "Los cambios necesarios en bot-final.js ya están parcialmente hechos."
echo ""
echo "BUSCAR Y AGREGAR en bot-final.js:"
echo ""
echo "1. Donde dice 'pedidosConfirmados.set(pedidoId, pedidoCompleto);'"
echo "   Agregar después:"
echo ""
cat << 'CODE'
// Enviar notificación al grupo si está configurado
if (notificationService) {
    await notificationService.notificarNuevoPedido(pedidoCompleto);
    
    // Si tiene comprobante, notificar también el pago
    if (pedidoCompleto.comprobanteRecibido) {
        await notificationService.notificarPagoRecibido(pedidoCompleto, true);
    }
}
CODE
echo ""
echo "2. En el webhook, donde procesa la imagen del comprobante"
echo "   Después de 'const respuestaComprobante = await manejarMensaje(From, 'listo');'"
echo "   Agregar:"
echo ""
cat << 'CODE'
// Notificar al grupo sobre el comprobante recibido
if (notificationService) {
    const pedido = pedidosConfirmados.get(pedidoId);
    if (pedido) {
        await notificationService.notificarPagoRecibido(pedido, true);
    }
}
CODE
echo ""
echo "3. Para configurar las variables de entorno:"
echo ""
echo "# Obtén primero el ID del grupo:"
echo "# - Crea un grupo en WhatsApp"
echo "# - Agrega el número del bot al grupo"
echo "# - Envía un mensaje desde el grupo"
echo "# - Mira los logs para ver el ID del grupo"
echo ""
echo "# Luego configura en Heroku:"
echo "heroku config:set WHATSAPP_ADMIN_GROUP='whatsapp:+14155238886-XXXXXXXXXX@g.us' -a cafe-bot-whatsapp"
echo "heroku config:set WHATSAPP_ADMIN_NUMBER='whatsapp:+51TU_NUMERO' -a cafe-bot-whatsapp"
echo ""
echo "4. Hacer push de todos los cambios:"
echo "git add notification-service.js bot-final.js"
echo "git commit -m 'Agregar notificaciones a grupos de WhatsApp'"
echo "git push heroku main"
