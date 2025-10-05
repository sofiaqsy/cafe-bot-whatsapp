// ============================================
// CÓDIGO PARA AGREGAR AL webhook-estado.js EXISTENTE
// Solo agrega estas funciones sin modificar lo que ya tienes
// ============================================

// En tu webhook principal, modifica para manejar ambos tipos:
router.post('/webhook-estado', verificarToken, async (req, res) => {
    try {
        console.log('📨 Webhook recibido:', JSON.stringify(req.body, null, 2));
        
        const { tipo } = req.body;
        
        // AGREGAR ESTE SWITCH para manejar diferentes tipos
        if (tipo === 'aprobacion_cliente') {
            // NUEVA: Manejar aprobación de cliente
            return await manejarAprobacionCliente(req, res);
        } else {
            // EXISTENTE: Tu código actual para pedidos
            // ... tu código actual aquí ...
        }
        
    } catch (error) {
        console.error('❌ Error en webhook:', error);
        res.status(500).json({ error: 'Error procesando webhook' });
    }
});

// ============================================
// AGREGAR ESTA NUEVA FUNCIÓN
// ============================================
async function manejarAprobacionCliente(req, res) {
    try {
        const { cliente, estado, metadata } = req.body;
        
        // Validar datos requeridos
        if (!cliente?.id || !cliente?.whatsapp || !estado?.nuevo) {
            return res.status(400).json({ 
                error: 'Datos incompletos para aprobación de cliente',
                requeridos: ['cliente.id', 'cliente.whatsapp', 'estado.nuevo'],
                recibido: req.body
            });
        }
        
        const numeroWhatsApp = cliente.whatsapp.replace('whatsapp:', '');
        
        // Construir mensaje según el estado
        let mensaje;
        
        if (estado.nuevo === 'Verificado') {
            // Mensaje de APROBACIÓN
            mensaje = `🎉 *¡FELICITACIONES!*\n\n`;
            mensaje += `Tu registro ha sido *APROBADO* ✅\n\n`;
            
            if (cliente.empresa) {
                mensaje += `*Empresa:* ${cliente.empresa}\n`;
            }
            if (cliente.contacto) {
                mensaje += `*Contacto:* ${cliente.contacto}\n`;
            }
            
            mensaje += `\n📋 *Beneficios de ser cliente verificado:*\n`;
            mensaje += `• Acceso completo a nuestro catálogo\n`;
            mensaje += `• Precios especiales por volumen\n`;
            mensaje += `• Atención prioritaria\n`;
            mensaje += `• Seguimiento de pedidos en tiempo real\n`;
            
            mensaje += `\n🛍️ *¿Cómo hacer tu primer pedido?*\n`;
            mensaje += `1. Escribe "catálogo" para ver productos\n`;
            mensaje += `2. Selecciona el café que desees\n`;
            mensaje += `3. Indica la cantidad en kg\n`;
            mensaje += `4. Confirma tu pedido\n`;
            
            mensaje += `\n¡Bienvenido a nuestra familia cafetera! ☕`;
            
        } else if (estado.nuevo === 'Rechazado') {
            // Mensaje de RECHAZO
            mensaje = `📋 *ACTUALIZACIÓN DE TU REGISTRO*\n\n`;
            mensaje += `Lamentamos informarte que tu registro no ha podido ser aprobado en este momento.\n\n`;
            
            mensaje += `*Posibles razones:*\n`;
            mensaje += `• Información incompleta\n`;
            mensaje += `• Zona de cobertura no disponible\n`;
            mensaje += `• Datos de contacto incorrectos\n`;
            
            mensaje += `\n📞 *¿Qué puedes hacer?*\n`;
            mensaje += `• Verifica que tus datos sean correctos\n`;
            mensaje += `• Asegúrate de incluir una foto clara de tu local\n`;
            mensaje += `• Contáctanos directamente para más información\n`;
            
            mensaje += `\nPuedes volver a registrarte cuando gustes.`;
            
        } else {
            // Estado no reconocido
            console.log('⚠️ Estado de cliente no reconocido:', estado.nuevo);
            return res.status(400).json({ 
                error: 'Estado de cliente no válido',
                estados_validos: ['Verificado', 'Rechazado'],
                recibido: estado.nuevo
            });
        }
        
        // Agregar pie del mensaje
        mensaje += `\n\n_${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}_`;
        
        // Enviar mensaje por WhatsApp usando tu función existente
        // IMPORTANTE: Usa tu función actual de envío
        await enviarMensajeWhatsApp(numeroWhatsApp, mensaje);
        
        // Si el cliente fue verificado, opcionalmente enviar el catálogo
        if (estado.nuevo === 'Verificado') {
            // Opcional: Enviar catálogo después de 3 segundos
            setTimeout(async () => {
                // Si tienes una función para enviar el catálogo, úsala aquí
                // await enviarCatalogo(numeroWhatsApp);
            }, 3000);
        }
        
        console.log(`✅ Notificación de ${estado.nuevo} enviada a ${numeroWhatsApp}`);
        res.status(200).json({ 
            success: true,
            tipo: 'aprobacion_cliente',
            cliente_id: cliente.id,
            estado: estado.nuevo,
            mensaje: `Notificación de ${estado.nuevo} enviada`
        });
        
    } catch (error) {
        console.error('❌ Error manejando aprobación de cliente:', error);
        res.status(500).json({ error: 'Error procesando aprobación de cliente' });
    }
}

// ============================================
// FIN DEL CÓDIGO A AGREGAR
// ============================================
