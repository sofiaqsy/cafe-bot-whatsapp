const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Verificar configuración
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886';
const DEV_MODE = process.env.DEV_MODE === 'true';

// Inicializar Google Sheets
let googleSheets = null;
let sheetsConfigured = false;

if (process.env.GOOGLE_SPREADSHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
        googleSheets = require('./google-sheets');
        googleSheets.initialize().then(success => {
            if (success) {
                sheetsConfigured = true;
                console.log('✅ Google Sheets conectado correctamente');
                console.log(`📊 Spreadsheet ID: ${process.env.GOOGLE_SPREADSHEET_ID}`);
            } else {
                console.log('⚠️ Google Sheets no se pudo inicializar');
            }
        });
    } catch (error) {
        console.log('⚠️ Error cargando Google Sheets:', error.message);
    }
} else {
    console.log('ℹ️ Google Sheets no configurado (opcional)');
}

// Inicializar Google Drive
let driveService = null;
let driveConfigured = false;

if (process.env.DRIVE_ENABLED === 'TRUE') {
    try {
        driveService = require('./google-drive-service');
        driveService.initialize().then(success => {
            if (success) {
                driveConfigured = true;
                console.log('✅ Google Drive conectado para comprobantes');
            } else {
                console.log('⚠️ Google Drive no se pudo inicializar');
            }
        });
    } catch (error) {
        console.log('⚠️ Error cargando Google Drive:', error.message);
    }
} else {
    console.log('ℹ️ Google Drive no configurado para comprobantes');
}

// Inicializar Twilio
let client = null;
let twilioConfigured = false;

if (!DEV_MODE && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    try {
        const twilio = require('twilio');
        client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        twilioConfigured = true;
        console.log('✅ Twilio configurado correctamente');
    } catch (error) {
        console.error('⚠️ Error configurando Twilio:', error.message);
        twilioConfigured = false;
    }
} else if (DEV_MODE) {
    console.log('🔧 MODO DESARROLLO ACTIVADO - Sin envío real de mensajes');
    console.log('   Los mensajes se mostrarán en la consola');
} else {
    console.log('⚠️ Twilio no configurado - Ejecutando en modo demo');
}

// Estado de conversaciones
const userStates = new Map();
const pedidosConfirmados = new Map();
const conversationHistory = new Map();
const datosClientes = new Map(); // Nuevo: Guardar datos de clientes

// Configuración del negocio
const BUSINESS_CONFIG = {
    name: process.env.BUSINESS_NAME || "Coffee Express",
    phone: process.env.BUSINESS_PHONE || "+51987654321",
    email: process.env.BUSINESS_EMAIL || "ventas@coffeeexpress.com",
    horario: "Lun-Sab 8:00-18:00",
    delivery_min: 5,
    // Datos bancarios
    bcp_cuenta: "1917137473085",
    cci_cuenta: "00219100713747308552",
    // Formulario de comprobantes
    form_comprobantes: process.env.GOOGLE_FORM_URL || "https://forms.gle/CONFIGURAR_AQUI"
};

// Productos disponibles
const PRODUCTOS = {
    '1': {
        id: 'premium',
        numero: '1',
        nombre: 'Café Arábica Premium',
        precio: 50,
        origen: 'Chanchamayo, Junín',
        descripcion: 'Notas de chocolate y frutos rojos'
    },
    '2': {
        id: 'estandar',
        numero: '2',
        nombre: 'Café Arábica Estándar',
        precio: 40,
        origen: 'Satipo, Junín',
        descripcion: 'Notas de caramelo y nueces'
    },
    '3': {
        id: 'organico',
        numero: '3',
        nombre: 'Café Orgánico Certificado',
        precio: 60,
        origen: 'Villa Rica, Pasco',
        descripcion: 'Notas florales y cítricas'
    },
    '4': {
        id: 'mezcla',
        numero: '4',
        nombre: 'Mezcla Especial Cafeterías',
        precio: 35,
        origen: 'Blend peruano',
        descripcion: 'Equilibrado, ideal para espresso'
    },
    '5': {
        id: 'descafeinado',
        numero: '5',
        nombre: 'Café Descafeinado Suave',
        precio: 45,
        origen: 'Cusco',
        descripcion: 'Suave y aromático, sin cafeína'
    }
};

// Función para obtener pedidos pendientes de un cliente
function obtenerPedidosPendientes(telefono) {
    const pedidos = Array.from(pedidosConfirmados.values());
    return pedidos.filter(p => 
        p.telefono === telefono && 
        p.estado === 'Pendiente verificación'
    );
}

// Función para obtener historial de pedidos de un cliente
function obtenerHistorialPedidos(telefono) {
    const pedidos = Array.from(pedidosConfirmados.values());
    return pedidos.filter(p => p.telefono === telefono)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 5); // Últimos 5 pedidos
}

