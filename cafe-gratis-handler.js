/**
 * HANDLER PARA CAMPAÑA CAFÉ GRATUITO
 * Flujo simplificado usando pestañas existentes
 */

const config = require('./config');
// const sheetsService = require('./sheets-service'); // TODO: Implementar sheets-service
const messageService = require('./message-service');
const stateManager = require('./state-manager');

// Distritos permitidos para la promoción
const DISTRITOS_PERMITIDOS = [
    'miraflores', 'san isidro', 'barranco',
    'san borja', 'surco', 'santiago de surco',
    'la molina', 'jesus maria', 'lince',
    'magdalena', 'pueblo libre', 'san miguel'
];

class CafeGratisHandler {
    constructor() {
        this.pasosTotales = 7;
    }

    /**
     * Verificar si el número ya recibió café gratis
     */
    async verificarPromocionPrevia(whatsapp) {
        try {
            // Por ahora, verificar en memoria local
            // TODO: Implementar verificación en Google Sheets
            const numeroLimpio = whatsapp.replace('whatsapp:', '').replace('+', '');
            
            // Verificar si ya existe en los pedidos confirmados
            const pedidosAnteriores = stateManager.getUserOrders(whatsapp);
            
            if (pedidosAnteriores && pedidosAnteriores.length > 0) {
                // Verificar si algún pedido fue gratuito (total = 0)
                const tienePromoPrevia = pedidosAnteriores.some(pedido => {
                    return parseFloat(pedido.total) === 0 || pedido.total === 0 || pedido.tipo === 'PROMOCION';
                });
                
                return tienePromoPrevia;
            }
            
            return false;
        } catch (error) {
            console.error('Error verificando promoción previa:', error);
            return false;
        }
    }

