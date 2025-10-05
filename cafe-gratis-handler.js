/**
 * HANDLER PARA CAMPAÑA CAFÉ GRATUITO
 * Flujo simplificado usando pestañas existentes
 */

const config = require('./config');
const sheetsService = require('./sheets-service');
const messageService = require('./message-service');
const stateManager = require('./state-manager');
const googleDriveService = require('./google-drive-service');
const driveService = require('./drive-service');
const notificationService = require('./notification-service');

// Distritos permitidos para la promoción
const DISTRITOS_PERMITIDOS = [
    'miraflores', 'san isidro', 'barranco',
    'san borja', 'surco', 'santiago de surco',
    'la molina', 'jesus maria', 'lince',
    'magdalena', 'pueblo libre', 'san miguel'
];

class CafeGratisHandler {
    constructor() {
        this.pasosTotales = 6; // 6 pasos incluyendo teléfono
    }

    /**
     * Verificar si el número ya recibió café gratis
     */
    async verificarPromocionPrevia(whatsapp) {
        try {
            const numeroLimpio = whatsapp.replace('whatsapp:', '').replace('+', '');
            
            // Primero verificar en Google Sheets si existe el cliente
            const existeEnSheets = await sheetsService.verificarClienteExiste(numeroLimpio);
            
            if (existeEnSheets) {
                console.log(`⚠️ Cliente ${numeroLimpio} ya existe en Google Sheets`);
                return true;
            }
            
            // También verificar en memoria local
            const pedidosAnteriores = stateManager.getUserOrders(whatsapp);
            
            if (pedidosAnteriores && pedidosAnteriores.length > 0) {
                // Verificar si algún pedido fue gratuito (total = 0)
                const tienePromoPrevia = pedidosAnteriores.some(pedido => {
                    return parseFloat(pedido.total) === 0 || pedido.total === 0 || pedido.tipo === 'PROMOCION' || pedido.tipo === 'MUESTRA';
                });
                
                if (tienePromoPrevia) {
                    console.log(`⚠️ Cliente ${whatsapp} ya recibió muestra (memoria local)`);
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error('Error verificando promoción previa:', error);
            // En caso de error, permitir continuar
            return false;
        }
    }

    /**
     * Procesar mensaje en flujo de café gratis
     */
    async procesarMensajePromo(from, message, messageData) {
        try {
            // Obtener estado actual
            let state = stateManager.getUserState(from) || { step: 'inicio', data: {} };
            
            // Si el mensaje es SOLICITO MUESTRA o variantes, iniciar flujo
            const mensajeLimpio = message.trim().toUpperCase();
            const triggersProm = ['SOLICITO MUESTRA', 'SOLICITAR MUESTRA', 'MUESTRA GRATIS', 'PROMOCAFE', 'PROMO1KG'];
            
            if (triggersProm.some(trigger => mensajeLimpio.includes(trigger))) {
                // Verificar si ya recibió promoción
                const yaRecibio = await this.verificarPromocionPrevia(from);
                
                if (yaRecibio) {
                    return {
                        respuesta: `LO SENTIMOS\n\n` +
                                  `Ya has recibido tu muestra gratuita anteriormente.\n\n` +
                                  `Esta promoción es válida una sola vez por cafetería.\n\n` +
                                  `¿Deseas realizar un pedido regular?\n\n` +
                                  `Escribe MENU para ver nuestro catálogo.`,
                        state: { step: 'inicio', data: {} }
                    };
                }
                
                state = {
                    step: 'promo_inicio',
                    data: {
                        tipo: 'CAFE_GRATIS',
                        timestamp: new Date().toISOString()
                    }
                };
                stateManager.setUserState(from, state);
            }

            // Si no está en flujo de promo, retornar null
            if (!state.step || !state.step.startsWith('promo_')) {
                return null;
            }

            let respuesta = '';
            let mediaUrl = messageData?.mediaUrl;

            switch (state.step) {
                case 'promo_inicio':
                    respuesta = `BIENVENIDO AL PROGRAMA DE MUESTRAS\n` +
                               `━━━━━━━━━━━━━━━━━\n\n` +
                               `Obtén 1kg de Café Premium para tu cafetería.\n\n` +
                               `Para validar tu solicitud, necesitamos algunos datos.\n\n` +
                               `PASO 1 DE 6: NOMBRE DE LA CAFETERÍA\n\n` +
                               `Por favor, escribe el nombre completo de tu cafetería:`;
                    state.step = 'promo_nombre_cafeteria';
                    break;

                case 'promo_nombre_cafeteria':
                    if (!message || message.length < 3) {
                        respuesta = `Por favor, ingresa un nombre válido (mínimo 3 caracteres).`;
                    } else {
                        state.data.nombreCafeteria = message;
                        respuesta = `Registrado: ${message}\n\n` +
                                   `PASO 2 DE 6: DISTRITO\n\n` +
                                   `Selecciona tu distrito:\n\n` +
                                   `1. Miraflores\n` +
                                   `2. San Isidro\n` +
                                   `3. Barranco\n` +
                                   `4. San Borja\n` +
                                   `5. Surco\n` +
                                   `6. La Molina\n` +
                                   `7. Jesús María\n` +
                                   `8. Lince\n` +
                                   `9. Magdalena\n` +
                                   `10. Pueblo Libre\n` +
                                   `11. San Miguel\n` +
                                   `12. Otro distrito\n\n` +
                                   `Envía el número de tu distrito`;
                        state.step = 'promo_distrito';
                    }
                    break;

                case 'promo_distrito':
                    const opcionDistrito = parseInt(message);
                    const distritos = [
                        'Miraflores', 'San Isidro', 'Barranco', 'San Borja',
                        'Surco', 'La Molina', 'Jesús María', 'Lince',
                        'Magdalena', 'Pueblo Libre', 'San Miguel', 'Otro'
                    ];
                    
                    if (isNaN(opcionDistrito) || opcionDistrito < 1 || opcionDistrito > 12) {
                        respuesta = `Por favor, envía un número del 1 al 12.`;
                    } else {
                        state.data.distrito = distritos[opcionDistrito - 1];
                        
                        if (opcionDistrito === 12) {
                            // Distrito no cubierto
                            respuesta = `LO SENTIMOS\n\n` +
                                      `Actualmente la promoción solo está disponible para los distritos listados.\n\n` +
                                      `Pronto expandiremos nuestra cobertura.\n\n` +
                                      `Gracias por tu interés.`;
                            state = { step: 'inicio', data: {} };
                        } else {
                            respuesta = `Distrito: ${state.data.distrito}\n\n` +
                                       `PASO 3 DE 6: DIRECCIÓN\n\n` +
                                       `Escribe la dirección completa de tu cafetería:\n` +
                                       `(Incluye calle, número y referencias)`;
                            state.step = 'promo_direccion';
                        }
                    }
                    break;

                case 'promo_direccion':
                    if (!message || message.length < 10) {
                        respuesta = `Por favor, ingresa una dirección completa.`;
                    } else {
                        state.data.direccion = message;
                        respuesta = `Dirección registrada\n\n` +
                                   `PASO 4 DE 6: VERIFICACIÓN\n\n` +
                                   `Para verificar tu cafetería necesitamos:\n\n` +
                                   `Envía una foto de la FACHADA de tu cafetería\n\n` +
                                   `(Debe verse claramente el nombre del local)`;
                        state.step = 'promo_foto';
                    }
                    break;

                case 'promo_foto':
                    if (!mediaUrl) {
                        respuesta = `No recibimos la foto.\n\n` +
                                   `Por favor, envía una foto clara de la fachada de tu cafetería donde se vea el nombre.`;
                    } else {
                        state.data.fotoUrl = mediaUrl;
                        respuesta = `Foto recibida\n\n` +
                                   `PASO 5 DE 6: DATOS DE CONTACTO\n\n` +
                                   `¿Cuál es tu nombre completo?\n` +
                                   `(Propietario o encargado)`;
                        state.step = 'promo_contacto';
                    }
                    break;

                case 'promo_contacto':
                    if (!message || message.length < 3) {
                        respuesta = `Por favor, ingresa tu nombre completo.`;
                    } else {
                        state.data.nombreContacto = message;
                        respuesta = `Contacto: ${message}\n\n` +
                                   `PASO 6 DE 6: TELÉFONO DE CONTACTO\n\n` +
                                   `¿Cuál es tu número de teléfono?\n` +
                                   `(Incluye el código de país, ejemplo: 51999888777)`;
                        state.step = 'promo_telefono';
                    }
                    break;

                case 'promo_telefono':
                    // Validar y limpiar teléfono
                    const telefonoLimpio = message.replace(/[^0-9]/g, '');
                    
                    if (!telefonoLimpio || telefonoLimpio.length < 8) {
                        respuesta = `Por favor, ingresa un número de teléfono válido.`;
                    } else {
                        state.data.telefonoContacto = telefonoLimpio;
                        
                        // Procesar y guardar
                        const resultado = await this.procesarRegistroGratis(from, state.data);
                        
                        if (resultado.exito) {
                            respuesta = `SOLICITUD REGISTRADA EXITOSAMENTE\n` +
                                       `━━━━━━━━━━━━━━━━━\n\n` +
                                       `Tu solicitud ha sido recibida.\n\n` +
                                       `RESUMEN:\n` +
                                       `Cafetería: ${state.data.nombreCafeteria}\n` +
                                       `Distrito: ${state.data.distrito}\n` +
                                       `Contacto: ${state.data.nombreContacto}\n` +
                                       `Teléfono: ${state.data.telefonoContacto}\n\n` +
                                       `Tu muestra:\n` +
                                       `1kg Café Premium Orgánico\n\n` +
                                       `PRÓXIMOS PASOS:\n` +
                                       `1. Validaremos tu información (24 horas)\n` +
                                       `2. Te confirmaremos la fecha de entrega\n` +
                                       `3. Recibirás tu muestra\n\n` +
                                       `Código de seguimiento: ${resultado.codigoPedido}\n\n` +
                                       `Te notificaremos pronto por este medio.`;
                        } else {
                            respuesta = `ERROR AL PROCESAR\n\n` +
                                       `Hubo un problema al registrar tu solicitud.\n\n` +
                                       `Por favor, intenta nuevamente más tarde o contacta soporte.`;
                        }
                        
                        // Resetear estado
                        state = { step: 'inicio', data: {} };
                    }
                    break;

                default:
                    respuesta = `❌ Estado no reconocido. Escribe CAFEGRATUITO para iniciar.`;
                    state = { step: 'inicio', data: {} };
            }

            // Guardar estado actualizado
            stateManager.setUserState(from, state);
            
            return { respuesta, state };
            
        } catch (error) {
            console.error('Error en procesarMensajePromo:', error);
            return {
                respuesta: `❌ Ocurrió un error. Por favor intenta nuevamente.`,
                state: { step: 'inicio', data: {} }
            };
        }
    }

    /**
     * Procesar y guardar el registro gratuito
     */
    async procesarRegistroGratis(whatsapp, datos) {
        try {
            // Generar ID único
            const timestamp = Date.now();
            const codigoCliente = `CLI-${timestamp.toString().slice(-6)}`;
            const codigoPedido = `CAF-${timestamp.toString().slice(-6)}`;
            
            // Limpiar número de WhatsApp (solo el número)
            const numeroWhatsApp = whatsapp.replace('whatsapp:', '').replace('+', '');
            
            // 1. Subir foto a Google Drive si existe
            let urlFotoDrive = '';
            if (datos.fotoUrl) {
                try {
                    console.log('📸 Subiendo foto de cafetería a Google Drive...');
                    const googleDriveService = require('./google-drive-service');
                    
                    // Inicializar si no está inicializado
                    if (!googleDriveService.initialized && !googleDriveService.useLocalStorage) {
                        await googleDriveService.initialize();
                    }
                    
                    const nombreArchivo = `muestra_${codigoCliente}_${datos.nombreCafeteria.replace(/\s+/g, '_')}.jpg`;
                    const resultadoSubida = await googleDriveService.subirImagenDesdeURL(
                        datos.fotoUrl, 
                        nombreArchivo,
                        {
                            descripcion: `Foto de fachada - ${datos.nombreCafeteria}`,
                            distrito: datos.distrito,
                            cliente: codigoCliente
                        }
                    );
                    
                    if (resultadoSubida && resultadoSubida.webViewLink) {
                        urlFotoDrive = resultadoSubida.webViewLink;
                        console.log('✅ Foto subida exitosamente a Drive');
                    }
                } catch (errorDrive) {
                    console.error('Error subiendo foto a Drive:', errorDrive);
                    urlFotoDrive = datos.fotoUrl; // Mantener URL original si falla
                }
            }
            
            // 2. Guardar en Google Sheets y memoria
            const datosParaClientes = {
                id: codigoCliente,
                whatsapp: numeroWhatsApp,
                empresa: datos.nombreCafeteria,
                contacto: datos.nombreContacto,
                telefono: datos.telefonoContacto || numeroWhatsApp,
                email: '',
                direccion: datos.direccion,
                distrito: datos.distrito,
                ciudad: 'Lima',
                fechaRegistro: new Date().toLocaleDateString('es-PE'),
                ultimaCompra: new Date().toLocaleDateString('es-PE'),
                totalPedidos: 1,
                totalComprado: 0,
                totalKg: 1,
                notas: `Muestra solicitada. Foto: ${urlFotoDrive || datos.fotoUrl || 'Sin foto'}`
            };
            
            // Intentar guardar en Google Sheets - Clientes
            try {
                await sheetsService.agregarCliente(datosParaClientes);
                console.log('✅ Cliente guardado en Google Sheets');
            } catch (error) {
                console.error('Error guardando en Sheets:', error);
            }
            
            // También crear pedido en PedidosWhatsApp
            const datosPedido = {
                id: codigoPedido,
                fecha: new Date().toLocaleDateString('es-PE'),
                hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true }),
                empresa: datos.nombreCafeteria,
                contacto: datos.nombreContacto,
                telefono: datos.telefonoContacto || numeroWhatsApp,
                direccion: datos.direccion,
                producto: 'Café Orgánico Premium',
                cantidad: 1,
                precioUnit: 0,
                subtotal: 0,
                descuento: 0,
                total: 0,
                metodoPago: 'Promoción',
                estado: 'Pendiente verificación',
                comprobante: 'MUESTRA GRATIS',
                observaciones: `Distrito: ${datos.distrito}. URL Foto: ${urlFotoDrive || datos.fotoUrl || 'Sin foto'}`,
                whatsapp: numeroWhatsApp,
                tipo: 'MUESTRA'
            };
            
            try {
                await sheetsService.agregarPedido(datosPedido);
                console.log('✅ Pedido guardado en Google Sheets');
            } catch (error) {
                console.error('Error guardando pedido en Sheets:', error);
            }
            
            // 3. Enviar notificación a administradores
            try {
                // Inicializar servicio de notificaciones si no está inicializado
                const NotificationService = require('./notification-service');
                const twilioClient = messageService.client || null;
                const twilioPhone = process.env.TWILIO_PHONE_NUMBER || '';
                const notificationService = new NotificationService(twilioClient, twilioPhone);
                
                const mensajeNotificacion = `⚠️ NUEVA SOLICITUD DE MUESTRA\n` +
                    `━━━━━━━━━━━━━━━━━\n\n` +
                    `VALIDACIÓN REQUERIDA\n\n` +
                    `Cafetería: ${datos.nombreCafeteria}\n` +
                    `Contacto: ${datos.nombreContacto}\n` +
                    `Teléfono: ${datos.telefonoContacto}\n` +
                    `Distrito: ${datos.distrito}\n` +
                    `Dirección: ${datos.direccion}\n` +
                    `Foto: ${urlFotoDrive ? 'Subida a Drive' : 'Pendiente'}\n\n` +
                    `ACCIONES REQUERIDAS:\n` +
                    `1. Verificar foto de fachada\n` +
                    `2. Validar datos del negocio\n` +
                    `3. Confirmar distrito de cobertura\n` +
                    `4. Aprobar o rechazar solicitud\n\n` +
                    `Código: ${codigoPedido}\n` +
                    `${urlFotoDrive ? `\nVer foto: ${urlFotoDrive}` : ''}\n\n` +
                    `Para aprobar, actualizar estado en Google Sheets`;
                
                // Enviar a grupos configurados
                if (notificationService.gruposConfigured) {
                    // Enviar notificación al grupo admin si está configurado
                    if (notificationService.grupos.admin) {
                        await notificationService.enviarNotificacion(
                            notificationService.grupos.admin, 
                            mensajeNotificacion
                        );
                        console.log('📨 Notificación enviada al grupo admin');
                    }
                    
                    // También enviar al admin personal si está configurado
                    if (notificationService.grupos.adminPersonal) {
                        await notificationService.enviarNotificacion(
                            notificationService.grupos.adminPersonal,
                            mensajeNotificacion
                        );
                        console.log('📨 Notificación enviada al admin personal');
                    }
                } else {
                    console.log('⚠️ No hay grupos configurados para notificaciones');
                }
            } catch (errorNotif) {
                console.error('Error enviando notificación:', errorNotif);
            }
            
            // Guardar en memoria para tracking
            const pedidoGratis = {
                id: codigoPedido,
                ...datosParaClientes,
                producto: {
                    nombre: 'Café Orgánico Premium - MUESTRA',
                    precio: 0
                },
                cantidad: 1,
                total: 0,
                estado: 'Pendiente verificación',
                status: 'Pendiente verificación',
                tipo: 'MUESTRA',
                timestamp: new Date().toISOString()
            };
            
            stateManager.addConfirmedOrder(codigoPedido, pedidoGratis);
            
            console.log('🎆 Pedido de promoción creado:', codigoPedido);
            console.log('   Cafetería:', datos.nombreCafeteria);
            console.log('   Distrito:', datos.distrito);
            
            return {
                exito: true,
                codigoPedido: codigoPedido,
                codigoCliente: codigoCliente
            };
            
        } catch (error) {
            console.error('Error guardando registro gratuito:', error);
            return {
                exito: false,
                error: error.message
            };
        }
    }
}

module.exports = new CafeGratisHandler();
