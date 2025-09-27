// Módulo para enviar notificaciones a grupos de WhatsApp
// Configurable para diferentes tipos de notificaciones

class NotificationService {
    constructor(twilioClient, twilioPhone) {
        this.client = twilioClient;
        this.twilioPhone = twilioPhone;
        this.gruposConfigured = false;
        this.grupos = {};
        
        // Cargar configuración de grupos desde variables de entorno
        this.configurarGrupos();
    }
    
    configurarGrupos() {
        // Grupo principal de administración
        if (process.env.WHATSAPP_ADMIN_GROUP) {
            this.grupos.admin = process.env.WHATSAPP_ADMIN_GROUP;
            console.log('📱 Grupo admin configurado para notificaciones');
        }
        
        // Grupo de ventas
        if (process.env.WHATSAPP_VENTAS_GROUP) {
            this.grupos.ventas = process.env.WHATSAPP_VENTAS_GROUP;
            console.log('📱 Grupo ventas configurado');
        }
        
        // Grupo de producción/cocina
        if (process.env.WHATSAPP_PRODUCCION_GROUP) {
            this.grupos.produccion = process.env.WHATSAPP_PRODUCCION_GROUP;
            console.log('📱 Grupo producción configurado');
        }
        
        // Número de administrador individual
        if (process.env.WHATSAPP_ADMIN_NUMBER) {
            this.grupos.adminPersonal = process.env.WHATSAPP_ADMIN_NUMBER;
            console.log('📱 WhatsApp admin personal configurado');
        }
        
        this.gruposConfigured = Object.keys(this.grupos).length > 0;
        
        if (!this.gruposConfigured) {
            console.log('⚠️ No hay grupos configurados para notificaciones');
        }
    }
    
    // Enviar notificación a un destinatario específico
    async enviarNotificacion(destinatario, mensaje) {
        if (!this.client) {
            console.log('⚠️ Cliente Twilio no configurado - No se puede enviar notificación');
            return false;
        }
        
        try {
            const response = await this.client.messages.create({
                body: mensaje,
                from: this.twilioPhone,
                to: destinatario
            });
            console.log(`✅ Notificación enviada a ${destinatario}`);
            return true;
        } catch (error) {
            console.error(`❌ Error enviando notificación a ${destinatario}:`, error.message);
            return false;
        }
    }
    
    // Notificar nuevo pedido a todos los grupos configurados
    async notificarNuevoPedido(pedido) {
        if (!this.gruposConfigured) {
            console.log('⚠️ No hay grupos configurados para notificar');
            return;
        }
        
        // Formatear mensaje de notificación
        const mensaje = this.formatearMensajePedido(pedido);
        
        // Enviar a cada grupo configurado
        const promesas = [];
        
        if (this.grupos.admin) {
            promesas.push(this.enviarNotificacion(this.grupos.admin, mensaje));
        }
        
        if (this.grupos.ventas) {
            promesas.push(this.enviarNotificacion(this.grupos.ventas, mensaje));
        }
        
        if (this.grupos.adminPersonal) {
            promesas.push(this.enviarNotificacion(this.grupos.adminPersonal, mensaje));
        }
        
        // Si es un pedido urgente o grande, notificar también a producción
        if (this.grupos.produccion && pedido.cantidad >= 50) {
            const mensajeProduccion = this.formatearMensajeProduccion(pedido);
            promesas.push(this.enviarNotificacion(this.grupos.produccion, mensajeProduccion));
        }
        
        // Esperar a que todas las notificaciones se envíen
        const resultados = await Promise.allSettled(promesas);
        
        const exitosas = resultados.filter(r => r.status === 'fulfilled' && r.value).length;
        const fallidas = resultados.filter(r => r.status === 'rejected' || !r.value).length;
        
        console.log(`📊 Notificaciones: ${exitosas} exitosas, ${fallidas} fallidas`);
    }
    
    // Notificar pago recibido PARA VALIDACIÓN
    async notificarComprobanteParaValidacion(pedido, urlComprobante = null) {
        if (!this.gruposConfigured) return;
        
        const hora = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
        
        let mensaje = `⚠️ *VALIDAR COMPROBANTE*\n`;
        mensaje += `━━━━━━━━━━━━━\n\n`;
        mensaje += `🕐 Hora: ${hora}\n`;
        mensaje += `📋 Pedido: ${pedido.id}\n\n`;
        
        mensaje += `*CLIENTE:*\n`;
        mensaje += `🏢 ${pedido.empresa}\n`;
        mensaje += `👤 ${pedido.contacto}\n`;
        mensaje += `📱 ${pedido.telefono}\n\n`;
        
        mensaje += `*MONTO A VALIDAR:*\n`;
        mensaje += `💰 *S/${pedido.total}*\n\n`;
        
        mensaje += `📸 *Comprobante recibido*\n`;
        
        if (urlComprobante) {
            mensaje += `🔗 Ver imagen: ${urlComprobante}\n\n`;
        }
        
        mensaje += `*ACCIONES REQUERIDAS:*\n`;
        mensaje += `1️⃣ Verificar en BCP/App\n`;
        mensaje += `2️⃣ Confirmar monto: S/${pedido.total}\n`;
        mensaje += `3️⃣ Responder: ✅ si está OK\n\n`;
        
        mensaje += `⏰ *Validar en máx. 30 min*`;
        
        // Enviar SOLO a admin para validación
        if (this.grupos.admin) {
            await this.enviarNotificacion(this.grupos.admin, mensaje);
        }
        
        if (this.grupos.adminPersonal) {
            await this.enviarNotificacion(this.grupos.adminPersonal, mensaje);
        }
        
        console.log(`📤 Notificación de validación enviada para pedido ${pedido.id}`);
    }
    