    /**
     * Procesar mensaje en flujo de café gratis
     */
    async procesarMensajePromo(from, message, messageData) {
        try {
            // Obtener estado actual
            let state = stateManager.getState(from);
            
            // Si el mensaje es CAFEGRATUITO, iniciar flujo
            const mensajeLimpio = message.trim().toUpperCase();
            if (mensajeLimpio === 'CAFEGRATUITO' || mensajeLimpio === 'CAFE1KG') {
                // Verificar si ya recibió promoción
                const yaRecibio = await this.verificarPromocionPrevia(from);
                
                if (yaRecibio) {
                    return {
                        respuesta: `⚠️ *LO SENTIMOS*\n\nYa has recibido tu café gratuito anteriormente.\n\n` +
                                  `Esta promoción es válida una sola vez por cafetería.\n\n` +
                                  `*¿Deseas realizar un pedido regular?*\n` +
                                  `Escribe *MENU* para ver nuestro catálogo.`,
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
                stateManager.setState(from, state);
            }

            // Si no está en flujo de promo, retornar null
            if (!state.step || !state.step.startsWith('promo_')) {
                return null;
            }

            let respuesta = '';
            let mediaUrl = messageData?.mediaUrl;

            switch (state.step) {
                case 'promo_inicio':
                    respuesta = `🎉 *BIENVENIDO AL PROGRAMA CAFÉ GRATUITO*\n` +
                               `━━━━━━━━━━━━━━━━━\n\n` +
                               `Obtén *1kg de Café Premium GRATIS* para tu cafetería.\n\n` +
                               `Para validar tu solicitud, necesitamos algunos datos.\n\n` +
                               `*PASO 1 DE 7: NOMBRE DE LA CAFETERÍA*\n\n` +
                               `Por favor, escribe el nombre completo de tu cafetería:`;
                    state.step = 'promo_nombre_cafeteria';
                    break;

                case 'promo_nombre_cafeteria':
                    if (!message || message.length < 3) {
                        respuesta = `❌ Por favor, ingresa un nombre válido (mínimo 3 caracteres).`;
                    } else {
                        state.data.nombreCafeteria = message;
                        respuesta = `✅ Registrado: *${message}*\n\n` +
                                   `*PASO 2 DE 7: DIRECCIÓN*\n\n` +
                                   `Escribe la dirección completa de tu cafetería:\n` +
                                   `_(Incluye calle, número y referencias)_`;
                        state.step = 'promo_direccion';
                    }
                    break;

                case 'promo_direccion':
                    if (!message || message.length < 10) {
                        respuesta = `❌ Por favor, ingresa una dirección completa.`;
                    } else {
                        state.data.direccion = message;
                        respuesta = `✅ Dirección registrada\n\n` +
                                   `*PASO 3 DE 7: DISTRITO*\n\n` +
                                   `Selecciona tu distrito:\n\n` +
                                   `*1.* Miraflores\n` +
                                   `*2.* San Isidro\n` +
                                   `*3.* Barranco\n` +
                                   `*4.* San Borja\n` +
                                   `*5.* Surco\n` +
                                   `*6.* La Molina\n` +
                                   `*7.* Jesús María\n` +
                                   `*8.* Lince\n` +
                                   `*9.* Magdalena\n` +
                                   `*10.* Pueblo Libre\n` +
                                   `*11.* San Miguel\n` +
                                   `*12.* Otro distrito\n\n` +
                                   `_Envía el número de tu distrito_`;
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
                        respuesta = `❌ Por favor, envía un número del 1 al 12.`;
                    } else {
                        state.data.distrito = distritos[opcionDistrito - 1];
                        
                        if (opcionDistrito === 12) {
                            // Distrito no cubierto
                            respuesta = `😔 *LO SENTIMOS*\n\n` +
                                      `Actualmente la promoción solo está disponible para los distritos listados.\n\n` +
                                      `Pronto expandiremos nuestra cobertura.\n\n` +
                                      `_Síguenos para futuras promociones._`;
                            state = { step: 'inicio', data: {} };
                        } else {
                            respuesta = `✅ Distrito: *${state.data.distrito}*\n\n` +
                                       `*PASO 4 DE 7: VERIFICACIÓN*\n\n` +
                                       `Para verificar tu cafetería necesitamos:\n\n` +
                                       `📸 *Envía una foto de la FACHADA de tu cafetería*\n\n` +
                                       `_(Debe verse claramente el nombre del local)_`;
                            state.step = 'promo_foto';
                        }
                    }
                    break;

                case 'promo_foto':
                    if (!mediaUrl) {
                        respuesta = `❌ No recibimos la foto.\n\n` +
                                   `Por favor, envía una foto clara de la fachada de tu cafetería donde se vea el nombre.`;
                    } else {
                        state.data.fotoUrl = mediaUrl;
                        respuesta = `✅ Foto recibida\n\n` +
                                   `*PASO 5 DE 7: DATOS DE CONTACTO*\n\n` +
                                   `¿Cuál es tu nombre completo?\n` +
                                   `_(Propietario o encargado)_`;
                        state.step = 'promo_contacto';
                    }
                    break;

                case 'promo_contacto':
                    if (!message || message.length < 3) {
                        respuesta = `❌ Por favor, ingresa tu nombre completo.`;
                    } else {
                        state.data.nombreContacto = message;
                        respuesta = `✅ Contacto: *${message}*\n\n` +
                                   `*PASO 6 DE 7: RUC (Opcional)*\n\n` +
                                   `Ingresa el RUC de tu empresa:\n` +
                                   `_(Si no tienes, escribe NO)_`;
                        state.step = 'promo_ruc';
                    }
                    break;

                case 'promo_ruc':
                    if (message.toUpperCase() === 'NO' || message.toUpperCase() === 'NO TENGO' || message === '0') {
                        state.data.ruc = '';
                    } else if (message.length === 11 && /^\d+$/.test(message)) {
                        state.data.ruc = message;
                    } else if (message.length > 0 && message.length !== 11 && !/^no/i.test(message)) {
                        respuesta = `❌ El RUC debe tener 11 dígitos.\n\n` +
                                   `Ingresa tu RUC de 11 dígitos o escribe NO:`;
                        break;
                    } else {
                        state.data.ruc = '';
                    }
                    
                    respuesta = `✅ Datos fiscales registrados\n\n` +
                               `*PASO 7 DE 7: HORARIO DE ENTREGA*\n\n` +
                               `¿En qué horario prefieres recibir tu pedido?\n\n` +
                               `*1.* Mañana (8am - 12pm)\n` +
                               `*2.* Tarde (12pm - 5pm)\n` +
                               `*3.* Cualquier horario\n\n` +
                               `_Envía el número de tu preferencia_`;
                    state.step = 'promo_horario';
                    break;

                case 'promo_horario':
                    const opcionHorario = parseInt(message);
                    const horarios = ['Mañana (8am - 12pm)', 'Tarde (12pm - 5pm)', 'Cualquier horario'];
                    
                    if (isNaN(opcionHorario) || opcionHorario < 1 || opcionHorario > 3) {
                        respuesta = `❌ Por favor, envía 1, 2 o 3.`;
                    } else {
                        state.data.horarioEntrega = horarios[opcionHorario - 1];
                        
                        // Procesar y guardar
                        const resultado = await this.procesarRegistroGratis(from, state.data);
                        
                        if (resultado.exito) {
                            respuesta = `✅ *SOLICITUD REGISTRADA EXITOSAMENTE*\n` +
                                       `━━━━━━━━━━━━━━━━━\n\n` +
                                       `Tu solicitud ha sido recibida.\n\n` +
                                       `📋 *RESUMEN:*\n` +
                                       `• Cafetería: ${state.data.nombreCafeteria}\n` +
                                       `• Distrito: ${state.data.distrito}\n` +
                                       `• Contacto: ${state.data.nombreContacto}\n` +
                                       `• Horario preferido: ${state.data.horarioEntrega}\n\n` +
                                       `📦 *Tu pedido gratuito:*\n` +
                                       `• 1kg Café Premium Orgánico\n` +
                                       `• Valor: S/ 45.00\n` +
                                       `• Costo: *GRATIS*\n\n` +
                                       `🔍 *PRÓXIMOS PASOS:*\n` +
                                       `1. Validaremos tu información (24 horas)\n` +
                                       `2. Te confirmaremos la fecha de entrega\n` +
                                       `3. Recibirás tu café gratuito\n\n` +
                                       `*Código de seguimiento:* ${resultado.codigoPedido}\n\n` +
                                       `_Te notificaremos pronto por este medio._\n\n` +
                                       `¡Gracias por confiar en nosotros! ☕`;
                        } else {
                            respuesta = `❌ *ERROR AL PROCESAR*\n\n` +
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
            stateManager.setState(from, state);
            
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
            
            // Limpiar número de WhatsApp
            const numeroLimpio = whatsapp.replace('whatsapp:', '').replace('+', '');
            
            // 1. Por ahora, guardamos solo en memoria
            // TODO: Integrar con Google Sheets cuando se implemente sheets-service
            
            // await sheetsService.agregarCliente(datosCliente);
            
            // 2. Crear pedido gratuito en memoria
            const pedidoGratis = {
                id: codigoPedido,
                clienteId: codigoCliente,
                empresa: datos.nombreCafeteria,
                contacto: datos.nombreContacto,
                telefono: numeroLimpio,
                direccion: datos.direccion,
                distrito: datos.distrito,
                producto: {
                    nombre: 'Café Orgánico Premium - GRATIS',
                    precio: 0
                },
                cantidad: 1,
                total: 0,
                estado: 'Pendiente verificación',
                status: 'Pendiente verificación',
                tipo: 'PROMOCION',
                fecha: new Date().toLocaleDateString('es-PE'),
                hora: new Date().toLocaleTimeString('es-PE'),
                timestamp: new Date().toISOString(),
                fotoUrl: datos.fotoUrl || '',
                horarioEntrega: datos.horarioEntrega,
                ruc: datos.ruc || '',
                notas: 'PROMOCIÓN - Café Gratis 1kg para nueva cafetería'
            };
            
            // await sheetsService.agregarPedido(datosPedido);
            
            // 3. Guardar en memoria para tracking
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