// Función para enviar mensaje
async function enviarMensaje(to, message) {
    if (!conversationHistory.has(to)) {
        conversationHistory.set(to, []);
    }
    conversationHistory.get(to).push({
        type: 'bot',
        message: message,
        timestamp: new Date()
    });

    if (DEV_MODE) {
        console.log('\n' + '='.repeat(60));
        console.log('📤 MENSAJE DEL BOT (MODO DEV)');
        console.log('Para: ' + to);
        console.log('-'.repeat(60));
        console.log(message);
        console.log('='.repeat(60) + '\n');
        
        return { 
            sid: 'dev-' + Date.now(),
            status: 'simulated',
            to: to,
            body: message
        };
    }
    
    if (!twilioConfigured || !client) {
        console.log(`📤 MODO DEMO - Mensaje a ${to}:`, message.substring(0, 100) + '...');
        return { sid: 'demo-' + Date.now() };
    }
    
    try {
        const response = await client.messages.create({
            body: message,
            from: TWILIO_PHONE_NUMBER,
            to: to
        });
        console.log(`✅ Mensaje enviado a ${to}`);
        return response;
    } catch (error) {
        console.error('❌ Error enviando mensaje:', error.message);
        throw error;
    }
}

// Función para formatear precio
function formatearPrecio(precio) {
    return `S/ ${precio.toFixed(2)}`;
}

// Función para obtener el menú con pedido actual si existe
function obtenerMenu(userState, pedidosPendientes, tieneHistorial) {
    let headerPedidos = '';
    
    // Mostrar pedidos pendientes si existen
    if (pedidosPendientes && pedidosPendientes.length > 0) {
        headerPedidos = `📦 *PEDIDOS PENDIENTES:*
━━━━━━━━━━━━━━━━━\n`;
        
        pedidosPendientes.forEach(p => {
            const tiempo = Math.round((new Date() - new Date(p.fecha)) / (1000 * 60));
            const tiempoTexto = tiempo < 60 ? `${tiempo} min` : `${Math.round(tiempo/60)} horas`;
            
            headerPedidos += `📦 *${p.id}*
   ${p.producto.nombre}
   ${p.cantidad}kg - ${formatearPrecio(p.total)}
   ⏳ Hace ${tiempoTexto}
   
`;
        });
        
        headerPedidos += `💡 _Consulta el estado con el código_
━━━━━━━━━━━━━━━━━

`;
    }
    
    // Si hay un pedido en proceso, mostrarlo
    if (userState.data && userState.data.producto) {
        const cantidadStr = userState.data.cantidad ? `${userState.data.cantidad}kg` : 'cantidad por definir';
        const totalStr = userState.data.total ? formatearPrecio(userState.data.total) : 'por calcular';
        
        headerPedidos += `🛒 *PEDIDO ACTUAL:*
━━━━━━━━━━━━━━━━━
📦 ${userState.data.producto.nombre}
⚖️ Cantidad: ${cantidadStr}
💰 Total: ${totalStr}
━━━━━━━━━━━━━━━━━

💡 _Escribe *cancelar* para eliminar el pedido_

`;
    }
    
    // Agregar opción de reordenar si tiene historial
    const opcionReordenar = tieneHistorial ? 
        `*4* - Volver a pedir 🔄\n` : '';
    
    return `${headerPedidos}📱 *MENÚ PRINCIPAL*

*1* - Ver catálogo y pedir ☕
*2* - Consultar pedido 📦
*3* - Información del negocio ℹ️
${opcionReordenar}
Envía el número de tu elección`;
}