    // Formatear mensaje de pedido completo
    formatearMensajePedido(pedido) {
        const fecha = new Date(pedido.fecha);
        const hora = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
        
        let mensaje = `🆕 *NUEVO PEDIDO*\n`;
        mensaje += `━━━━━━━━━━━━━\n\n`;
        mensaje += `📋 *ID:* ${pedido.id}\n`;
        mensaje += `🕐 *Hora:* ${hora}\n\n`;
        
        mensaje += `*CLIENTE:*\n`;
        mensaje += `🏢 ${pedido.empresa}\n`;
        mensaje += `👤 ${pedido.contacto}\n`;
        mensaje += `📱 ${pedido.telefono}\n`;
        mensaje += `📍 ${pedido.direccion}\n\n`;
        
        mensaje += `*PEDIDO:*\n`;
        mensaje += `☕ ${pedido.producto.nombre}\n`;
        mensaje += `⚖️ ${pedido.cantidad} kg\n`;
        mensaje += `💰 *Total: S/${pedido.total}*\n\n`;
        
        mensaje += `*PAGO:*\n`;
        mensaje += `💳 ${pedido.metodoPago || 'Transferencia'}\n`;
        mensaje += `${pedido.comprobanteRecibido ? '📸 Comprobante: ✅' : '⏳ Esperando comprobante'}\n\n`;
        
        if (pedido.esReorden) {
            mensaje += `🔄 *CLIENTE RECURRENTE*\n\n`;
        }
        
        mensaje += `━━━━━━━━━━━━━\n`;
        mensaje += `👉 Ver detalles en:\n`;
        mensaje += `${process.env.APP_URL || 'https://cafe-bot-whatsapp-ad7ab21dc0a8.herokuapp.com'}/admin`;
        
        return mensaje;
    }
    
    // Formatear mensaje para producción
    formatearMensajeProduccion(pedido) {
        let mensaje = `⚠️ *PEDIDO GRANDE - PREPARAR*\n`;
        mensaje += `━━━━━━━━━━━━━\n\n`;
        mensaje += `📦 ${pedido.producto.nombre}\n`;
        mensaje += `⚖️ *${pedido.cantidad} kg*\n`;
        mensaje += `🏢 Cliente: ${pedido.empresa}\n`;
        mensaje += `📅 Entrega: 24-48 horas\n\n`;
        mensaje += `ID: ${pedido.id}`;
        
        return mensaje;
    }
    
    // Notificar estado actualizado
    async notificarEstadoPedido(pedido, nuevoEstado) {
        if (!this.gruposConfigured) return;
        
        let mensaje = `📦 *ACTUALIZACIÓN DE PEDIDO*\n`;
        mensaje += `━━━━━━━━━━━━━\n\n`;
        mensaje += `ID: ${pedido.id}\n`;
        mensaje += `Cliente: ${pedido.empresa}\n`;
        mensaje += `Estado: ${nuevoEstado}\n`;
        
        if (this.grupos.admin) {
            await this.enviarNotificacion(this.grupos.admin, mensaje);
        }
    }
    
    // Notificar resumen diario
    async enviarResumenDiario(estadisticas) {
        if (!this.gruposConfigured) return;
        
        const fecha = new Date().toLocaleDateString('es-PE');
        
        let mensaje = `📊 *RESUMEN DIARIO*\n`;
        mensaje += `${fecha}\n`;
        mensaje += `━━━━━━━━━━━━━\n\n`;
        mensaje += `📦 Pedidos: ${estadisticas.totalPedidos}\n`;
        mensaje += `💰 Ventas: S/${estadisticas.totalVentas}\n`;
        mensaje += `⚖️ Total kg: ${estadisticas.totalKilos}\n`;
        mensaje += `👥 Clientes: ${estadisticas.clientesUnicos}\n\n`;
        
        if (estadisticas.productoMasVendido) {
            mensaje += `⭐ Más vendido: ${estadisticas.productoMasVendido}\n`;
        }
        
        if (estadisticas.pedidosPendientes > 0) {
            mensaje += `\n⚠️ *Pedidos pendientes: ${estadisticas.pedidosPendientes}*`;
        }
        
        // Solo enviar resumen a admin
        if (this.grupos.admin) {
            await this.enviarNotificacion(this.grupos.admin, mensaje);
        }
        
        if (this.grupos.adminPersonal) {
            await this.enviarNotificacion(this.grupos.adminPersonal, mensaje);
        }
    }
}

module.exports = NotificationService;