// Función principal para manejar mensajes
async function manejarMensaje(from, body) {
    const mensaje = body.trim();
    let userState = userStates.get(from) || { step: 'inicio', data: {} };
    let respuesta = '';

    // Guardar mensaje del usuario en historial
    if (!conversationHistory.has(from)) {
        conversationHistory.set(from, []);
    }
    conversationHistory.get(from).push({
        type: 'user',
        message: mensaje,
        timestamp: new Date()
    });

    if (DEV_MODE) {
        console.log('\n📩 MENSAJE RECIBIDO (MODO DEV)');
        console.log(`De: ${from} | Estado: ${userState.step}`);
        console.log(`Mensaje: "${mensaje}"`);
    }

    try {
        // Comando global: MENÚ
        if (mensaje.toLowerCase() === 'menu' || mensaje.toLowerCase() === 'menú') {
            const pedidosPendientes = obtenerPedidosPendientes(from);
            const tieneHistorial = obtenerHistorialPedidos(from).length > 0;
            respuesta = obtenerMenu(userState, pedidosPendientes, tieneHistorial);
            userState.step = 'menu_principal';
            userStates.set(from, userState);
            return respuesta;
        }

        // Comando global: CANCELAR
        if (mensaje.toLowerCase() === 'cancelar') {
            let mensajeCancelacion = '';
            if (userState.data && userState.data.producto) {
                mensajeCancelacion = `❌ Pedido de *${userState.data.producto.nombre}* cancelado\n\n`;
            }
            userState = { step: 'menu_principal', data: {} };
            const pedidosPendientes = obtenerPedidosPendientes(from);
            const tieneHistorial = obtenerHistorialPedidos(from).length > 0;
            respuesta = `${mensajeCancelacion}${obtenerMenu(userState, pedidosPendientes, tieneHistorial)}`;
            userStates.set(from, userState);
            return respuesta;
        }

        // Flujo principal
        switch (userState.step) {
            case 'inicio':
                // Verificar pedidos pendientes
                const pedidosPendientesInicio = obtenerPedidosPendientes(from);
                const tieneHistorialInicio = obtenerHistorialPedidos(from).length > 0;
                
                // Acceso directo con números
                if (['1', '2', '3', '4'].includes(mensaje)) {
                    userState.step = 'menu_principal';
                    userStates.set(from, userState);
                    return manejarMensaje(from, mensaje);
                }
                
                // Acceso con saludos
                if (mensaje.toLowerCase().includes('hola') || 
                    mensaje.toLowerCase().includes('buenas') ||
                    mensaje.toLowerCase().includes('buenos')) {
                    
                    respuesta = obtenerMenu(userState, pedidosPendientesInicio, tieneHistorialInicio);
                    userState.step = 'menu_principal';
                } else {
                    respuesta = `Hola 👋

Soy el asistente virtual de *${BUSINESS_CONFIG.name}*

Escribe *hola* para ver el menú
O envía directamente:
*1* para ver catálogo
*2* para consultar pedido
*3* para información`;
                }
                break;

            case 'menu_principal':
                const pedidosPendientesMenu = obtenerPedidosPendientes(from);
                const tieneHistorialMenu = obtenerHistorialPedidos(from).length > 0;
                
                switch (mensaje) {
                    case '1':
                        let headerCatalogo = '';
                        if (userState.data && userState.data.producto) {
                            headerCatalogo = `🔄 *Tienes un pedido en proceso*
${userState.data.producto.nombre} - ${userState.data.cantidad || '?'}kg

_Selecciona un nuevo producto para reemplazarlo_
━━━━━━━━━━━━━━━━━

`;
                        }
                        
                        respuesta = `${headerCatalogo}☕ *CATÁLOGO DE CAFÉ*

*1. Premium* - S/50/kg
   📍 Chanchamayo
   🎯 Chocolate y frutos rojos

*2. Estándar* - S/40/kg
   📍 Satipo
   🎯 Caramelo y nueces

*3. Orgánico* ✅ - S/60/kg
   📍 Villa Rica
   🎯 Floral y cítrico

*4. Mezcla Especial* - S/35/kg
   📍 Blend peruano
   🎯 Ideal para espresso

*5. Descafeinado* - S/45/kg
   📍 Cusco
   🎯 Suave sin cafeína

📦 *Pedido mínimo: 5kg*

*Envía el número del producto que deseas*
_Escribe *menu* para volver_`;
                        userState.step = 'seleccion_producto';
                        break;

                    case '2':
                        respuesta = `🔍 *CONSULTAR PEDIDO*

Por favor, ingresa tu código de pedido
_Ejemplo: CAF-123456_

Escribe *menu* para volver`;
                        userState.step = 'consulta_pedido';
                        break;

                    case '3':
                        respuesta = `ℹ️ *INFORMACIÓN*

*${BUSINESS_CONFIG.name}*
_Importadores de café peruano premium_

📱 WhatsApp: ${BUSINESS_CONFIG.phone}
📧 Email: ${BUSINESS_CONFIG.email}
🕒 Horario: ${BUSINESS_CONFIG.horario}
📍 Lima, Perú

*Servicios:*
• Venta al por mayor (mín. 5kg)
• Entregas a todo Lima
• Productos certificados

*Método de pago:*
💳 Transferencia bancaria

Escribe *menu* para volver`;
                        userState.step = 'info_mostrada';
                        break;

                    case '4':
                        if (tieneHistorialMenu) {
                            const historial = obtenerHistorialPedidos(from);
                            respuesta = `🔄 *TUS PEDIDOS ANTERIORES*
━━━━━━━━━━━━━━━━━

`;
                            historial.forEach((p, index) => {
                                const fecha = new Date(p.fecha).toLocaleDateString('es-PE');
                                respuesta += `*${index + 1}.* ${p.producto.nombre}
   📦 ${p.cantidad}kg - ${formatearPrecio(p.total)}
   📅 ${fecha}
   ${p.estado === 'Confirmado' ? '✅' : '⏳'} ${p.estado}

`;
                            });
                            
                            respuesta += `*Envía el número del pedido que deseas repetir*

_O escribe *menu* para volver_`;
                            userState.step = 'seleccionar_reorden';
                        } else {
                            respuesta = `Por favor, envía un número válido:

*1* - Ver catálogo
*2* - Consultar pedido
*3* - Información`;
                        }
                        break;

                    default:
                        respuesta = `Por favor, envía un número válido:

*1* - Ver catálogo
*2* - Consultar pedido
*3* - Información${tieneHistorialMenu ? '\n*4* - Volver a pedir' : ''}`;
                }
                break;

            case 'seleccionar_reorden':
                const historialReorden = obtenerHistorialPedidos(from);
                const indice = parseInt(mensaje) - 1;
                
                if (indice >= 0 && indice < historialReorden.length) {
                    const pedidoAnterior = historialReorden[indice];
                    
                    // Copiar datos del pedido anterior
                    userState.data = {
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
                    datosClientes.set(from, {
                        empresa: pedidoAnterior.empresa,
                        contacto: pedidoAnterior.contacto,
                        telefono: pedidoAnterior.telefono,
                        direccion: pedidoAnterior.direccion
                    });
                    
                    respuesta = `🔄 *REPETIR PEDIDO*

📦 *${pedidoAnterior.producto.nombre}*
⚖️ Cantidad: *${pedidoAnterior.cantidad} kg*
💰 Total: *${formatearPrecio(pedidoAnterior.total)}*

*DATOS DE ENTREGA:*
🏢 ${pedidoAnterior.empresa}
📍 ${pedidoAnterior.direccion}

━━━━━━━━━━━━━━━━━

*MÉTODO DE PAGO*
💳 Realiza la transferencia a:

*Cuenta BCP Soles:*
*${BUSINESS_CONFIG.bcp_cuenta}*

*Cuenta Interbancaria (CCI):*
*${BUSINESS_CONFIG.cci_cuenta}*

━━━━━━━━━━━━━━━━━

💰 *Monto a transferir: ${formatearPrecio(pedidoAnterior.total)}*

📸 *Envía la foto del voucher o comprobante*

_El pedido será confirmado tras verificar el pago_`;
                    
                    userState.step = 'esperando_comprobante';
                } else {
                    respuesta = `❌ Por favor, selecciona un número válido de la lista.

_Escribe *menu* para volver_`;
                }
                break;

            case 'seleccion_producto':
                if (PRODUCTOS[mensaje]) {
                    const producto = PRODUCTOS[mensaje];
                    
                    let mensajeCambio = '';
                    if (userState.data && userState.data.producto && userState.data.producto.id !== producto.id) {
                        mensajeCambio = `_Cambiando de ${userState.data.producto.nombre} a ${producto.nombre}_\n\n`;
                    }
                    
                    userState.data.producto = producto;
                    delete userState.data.cantidad;
                    delete userState.data.total;
                    
                    respuesta = `${mensajeCambio}✅ Has seleccionado:
*${producto.nombre}*

📍 Origen: ${producto.origen}
🎯 Notas: ${producto.descripcion}
💰 Precio: ${formatearPrecio(producto.precio)}/kg

*¿Cuántos kilos necesitas?*
_Pedido mínimo: 5kg_`;
                    userState.step = 'cantidad_producto';
                } else if (mensaje.toLowerCase() === 'menu' || mensaje.toLowerCase() === 'menú') {
                    return manejarMensaje(from, 'menu');
                } else {
                    respuesta = `❌ Por favor, selecciona un producto válido (1-5)

O escribe *menu* para volver al menú`;
                }
                break;

            case 'cantidad_producto':
                const cantidad = parseFloat(mensaje);
                
                if (!isNaN(cantidad) && cantidad >= BUSINESS_CONFIG.delivery_min) {
                    userState.data.cantidad = cantidad;
                    const total = cantidad * userState.data.producto.precio;
                    userState.data.total = total;

                    respuesta = `📊 *RESUMEN DEL PEDIDO*

📦 *${userState.data.producto.nombre}*
⚖️ Cantidad: *${cantidad} kg*
💵 Precio unitario: ${formatearPrecio(userState.data.producto.precio)}/kg

━━━━━━━━━━━━━━━━━
💰 *TOTAL: ${formatearPrecio(total)}*
━━━━━━━━━━━━━━━━━

*¿Confirmar pedido?*
Envía *SI* para continuar
Envía *NO* para cancelar
Envía *MENU* para volver`;
                    userState.step = 'confirmar_pedido';
                } else if (!isNaN(cantidad) && cantidad < BUSINESS_CONFIG.delivery_min) {
                    respuesta = `❌ El pedido mínimo es de *5kg*

Has ingresado: ${cantidad}kg

Por favor, ingresa una cantidad de 5kg o más:`;
                } else {
                    respuesta = `❌ Por favor, ingresa una cantidad válida en números.

_Ejemplo: 10_

Mínimo: 5kg`;
                }
                break;

            case 'confirmar_pedido':
                if (mensaje.toLowerCase() === 'si' || mensaje.toLowerCase() === 'sí') {
                    // Verificar si ya tenemos datos del cliente
                    const datosGuardados = datosClientes.get(from);
                    
                    if (datosGuardados) {
                        // Ya tenemos los datos, usar los guardados
                        userState.data = {
                            ...userState.data,
                            ...datosGuardados
                        };
                        
                        // Ir directo al pago
                        respuesta = `✅ *PEDIDO CONFIRMADO*

Usando tus datos registrados:
🏢 ${datosGuardados.empresa}
📍 ${datosGuardados.direccion}

━━━━━━━━━━━━━━━━━

*MÉTODO DE PAGO*
💳 Realiza la transferencia a:

*Cuenta BCP Soles:*
*${BUSINESS_CONFIG.bcp_cuenta}*

*Cuenta Interbancaria (CCI):*
*${BUSINESS_CONFIG.cci_cuenta}*

*Titular:* ${BUSINESS_CONFIG.name}

━━━━━━━━━━━━━━━━━

💰 *Monto a transferir: ${formatearPrecio(userState.data.total)}*

📸 *Una vez realizada la transferencia, envía la foto del voucher o comprobante*

_El pedido será confirmado tras verificar el pago_`;
                        
                        userState.step = 'esperando_comprobante';
                    } else {
                        // Primera vez, pedir datos
                        respuesta = `👤 *DATOS DEL CLIENTE*

Por favor, ingresa el *nombre de tu empresa o negocio*:`;
                        userState.step = 'datos_empresa';
                    }
                } else if (mensaje.toLowerCase() === 'no') {
                    userState.data = {};
                    respuesta = `❌ Pedido cancelado.

📱 *MENÚ PRINCIPAL*

*1* - Ver catálogo
*2* - Consultar pedido
*3* - Información

Envía el número de tu elección`;
                    userState.step = 'menu_principal';
                } else if (mensaje.toLowerCase() === 'menu' || mensaje.toLowerCase() === 'menú') {
                    return manejarMensaje(from, 'menu');
                } else {
                    respuesta = `Por favor, responde:

*SI* - Confirmar pedido
*NO* - Cancelar
*MENU* - Volver al menú`;
                }
                break;

            case 'datos_empresa':
                userState.data.empresa = mensaje;
                respuesta = `✅ Empresa: *${mensaje}*

Ahora ingresa el *nombre del contacto*:`;
                userState.step = 'datos_contacto';
                break;

            case 'datos_contacto':
                userState.data.contacto = mensaje;
                respuesta = `✅ Contacto: *${mensaje}*

Ingresa tu *número de teléfono*:`;
                userState.step = 'datos_telefono';
                break;

            case 'datos_telefono':
                userState.data.telefono = mensaje;
                respuesta = `✅ Teléfono: *${mensaje}*

Ingresa la *dirección de entrega completa*:
_Incluye distrito y referencia_`;
                userState.step = 'datos_direccion';
                break;

            case 'datos_direccion':
                userState.data.direccion = mensaje;
                
                // Generar ID del pedido anticipadamente
                const pedidoTempId = 'CAF-' + Date.now().toString().slice(-6);
                userState.data.pedidoTempId = pedidoTempId;
                
                // Guardar datos del cliente para futuros pedidos
                datosClientes.set(from, {
                    empresa: userState.data.empresa,
                    contacto: userState.data.contacto,
                    telefono: userState.data.telefono,
                    direccion: userState.data.direccion
                });
                
                // IMPORTANTE: Actualizar el estado ANTES de enviar el mensaje
                userState.step = 'esperando_comprobante';
                userStates.set(from, userState);
                console.log(`🔄 Estado actualizado para ${from}: esperando_comprobante`);
                
                respuesta = `✅ Dirección guardada: *${mensaje}*

━━━━━━━━━━━━━━━━━

*MÉTODO DE PAGO*
💳 Realiza la transferencia a:

*Cuenta BCP Soles:*
*${BUSINESS_CONFIG.bcp_cuenta}*

*Cuenta Interbancaria (CCI):*
*${BUSINESS_CONFIG.cci_cuenta}*

*Titular:* ${BUSINESS_CONFIG.name}

━━━━━━━━━━━━━━━━━

💰 *Monto a transferir: ${formatearPrecio(userState.data.total)}*

📸 *ENVÍO DE COMPROBANTE:*
${driveConfigured ? 
`✅ *Envía la foto del comprobante por WhatsApp*
_La imagen se guardará automáticamente_` : 
`*Opción 1 - Formulario Web 🌐:*
${BUSINESS_CONFIG.form_comprobantes}
_Sube tu imagen desde el teléfono_`}

*Opción alternativa:*
_Escribe *"listo"* o *"enviado"* para confirmar_

💡 *Tu código de pedido es: ${pedidoTempId}*`;
                
                userState.step = 'esperando_comprobante';
                break;

            case 'esperando_comprobante':
                // Detectar si es una imagen (esto se maneja en el webhook ahora)
                // o si es confirmación por texto
                const esConfirmacion = mensaje.toLowerCase().includes('listo') ||
                                      mensaje.toLowerCase().includes('enviado') ||
                                      mensaje.toLowerCase() === 'ok' ||
                                      mensaje === '✅';
                
                if (esConfirmacion) {
                    // Usar el ID generado previamente o crear uno nuevo
                    const pedidoId = userState.data.pedidoTempId || 'CAF-' + Date.now().toString().slice(-6);
                    
                    const pedidoCompleto = {
                        id: pedidoId,
                        fecha: new Date(),
                        producto: userState.data.producto,
                        cantidad: userState.data.cantidad,
                        total: userState.data.total,
                        empresa: userState.data.empresa,
                        contacto: userState.data.contacto,
                        telefono: userState.data.telefono || from,
                        direccion: userState.data.direccion,
                        metodoPago: 'Transferencia bancaria',
                        estado: 'Pendiente verificación',
                        comprobanteRecibido: true,
                        esReorden: userState.data.esReorden || false
                    };
                    
                    pedidosConfirmados.set(pedidoId, pedidoCompleto);

                    // Guardar en Google Sheets si está configurado
                    if (sheetsConfigured && googleSheets && googleSheets.initialized) {
                        try {
                            await googleSheets.agregarPedido({
                                id: pedidoId,
                                nombreNegocio: userState.data.empresa,
                                cafeteria: userState.data.empresa,
                                producto: userState.data.producto,
                                cantidad: userState.data.cantidad,
                                subtotal: userState.data.total,
                                descuento: 0,
                                total: userState.data.total,
                                direccion: userState.data.direccion,
                                contacto: `${userState.data.contacto} - ${userState.data.telefono}`,
                                telefono: from,
                                metodoPago: 'Transferencia bancaria',
                                observaciones: `Comprobante recibido - Pendiente verificación${userState.data.esReorden ? ' (REORDEN)' : ''}`,
                                estado: 'Pendiente verificación'
                            });
                            console.log('✅ Pedido guardado en Google Sheets');
                        } catch (error) {
                            console.error('⚠️ Error guardando en Google Sheets:', error.message);
                        }
                    }

                    respuesta = `📸 *¡COMPROBANTE RECIBIDO!*
━━━━━━━━━━━━━━━━━

✅ Tu pedido ha sido registrado exitosamente

📋 *Código de pedido:* ${pedidoId}
📅 *Fecha:* ${new Date().toLocaleDateString('es-PE')}

*RESUMEN DEL PEDIDO:*
📦 ${userState.data.producto.nombre}
⚖️ ${userState.data.cantidad}kg
💰 Total: ${formatearPrecio(userState.data.total)}

*DATOS DE ENTREGA:*
🏢 ${userState.data.empresa}
👤 ${userState.data.contacto}
📱 ${userState.data.telefono}
📍 ${userState.data.direccion}

━━━━━━━━━━━━━━━━━

⏳ *ESTADO:* Pendiente de verificación

🔍 *Próximos pasos:*
1️⃣ Verificaremos tu pago (máx. 30 min)
2️⃣ Te confirmaremos por este medio
3️⃣ Coordinaremos la entrega (24-48h)

💡 *Guarda tu código: ${pedidoId}*

Puedes consultar el estado con tu código en cualquier momento.

¡Gracias por tu compra! ☕

_Escribe *menu* para realizar otro pedido_`;
                    
                    userState = { step: 'pedido_completado', data: {} };
                    
                    // Log para el administrador
                    if (DEV_MODE) {
                        console.log('\n🔔 NUEVO PEDIDO CON COMPROBANTE');
                        console.log(`   ID: ${pedidoId}`);
                        console.log(`   Cliente: ${pedidoCompleto.empresa}`);
                        console.log(`   Total: ${formatearPrecio(pedidoCompleto.total)}`);
                        console.log(`   Estado: Pendiente verificación`);
                        console.log(`   Tipo: ${pedidoCompleto.esReorden ? 'REORDEN' : 'NUEVO'}`);
                        console.log('   ⚠️ Verificar pago en Telegram/BCP\n');
                    }
                } else if (mensaje.toLowerCase() === 'cancelar') {
                    userState.data = {};
                    respuesta = `❌ Proceso de pago cancelado.

📱 *MENÚ PRINCIPAL*

*1* - Ver catálogo
*2* - Consultar pedido
*3* - Información

Envía el número de tu elección`;
                    userState.step = 'menu_principal';
                } else {
                    respuesta = `📸 *Por favor, envía la foto del comprobante de transferencia*

⚠️ Si no puedes enviar la imagen ahora, escribe *"listo"* o *"enviado"* después de realizar la transferencia.

_O escribe *cancelar* para cancelar el proceso_`;
                }
                break;

            case 'consulta_pedido':
                const pedido = pedidosConfirmados.get(mensaje.toUpperCase());
                if (pedido) {
                    const tiempoTranscurrido = Math.round((new Date() - new Date(pedido.fecha)) / (1000 * 60 * 60));
                    const horasTexto = tiempoTranscurrido < 1 ? 'menos de 1 hora' : `${tiempoTranscurrido} horas`;
                    
                    // Determinar ícono según estado
                    const iconoEstado = pedido.estado === 'Confirmado' ? '✅' : '⏳';
                    const mensajeEstado = pedido.estado === 'Confirmado' ? 
                        '\n✅ *Pago verificado - En preparación*' : 
                        '\n⏳ *Pendiente de verificación de pago*';
                    
                    respuesta = `📦 *ESTADO DEL PEDIDO*

📋 *Código:* ${pedido.id}
${iconoEstado} *Estado:* ${pedido.estado}
⏱️ *Registrado hace:* ${horasTexto}

*DETALLES:*
🏢 ${pedido.empresa}
📦 ${pedido.producto.nombre}
⚖️ ${pedido.cantidad}kg
💰 Total: ${formatearPrecio(pedido.total)}
📍 ${pedido.direccion}
${mensajeEstado}

━━━━━━━━━━━━━━━━━
${pedido.estado === 'Confirmado' ? '⏰ *Entrega estimada:* 24-48 horas' : '🔍 *Verificando pago...*'}

Escribe *menu* para volver`;
                } else {
                    respuesta = `❌ No encontramos el pedido *${mensaje}*

Verifica que el código sea correcto.
_Formato: CAF-123456_

Escribe *menu* para volver`;
                }
                userState.step = 'consulta_completada';
                break;

            default:
                respuesta = `No entendí tu mensaje 😕

*Opciones disponibles:*
• Escribe *menu* para ver el menú
• Escribe *1* para ver el catálogo  
• Escribe *hola* para reiniciar`;
        }

        // Guardar estado
        userStates.set(from, userState);
        return respuesta;

    } catch (error) {
        console.error('Error procesando mensaje:', error);
        return `❌ Error procesando tu solicitud.

Escribe *menu* para reiniciar.`;
    }
}

// Ruta principal
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Coffee Express Bot</title>
            <meta charset="utf-8">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                }
                .container {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                h1 { text-align: center; color: #333; }
                .status {
                    background: #f0f0f0;
                    padding: 20px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .status p {
                    margin: 10px 0;
                }
                .stats {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 20px;
                    margin: 20px 0;
                }
                .stat-card {
                    background: #f9fafb;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
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
                .button {
                    display: inline-block;
                    padding: 12px 24px;
                    background: #667eea;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 5px;
                }
                .button:hover {
                    background: #5a67d8;
                }
                .center {
                    text-align: center;
                    margin-top: 30px;
                }
                .dev-banner {
                    background: #10b981;
                    color: white;
                    padding: 10px;
                    text-align: center;
                    border-radius: 5px;
                    margin-bottom: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>☕ Coffee Express WhatsApp Bot</h1>
                
                ${DEV_MODE ? '<div class="dev-banner">🔧 MODO DESARROLLO ACTIVO</div>' : ''}
                
                <div class="stats">
                    <div class="stat-card">
                        <h3>Pedidos Totales</h3>
                        <div class="value">${pedidosConfirmados.size}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Clientes Registrados</h3>
                        <div class="value">${datosClientes.size}</div>
                    </div>
                </div>
                
                <div class="status">
                    <p>🔧 Modo: ${DEV_MODE ? 'DESARROLLO' : 'PRODUCCIÓN'}</p>
                    <p>📱 WhatsApp: ${twilioConfigured ? '✅ Configurado' : '⚠️ No configurado'}</p>
                    <p>📊 Google Sheets: ${sheetsConfigured ? '✅ Conectado' : '⚠️ No configurado'}</p>
                    <p>🏢 Negocio: ${BUSINESS_CONFIG.name}</p>
                    <p>📧 Email: ${BUSINESS_CONFIG.email}</p>
                    <p>💳 BCP: ${BUSINESS_CONFIG.bcp_cuenta}</p>
                    <p>💳 CCI: ${BUSINESS_CONFIG.cci_cuenta}</p>
                </div>
                
                <div class="center">
                    <a href="/test" class="button">🧪 Probar Bot</a>
                    <a href="/admin" class="button">📊 Panel Admin</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Página de prueba
app.get('/test', (req, res) => {
    const testHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Probar Bot - Coffee Express</title>
    <meta charset="utf-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        h1 { text-align: center; color: #333; }
        .chat-container {
            border: 1px solid #ddd;
            border-radius: 10px;
            padding: 20px;
            height: 500px;
            overflow-y: scroll;
            background: white;
            margin-bottom: 20px;
        }
        .message {
            margin: 10px 0;
            padding: 10px 15px;
            border-radius: 10px;
            max-width: 70%;
            word-wrap: break-word;
        }
        .user {
            background: #667eea;
            color: white;
            margin-left: auto;
            text-align: right;
        }
        .bot {
            background: #f0f0f0;
            border: 1px solid #ddd;
            white-space: pre-wrap;
        }
        .bot strong {
            font-weight: 600;
        }
        .input-container {
            display: flex;
            gap: 10px;
        }
        input {
            flex: 1;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }
        button {
            padding: 12px 24px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background: #5a67d8;
        }
        .suggestions {
            margin: 10px 0;
            text-align: center;
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            justify-content: center;
        }
        .suggestion {
            display: inline-block;
            padding: 5px 10px;
            margin: 2px;
            background: #e5e7eb;
            border-radius: 15px;
            cursor: pointer;
            font-size: 14px;
        }
        .suggestion:hover {
            background: #d1d5db;
        }
        .info {
            background: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 5px;
            padding: 10px;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <h1>🧪 Probar Bot - Modo Desarrollo</h1>
    
    <div class="info">
        ⚠️ <strong>Nota:</strong> Para simular pedidos anteriores y probar reorden:
        <br>1. Completa un pedido primero
        <br>2. Vuelve a escribir "hola" 
        <br>3. Verás la opción "4 - Volver a pedir"
    </div>
    
    <div class="chat-container" id="chat">
        <div class="message bot">Hola 👋 

Soy el asistente virtual de <strong>Coffee Express</strong>

Escribe <strong>hola</strong> o envía directamente:
<strong>1</strong> para ver catálogo
<strong>2</strong> para consultar pedido
<strong>3</strong> para información</div>
    </div>
    
    <div class="suggestions">
        <span class="suggestion" onclick="enviarTexto('hola')">👋 Hola</span>
        <span class="suggestion" onclick="enviarTexto('1')">Ver catálogo</span>
        <span class="suggestion" onclick="enviarTexto('2')">Consultar pedido</span>
        <span class="suggestion" onclick="enviarTexto('3')">Información</span>
        <span class="suggestion" onclick="enviarTexto('4')">Reordenar</span>
        <span class="suggestion" onclick="enviarTexto('menu')">📱 Menú</span>
        <span class="suggestion" onclick="enviarTexto('10')">10 kg</span>
        <span class="suggestion" onclick="enviarTexto('si')">SI</span>
        <span class="suggestion" onclick="enviarTexto('listo')">📸 Listo</span>
        <span class="suggestion" onclick="enviarTexto('cancelar')">Cancelar</span>
    </div>
    
    <div class="input-container">
        <input type="text" id="input" placeholder="Escribe tu mensaje..." autocomplete="off" />
        <button onclick="enviar()">Enviar</button>
    </div>
    
    <script>
        let userPhone = 'test-' + Date.now();
        
        async function enviar() {
            const input = document.getElementById('input');
            const chat = document.getElementById('chat');
            const mensaje = input.value.trim();
            
            if (!mensaje) return;
            
            // Mostrar mensaje del usuario
            const userMsg = document.createElement('div');
            userMsg.className = 'message user';
            userMsg.textContent = mensaje;
            chat.appendChild(userMsg);
            
            input.value = '';
            
            // Enviar al servidor
            try {
                const response = await fetch('/test-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ from: userPhone, body: mensaje })
                });
                
                const data = await response.json();
                
                // Mostrar respuesta del bot
                const botMsg = document.createElement('div');
                botMsg.className = 'message bot';
                
                // Formatear el texto (convertir * en negritas)
                let formattedText = data.response;
                formattedText = formattedText.replace(/\\*([^*]+)\\*/g, '<strong>$1</strong>');
                formattedText = formattedText.replace(/_([^_]+)_/g, '<em>$1</em>');
                
                botMsg.innerHTML = formattedText;
                chat.appendChild(botMsg);
                
            } catch (error) {
                const errorMsg = document.createElement('div');
                errorMsg.className = 'message bot';
                errorMsg.textContent = '❌ Error: ' + error.message;
                chat.appendChild(errorMsg);
            }
            
            chat.scrollTop = chat.scrollHeight;
        }
        
        function enviarTexto(texto) {
            document.getElementById('input').value = texto;
            enviar();
        }
        
        document.getElementById('input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') enviar();
        });
        
        // Focus inicial
        document.getElementById('input').focus();
    </script>
</body>
</html>
    `;
    res.send(testHTML);
});

// Endpoint de prueba
app.post('/test-message', async (req, res) => {
    const { from, body } = req.body;
    const response = await manejarMensaje(from, body);
    res.json({ response });
});

// Webhook de Twilio
app.post('/webhook', async (req, res) => {
    const { From, Body, NumMedia, MediaUrl0, MediaContentType0 } = req.body;
    
    console.log(`📨 Mensaje recibido de ${From}: ${Body}`);
    
    // Si hay imágenes adjuntas
    if (NumMedia && parseInt(NumMedia) > 0) {
        console.log(`📷 Imagen recibida: ${MediaUrl0}`);
        console.log(`📷 Tipo: ${MediaContentType0}`);
        
        // Obtener el estado del usuario
        const userState = userStates.get(From) || { step: 'inicio', data: {} };
        console.log(`👤 Estado del usuario ${From}: ${userState.step}`);
        console.log(`🔧 Drive configurado: ${driveConfigured}`);
        
        // Si está esperando comprobante
        if (userState.step === 'esperando_comprobante') {
            // Verificar si Drive está configurado
            if (driveConfigured && driveService) {
                try {
                    const pedidoId = userState.data.pedidoTempId || 'CAF-' + Date.now().toString().slice(-6);
                    const fileName = `${pedidoId}_${Date.now()}.jpg`;
                    
                    console.log(`📁 Subiendo imagen como: ${fileName}`);
                    
                    // Metadata del comprobante
                    const metadata = {
                        pedidoId: pedidoId,
                        cliente: userState.data.empresa || 'Sin empresa',
                        telefono: From,
                        fecha: new Date().toISOString(),
                        total: userState.data.total || 0
                    };
                    
                    // Subir imagen a Drive
                    const resultado = await driveService.subirImagenDesdeURL(
                        MediaUrl0,
                        fileName,
                        metadata
                    );
                    
                    if (resultado.success) {
                        console.log(`✅ Comprobante subido a Drive: ${resultado.webViewLink}`);
                        
                        // Procesar como si hubiera escrito "listo"
                        const respuestaComprobante = await manejarMensaje(From, 'listo');
                        
                        // Agregar info del link de Drive
                        const respuestaFinal = respuestaComprobante + 
                            `\n\n🔗 *Comprobante guardado en Drive:*\n${resultado.webViewLink}`;
                        
                        await enviarMensaje(From, respuestaFinal);
                    } else {
                        console.error('❌ Error subiendo a Drive:', resultado.error);
                        await enviarMensaje(From, '❌ Error al guardar el comprobante. Por favor, escribe "listo" para continuar.');
                    }
                } catch (error) {
                    console.error('Error procesando imagen:', error);
                    await enviarMensaje(From, '⚠️ Error procesando la imagen. Escribe "listo" para continuar.');
                }
            } else {
                // Drive no configurado, pero aceptar la imagen como confirmación
                console.log('⚠️ Drive no configurado, procesando como confirmación de pago');
                
                // Procesar como confirmación
                const respuesta = await manejarMensaje(From, 'listo');
                await enviarMensaje(From, respuesta + '\n\n📷 _Imagen recibida como comprobante_');
            }
        } else {
            // No está en el paso correcto
            console.log(`⚠️ Imagen recibida en paso incorrecto: ${userState.step}`);
            await enviarMensaje(From, '📷 Imagen recibida pero no esperada en este momento.\n\nEscribe *menu* para ver opciones.');
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
            
            <h1>📊 Panel de Administración</h1>
            
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
                                ${p.estado === 'Confirmado' ? '✓' : '⏳'} ${p.estado}
                                ${p.comprobanteRecibido ? '<br><small>📸 Comprobante recibido</small>' : ''}
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
    ☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕
    🚀 Bot de WhatsApp iniciado - v4.0
    📍 Puerto: ${PORT}
    🌐 URL: http://localhost:${PORT}
    📱 Webhook: /webhook
    🔧 Test: /test
    📊 Admin: /admin
    ⚙️ Modo: ${DEV_MODE ? '🔧 DESARROLLO' : '✅ PRODUCCIÓN'}
    ☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕
    
    ${DEV_MODE ? '💡 Los mensajes se mostrarán en la consola\n' : ''}
    
    🆕 FUNCIONALIDADES v4.0:
    ✅ Muestra pedidos pendientes al inicio
    ✅ Opción "Volver a pedir" con historial
    ✅ Guarda datos del cliente (no los pide de nuevo)
    ✅ Reorden va directo al pago
    ✅ Diferencia entre pedidos nuevos y reordenes
    ✅ Contador de clientes registrados
    `);
});

module.exports = app;
