const express = require('express');
const dotenv = require('dotenv');
const imageHandler = require('./image-handler');

dotenv.config();

// Inicializar carpeta de uploads
imageHandler.ensureUploadsDir();

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Verificar configuración
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886';
const DEV_MODE = process.env.DEV_MODE === 'true';

// Inicializar Twilio solo si hay credenciales y no estamos en modo dev
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

// Inicializar Google Sheets si está configurado
let googleSheets = null;
if (process.env.GOOGLE_SPREADSHEET_ID) {
    try {
        googleSheets = require('./google-sheets');
        googleSheets.initialize().then(success => {
            if (success) {
                console.log('✅ Google Sheets conectado');
            }
        });
    } catch (error) {
        console.log('⚠️ Google Sheets no disponible:', error.message);
    }
}

// Estado de conversaciones
const userStates = new Map();
const pedidosConfirmados = new Map();
const carritosTemporales = new Map();

// Historial de conversaciones para modo dev
const conversationHistory = new Map();

// Configuración del negocio
const BUSINESS_CONFIG = {
    name: process.env.BUSINESS_NAME || "Coffee Express",
    phone: process.env.BUSINESS_PHONE || "+51987654321",
    email: process.env.BUSINESS_EMAIL || "ventas@coffeeexpress.com",
    horario: "Lun-Sab 8:00-18:00",
    delivery_min: 5, // kg mínimos
    descuento_mayorista: 10, // %
    cantidad_mayorista: 50 // kg
};

// Productos disponibles
const PRODUCTOS = {
    '1': {
        id: 'premium',
        numero: '1',
        nombre: 'Café Arábica Premium',
        precio: 50,
        origen: 'Chanchamayo, Junín',
        descripcion: 'Notas de chocolate y frutos rojos',
        altitud: '1,800 msnm',
        proceso: 'Lavado',
        tueste: 'Medio'
    },
    '2': {
        id: 'estandar',
        numero: '2',
        nombre: 'Café Arábica Estándar',
        precio: 40,
        origen: 'Satipo, Junín',
        descripcion: 'Notas de caramelo y nueces',
        altitud: '1,500 msnm',
        proceso: 'Natural',
        tueste: 'Medio-Oscuro'
    },
    '3': {
        id: 'organico',
        numero: '3',
        nombre: 'Café Orgánico Certificado',
        precio: 60,
        origen: 'Villa Rica, Pasco',
        descripcion: 'Notas florales y cítricas',
        altitud: '2,000 msnm',
        proceso: 'Honey',
        tueste: 'Medio-Claro',
        certificacion: '✅ Certificado Orgánico'
    },
    '4': {
        id: 'mezcla',
        numero: '4',
        nombre: 'Mezcla Especial Cafeterías',
        precio: 35,
        origen: 'Blend peruano',
        descripcion: 'Equilibrado, ideal para espresso',
        altitud: 'Varios',
        proceso: 'Mixto',
        tueste: 'Oscuro'
    },
    '5': {
        id: 'descafeinado',
        numero: '5',
        nombre: 'Café Descafeinado Suave',
        precio: 45,
        origen: 'Cusco',
        descripcion: 'Suave y aromático, sin cafeína',
        altitud: '1,700 msnm',
        proceso: 'Swiss Water',
        tueste: 'Medio'
    }
};

// Función para enviar mensaje
async function enviarMensaje(to, message) {
    // Guardar en historial
    if (!conversationHistory.has(to)) {
        conversationHistory.set(to, []);
    }
    conversationHistory.get(to).push({
        type: 'bot',
        message: message,
        timestamp: new Date()
    });

    if (DEV_MODE) {
        // MODO DESARROLLO: Solo mostrar en consola
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

// Función para calcular descuento
function calcularDescuento(cantidad, precio) {
    const subtotal = cantidad * precio;
    const descuento = cantidad >= BUSINESS_CONFIG.cantidad_mayorista 
        ? subtotal * (BUSINESS_CONFIG.descuento_mayorista / 100) 
        : 0;
    return {
        subtotal,
        descuento,
        total: subtotal - descuento,
        porcentaje: descuento > 0 ? BUSINESS_CONFIG.descuento_mayorista : 0
    };
}

// Función para manejar mensajes
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
    } else {
        console.log(`📩 De: ${from} | Mensaje: "${mensaje}" | Estado: ${userState.step}`);
    }

    try {
        // Comandos globales
        if (mensaje.toLowerCase() === 'menu' || mensaje.toLowerCase() === 'menú') {
            respuesta = `📱 *MENÚ RÁPIDO*

*1* - Ver catálogo y pedir
*2* - Consultar pedido
*3* - Contactar asesor
*4* - Información

Envía el número de tu elección`;
            userState = { step: 'menu_principal', data: {} };
            userStates.set(from, userState);
            return respuesta;
        }

        if (mensaje.toLowerCase() === 'cancelar') {
            respuesta = `❌ Operación cancelada.

Escribe *menu* para ver opciones o *hola* para reiniciar.`;
            userState = { step: 'inicio', data: {} };
            userStates.set(from, userState);
            return respuesta;
        }

        // Flujo principal
        switch (userState.step) {
            case 'inicio':
                if (mensaje.toLowerCase().includes('hola') || 
                    mensaje.toLowerCase().includes('buenas') ||
                    mensaje.toLowerCase().includes('buenos')) {
                    
                    const hora = new Date().getHours();
                    const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
                    
                    respuesta = `${saludo} ☕

Bienvenido a *${BUSINESS_CONFIG.name}*
_Café peruano de alta calidad directo del productor_

¿Qué deseas hacer?

*1* - Ver catálogo y pedir ☕
*2* - Consultar pedido 📦
*3* - Hablar con un asesor 💬
*4* - Información del negocio ℹ️

_Envía el número de tu elección_`;
                    userState.step = 'menu_principal';
                } else if (['1','2','3','4'].includes(mensaje)) {
                    // Permitir acceso directo al menú
                    userState.step = 'menu_principal';
                    return manejarMensaje(from, mensaje);
                } else {
                    respuesta = `Hola 👋

Soy el asistente virtual de *${BUSINESS_CONFIG.name}*

Escribe *hola* para comenzar o envía:
*1* para ver nuestro catálogo`;
                }
                break;

            case 'menu_principal':
                switch (mensaje) {
                    case '1':
                        respuesta = `☕ *CATÁLOGO - CAFÉ EN GRANO*
━━━━━━━━━━━━━━━━━━━━━━

*1. Arábica Premium* 
   ${formatearPrecio(PRODUCTOS['1'].precio)}/kg
   📍 Chanchamayo | 1,800 msnm
   🎯 Chocolate y frutos rojos

*2. Arábica Estándar*
   ${formatearPrecio(PRODUCTOS['2'].precio)}/kg
   📍 Satipo | 1,500 msnm
   🎯 Caramelo y nueces

*3. Orgánico Certificado* ✅
   ${formatearPrecio(PRODUCTOS['3'].precio)}/kg
   📍 Villa Rica | 2,000 msnm
   🎯 Floral y cítrico

*4. Mezcla Especial*
   ${formatearPrecio(PRODUCTOS['4'].precio)}/kg
   📍 Blend peruano
   🎯 Ideal para espresso

*5. Descafeinado Suave*
   ${formatearPrecio(PRODUCTOS['5'].precio)}/kg
   📍 Cusco | Swiss Water
   🎯 Aromático sin cafeína

━━━━━━━━━━━━━━━━━━━━━━
🏷️ *Descuento ${BUSINESS_CONFIG.descuento_mayorista}%* en pedidos ≥ ${BUSINESS_CONFIG.cantidad_mayorista}kg
📦 Pedido mínimo: ${BUSINESS_CONFIG.delivery_min}kg

*Para pedir:* Envía el número del producto
*Más info:* Escribe "info" + número (ej: info 3)`;
                        userState.step = 'seleccion_producto';
                        break;

                    case '2':
                        respuesta = `🔍 *CONSULTAR PEDIDO*

Por favor, ingresa tu código de pedido.

_Ejemplo: CAF-123456_

O escribe *menu* para volver`;
                        userState.step = 'consulta_pedido';
                        break;

                    case '3':
                        respuesta = `💬 *CONTACTAR ASESOR*

¿En qué podemos ayudarte?

Por favor, escribe tu consulta detallada y un asesor se comunicará contigo a la brevedad.

_Horario de atención: ${BUSINESS_CONFIG.horario}_`;
                        userState.step = 'esperando_consulta';
                        break;

                    case '4':
                        respuesta = `ℹ️ *INFORMACIÓN*

*${BUSINESS_CONFIG.name}*
_Importadores de café peruano premium_

📱 WhatsApp: ${BUSINESS_CONFIG.phone}
📧 Email: ${BUSINESS_CONFIG.email}
🕒 Horario: ${BUSINESS_CONFIG.horario}
📍 Lima, Perú

*Servicios:*
• Venta al por mayor
• Entregas a todo Lima
• Asesoría personalizada
• Productos certificados

*Métodos de pago:*
💳 Transferencia bancaria
💵 Yape/Plin
💰 Efectivo contra entrega

Escribe *menu* para volver o *1* para ver catálogo`;
                        userState.step = 'info_mostrada';
                        break;

                    default:
                        respuesta = `❌ Opción no válida.

Por favor, envía un número del *1* al *4*

*1* - Catálogo
*2* - Consultar pedido
*3* - Asesor
*4* - Información`;
                }
                break;

            case 'seleccion_producto':
                // Verificar si pide información adicional
                if (mensaje.toLowerCase().startsWith('info')) {
                    const numeroProducto = mensaje.replace(/[^0-9]/g, '');
                    const producto = PRODUCTOS[numeroProducto];
                    
                    if (producto) {
                        respuesta = `📋 *INFORMACIÓN DETALLADA*
━━━━━━━━━━━━━━━━━━━━━━

*${producto.nombre}*

💰 Precio: ${formatearPrecio(producto.precio)}/kg
📍 Origen: ${producto.origen}
🏔️ Altitud: ${producto.altitud}
⚙️ Proceso: ${producto.proceso}
🔥 Tueste: ${producto.tueste}
🎯 Perfil: ${producto.descripcion}
${producto.certificacion || ''}

━━━━━━━━━━━━━━━━━━━━━━

Para pedir este producto, envía *${numeroProducto}*
Para ver el catálogo, envía *0*`;
                    } else {
                        respuesta = `❌ Producto no encontrado.

Envía un número del *1* al *5* para pedir
O escribe "info" + número para más detalles`;
                    }
                } else if (mensaje === '0') {
                    // Volver a mostrar catálogo
                    return manejarMensaje(from, '1');
                } else if (PRODUCTOS[mensaje]) {
                    // Selección de producto válida
                    const producto = PRODUCTOS[mensaje];
                    userState.data.producto = producto;
                    
                    respuesta = `✅ *${producto.nombre}*
Precio: ${formatearPrecio(producto.precio)}/kg

*¿Cuántos kilos necesitas?*

_Mínimo: ${BUSINESS_CONFIG.delivery_min}kg_
${BUSINESS_CONFIG.cantidad_mayorista}kg o más: *${BUSINESS_CONFIG.descuento_mayorista}% de descuento*

Ingresa la cantidad:`;
                    userState.step = 'cantidad_producto';
                } else {
                    respuesta = `❌ Por favor, selecciona una opción válida:

*1-5* para pedir un producto
*info 1-5* para más información
*0* para ver el catálogo
*menu* para volver al menú`;
                }
                break;

            case 'cantidad_producto':
                const cantidad = parseFloat(mensaje);
                
                if (!isNaN(cantidad) && cantidad >= BUSINESS_CONFIG.delivery_min) {
                    userState.data.cantidad = cantidad;
                    const calculo = calcularDescuento(cantidad, userState.data.producto.precio);
                    userState.data = { ...userState.data, ...calculo };

                    respuesta = `📊 *RESUMEN DE TU PEDIDO*
━━━━━━━━━━━━━━━━━━━━━━

📦 *${userState.data.producto.nombre}*
⚖️ Cantidad: *${cantidad} kg*
💵 Precio unitario: ${formatearPrecio(userState.data.producto.precio)}/kg

*Cálculo:*
Subtotal: ${formatearPrecio(calculo.subtotal)}
${calculo.descuento > 0 ? 
`🎉 Descuento (${calculo.porcentaje}%): -${formatearPrecio(calculo.descuento)}
━━━━━━━━━━━━━━━━━━━━━━` : ''}
💰 *TOTAL: ${formatearPrecio(calculo.total)}*

━━━━━━━━━━━━━━━━━━━━━━

*¿Deseas confirmar este pedido?*

Envía *SI* para continuar
Envía *NO* para cancelar
Envía *+* para agregar otro producto`;
                    userState.step = 'confirmar_pedido';
                } else if (!isNaN(cantidad) && cantidad < BUSINESS_CONFIG.delivery_min) {
                    respuesta = `❌ Cantidad mínima: *${BUSINESS_CONFIG.delivery_min} kg*

Has ingresado: ${cantidad} kg

Por favor, ingresa una cantidad de ${BUSINESS_CONFIG.delivery_min}kg o más:`;
                } else {
                    respuesta = `❌ Por favor, ingresa una cantidad válida en números.

_Ejemplo: 10_

Mínimo: ${BUSINESS_CONFIG.delivery_min}kg`;
                }
                break;

            case 'confirmar_pedido':
                if (mensaje.toLowerCase() === 'si' || mensaje.toLowerCase() === 'sí') {
                    respuesta = `👤 *DATOS DEL CLIENTE*

Por favor, ingresa el *nombre de tu empresa o negocio*:`;
                    userState.step = 'datos_empresa';
                } else if (mensaje.toLowerCase() === 'no') {
                    respuesta = `❌ Pedido cancelado.

¿Qué deseas hacer?

*1* - Ver catálogo
*menu* - Menú principal`;
                    userState.step = 'pedido_cancelado';
                } else if (mensaje === '+') {
                    // Guardar producto actual en carrito
                    if (!carritosTemporales.has(from)) {
                        carritosTemporales.set(from, []);
                    }
                    carritosTemporales.get(from).push({
                        producto: userState.data.producto,
                        cantidad: userState.data.cantidad,
                        ...calcularDescuento(userState.data.cantidad, userState.data.producto.precio)
                    });
                    
                    respuesta = `✅ Producto agregado al carrito

*Carrito actual:*
${carritosTemporales.get(from).map((item, index) => 
                        `${index + 1}. ${item.producto.nombre} - ${item.cantidad}kg`
                    ).join('\n')}

*Selecciona otro producto del catálogo:*

Envía el número del producto (1-5)
O escribe *listo* para finalizar el pedido`;
                    
                    userState.step = 'seleccion_producto';
                } else {
                    respuesta = `Por favor, responde:

*SI* - Confirmar pedido
*NO* - Cancelar
*+* - Agregar otro producto`;
                }
                break;

            case 'datos_empresa':
                userState.data.nombreEmpresa = mensaje;
                respuesta = `✅ Empresa: *${mensaje}*

Ahora ingresa el *nombre del contacto*:`;
                userState.step = 'datos_contacto';
                break;

            case 'datos_contacto':
                userState.data.nombreContacto = mensaje;
                respuesta = `✅ Contacto: *${mensaje}*

Ingresa el *número de teléfono* para coordinar la entrega:`;
                userState.step = 'datos_telefono';
                break;

            case 'datos_telefono':
                userState.data.telefono = mensaje;
                respuesta = `✅ Teléfono: *${mensaje}*

Ingresa la *dirección de entrega completa*:

_Incluye distrito, calle y referencia_`;
                userState.step = 'datos_direccion';
                break;

            case 'datos_direccion':
                userState.data.direccion = mensaje;
                respuesta = `✅ Dirección guardada

*MÉTODO DE PAGO*

Selecciona una opción:

*1* - Transferencia bancaria
*2* - Yape/Plin
*3* - Efectivo contra entrega`;
                userState.step = 'metodo_pago';
                break;

            case 'metodo_pago':
                let metodoPago = '';
                switch(mensaje) {
                    case '1':
                        metodoPago = 'Transferencia bancaria';
                        break;
                    case '2':
                        metodoPago = 'Yape/Plin';
                        break;
                    case '3':
                        metodoPago = 'Efectivo contra entrega';
                        break;
                    default:
                        respuesta = `❌ Por favor, selecciona una opción válida:

*1* - Transferencia bancaria
*2* - Yape/Plin
*3* - Efectivo contra entrega`;
                        return respuesta;
                }
                
                userState.data.metodoPago = metodoPago;
                respuesta = `✅ Método de pago: *${metodoPago}*

¿Alguna *observación especial* para tu pedido?

Envía tu comentario o escribe *no*`;
                userState.step = 'observaciones';
                break;

            case 'observaciones':
                if (mensaje.toLowerCase() !== 'no') {
                    userState.data.observaciones = mensaje;
                }
                
                // Generar ID único
                const pedidoId = 'CAF-' + Date.now().toString().slice(-6);
                
                // Consolidar carrito si existe
                let itemsPedido = [];
                if (carritosTemporales.has(from) && carritosTemporales.get(from).length > 0) {
                    itemsPedido = carritosTemporales.get(from);
                    // Agregar el último producto si no está en el carrito
                    if (userState.data.producto) {
                        itemsPedido.push({
                            producto: userState.data.producto,
                            cantidad: userState.data.cantidad,
                            ...calcularDescuento(userState.data.cantidad, userState.data.producto.precio)
                        });
                    }
                } else if (userState.data.producto) {
                    itemsPedido = [{
                        producto: userState.data.producto,
                        cantidad: userState.data.cantidad,
                        subtotal: userState.data.subtotal,
                        descuento: userState.data.descuento,
                        total: userState.data.total
                    }];
                }
                
                // Calcular totales
                const totales = itemsPedido.reduce((acc, item) => ({
                    subtotal: acc.subtotal + item.subtotal,
                    descuento: acc.descuento + item.descuento,
                    total: acc.total + item.total,
                    cantidad: acc.cantidad + item.cantidad
                }), { subtotal: 0, descuento: 0, total: 0, cantidad: 0 });
                
                const pedidoCompleto = {
                    id: pedidoId,
                    fecha: new Date(),
                    items: itemsPedido,
                    totales: totales,
                    empresa: userState.data.nombreEmpresa,
                    contacto: userState.data.nombreContacto,
                    telefono: userState.data.telefono,
                    direccion: userState.data.direccion,
                    metodoPago: userState.data.metodoPago,
                    observaciones: userState.data.observaciones,
                    estado: 'Confirmado',
                    whatsapp: from
                };
                
                pedidosConfirmados.set(pedidoId, pedidoCompleto);
                
                // Limpiar carrito
                carritosTemporales.delete(from);
                
                // Intentar guardar en Google Sheets
                if (googleSheets && googleSheets.initialized) {
                    try {
                        // Guardar cada item como una línea
                        for (const item of itemsPedido) {
                            await googleSheets.agregarPedido({
                                id: pedidoId,
                                nombreNegocio: userState.data.nombreEmpresa,
                                producto: item.producto,
                                cantidad: item.cantidad,
                                subtotal: item.subtotal,
                                descuento: item.descuento,
                                total: item.total,
                                direccion: userState.data.direccion,
                                contacto: `${userState.data.nombreContacto} - ${userState.data.telefono}`,
                                telefono: from,
                                metodoPago: userState.data.metodoPago,
                                observaciones: userState.data.observaciones
                            });
                        }
                        console.log('✅ Pedido guardado en Google Sheets');
                    } catch (error) {
                        console.error('⚠️ Error guardando en Sheets:', error.message);
                    }
                }
                
                // Mensaje de confirmación según método de pago
                let instruccionesPago = '';
                switch(userState.data.metodoPago) {
                    case 'Transferencia bancaria':
                        instruccionesPago = `
*DATOS BANCARIOS:*
Banco: BCP
Cuenta: 123-456789-0-12
CCI: 00212300456789012
Titular: Coffee Express SAC`;
                        break;
                    case 'Yape/Plin':
                        instruccionesPago = `
*YAPE/PLIN:*
Número: ${BUSINESS_CONFIG.phone}
Nombre: Coffee Express`;
                        break;
                    case 'Efectivo contra entrega':
                        instruccionesPago = `
*PAGO CONTRA ENTREGA*
Prepare el monto exacto para el repartidor`;
                        break;
                }

                respuesta = `✅ *¡PEDIDO CONFIRMADO!*
━━━━━━━━━━━━━━━━━━━━━━

📋 *Código:* ${pedidoId}
📅 *Fecha:* ${new Date().toLocaleDateString('es-PE')}

*RESUMEN DEL PEDIDO:*
${itemsPedido.map(item => 
                    `• ${item.producto.nombre}
  ${item.cantidad}kg × ${formatearPrecio(item.producto.precio)} = ${formatearPrecio(item.total)}`
                ).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━
Subtotal: ${formatearPrecio(totales.subtotal)}
${totales.descuento > 0 ? `Descuento: -${formatearPrecio(totales.descuento)}` : ''}
*TOTAL: ${formatearPrecio(totales.total)}*
━━━━━━━━━━━━━━━━━━━━━━

*DATOS DE ENTREGA:*
🏢 ${userState.data.nombreEmpresa}
👤 ${userState.data.nombreContacto}
📱 ${userState.data.telefono}
📍 ${userState.data.direccion}

*MÉTODO DE PAGO:*
${userState.data.metodoPago}
${instruccionesPago}

━━━━━━━━━━━━━━━━━━━━━━
⏰ *Entrega:* 24-48 horas hábiles
📞 *Confirmación:* Te contactaremos pronto

💡 *Guarda tu código ${pedidoId}*

¡Gracias por tu preferencia! ☕

_Escribe *menu* para realizar otro pedido_`;
                
                userState = { step: 'pedido_completado', data: {} };
                break;

            case 'consulta_pedido':
                const pedido = pedidosConfirmados.get(mensaje.toUpperCase());
                if (pedido) {
                    const tiempoTranscurrido = Math.round((new Date() - new Date(pedido.fecha)) / (1000 * 60 * 60));
                    const horasTexto = tiempoTranscurrido < 1 ? 'menos de 1 hora' : `${tiempoTranscurrido} horas`;
                    
                    respuesta = `📦 *ESTADO DEL PEDIDO*
━━━━━━━━━━━━━━━━━━━━━━

📋 *Código:* ${pedido.id}
✅ *Estado:* ${pedido.estado}
⏱️ *Tiempo transcurrido:* ${horasTexto}

*DETALLES:*
🏢 ${pedido.empresa}
📅 ${new Date(pedido.fecha).toLocaleString('es-PE')}
💰 Total: ${formatearPrecio(pedido.totales.total)}
📍 ${pedido.direccion}

*PRODUCTOS:*
${pedido.items.map(item => 
                        `• ${item.producto.nombre} - ${item.cantidad}kg`
                    ).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━
⏰ *Entrega estimada:* 24-48 horas

_Si tienes consultas, escribe *3* para contactar un asesor_`;
                } else {
                    respuesta = `❌ No encontramos el pedido *${mensaje}*

Verifica que el código sea correcto.
_Formato: CAF-123456_

Escribe *menu* para volver`;
                }
                userState.step = 'consulta_completada';
                break;

            case 'esperando_consulta':
                userState.data.consulta = mensaje;
                respuesta = `✅ *Consulta recibida*

Tu mensaje ha sido registrado y será atendido por un asesor en breve.

*Tu consulta:*
"${mensaje}"

Te contactaremos al número registrado en horario de atención.

_Escribe *menu* para volver al menú principal_`;
                
                // Aquí podrías enviar una notificación al equipo de ventas
                console.log(`📧 NUEVA CONSULTA de ${from}: ${mensaje}`);
                
                userState.step = 'consulta_registrada';
                break;

            default:
                // Estados finales o desconocidos
                if (mensaje === '1') {
                    // Shortcut para ver catálogo
                    userState.step = 'menu_principal';
                    return manejarMensaje(from, '1');
                } else {
                    respuesta = `No entendí tu mensaje 😕

*Opciones disponibles:*
• Escribe *menu* para ver el menú
• Escribe *1* para ver el catálogo
• Escribe *hola* para reiniciar

_¿Necesitas ayuda? Escribe *3* para contactar un asesor_`;
                }
        }

        // Guardar estado
        userStates.set(from, userState);
        return respuesta;

    } catch (error) {
        console.error('Error procesando mensaje:', error);
        return `❌ Ocurrió un error procesando tu solicitud.

Por favor, escribe *menu* para reiniciar.

Si el problema persiste, contáctanos directamente:
📱 ${BUSINESS_CONFIG.phone}`;
    }
}

// Resto del código (rutas, etc.) permanece igual...
// [El resto del código se mantiene igual que el anterior]

// Ruta principal con información del modo
app.get('/', (req, res) => {
    const modoActual = DEV_MODE ? 'DESARROLLO' : (twilioConfigured ? 'PRODUCCIÓN' : 'DEMO');
    const twilioStatus = twilioConfigured 
        ? `✅ Configurado (${TWILIO_PHONE_NUMBER})`
        : DEV_MODE 
            ? '🔧 Modo Desarrollo (sin envío real)'
            : '⚠️ No configurado - Modo Demo';
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Coffee Express WhatsApp Bot</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    max-width: 1200px;
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
                h1 { 
                    color: #333; 
                    text-align: center;
                    margin-bottom: 30px;
                }
                .modo-banner {
                    background: ${DEV_MODE ? '#10b981' : '#667eea'};
                    color: white;
                    padding: 15px;
                    border-radius: 5px;
                    text-align: center;
                    font-weight: bold;
                    margin-bottom: 20px;
                }
                .status {
                    background: #f0f0f0;
                    padding: 20px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .status p { 
                    margin: 10px 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin: 20px 0;
                }
                .stat-card {
                    background: #f9fafb;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    border: 1px solid #e5e7eb;
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
                    transition: background 0.3s;
                }
                .button:hover {
                    background: #5a67d8;
                }
                .center {
                    text-align: center;
                    margin-top: 30px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>☕ Coffee Express WhatsApp Bot</h1>
                
                <div class="modo-banner">
                    🔧 MODO: ${modoActual}
                    ${DEV_MODE ? ' - Los mensajes se muestran en consola' : ''}
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Pedidos Totales</h3>
                        <div class="value">${pedidosConfirmados.size}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Conversaciones Activas</h3>
                        <div class="value">${userStates.size}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Carritos Activos</h3>
                        <div class="value">${carritosTemporales.size}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Historial</h3>
                        <div class="value">${conversationHistory.size}</div>
                    </div>
                </div>
                
                <div class="status">
                    <p>📱 WhatsApp: ${twilioStatus}</p>
                    <p>🏢 Negocio: ${BUSINESS_CONFIG.name}</p>
                    <p>📧 Email: ${BUSINESS_CONFIG.email}</p>
                    <p>📊 Google Sheets: ${googleSheets?.initialized ? '✅ Conectado' : '❌ No configurado'}</p>
                    <p>🕒 Uptime: ${Math.floor(process.uptime() / 60)} minutos</p>
                </div>
                
                <div class="center">
                    <a href="/admin" class="button">📊 Panel de Administración</a>
                    <a href="/test" class="button">🧪 Probar Bot</a>
                    <a href="/history" class="button">📜 Ver Historial</a>
                    <a href="/health" class="button">🏥 Health Check</a>
                </div>
                
                ${DEV_MODE ? `
                <div style="margin-top: 30px; padding: 20px; background: #d4f4dd; border-radius: 5px; border: 1px solid #86efac;">
                    <h3>🔧 Modo Desarrollo Activo</h3>
                    <p>• Los mensajes NO se envían por WhatsApp</p>
                    <p>• Las respuestas se muestran en la consola</p>
                    <p>• Perfecto para refinar el flujo sin gastar mensajes</p>
                    <p>• Para desactivar: cambia DEV_MODE=false en .env</p>
                </div>
                ` : ''}
            </div>
        </body>
        </html>
    `);
});

// Nueva ruta para ver el historial de conversaciones
app.get('/history', (req, res) => {
    let historialHTML = '';
    
    conversationHistory.forEach((messages, phone) => {
        historialHTML += `
            <div class="conversation">
                <h3>📱 ${phone}</h3>
                <div class="messages">
        `;
        
        messages.forEach(msg => {
            const isUser = msg.type === 'user';
            historialHTML += `
                <div class="message ${isUser ? 'user' : 'bot'}">
                    <div class="time">${new Date(msg.timestamp).toLocaleTimeString('es-PE')}</div>
                    <div class="content">${msg.message.replace(/\n/g, '<br>').replace(/\*/g, '')}</div>
                </div>
            `;
        });
        
        historialHTML += `
                </div>
            </div>
        `;
    });
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Historial de Conversaciones</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 20px;
                    background: #f5f5f5;
                }
                h1 { text-align: center; color: #333; }
                .conversation {
                    background: white;
                    margin: 20px 0;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                .messages {
                    margin-top: 15px;
                }
                .message {
                    margin: 10px 0;
                    padding: 10px;
                    border-radius: 10px;
                }
                .message.user {
                    background: #667eea;
                    color: white;
                    margin-left: 30%;
                    text-align: right;
                }
                .message.bot {
                    background: #f0f0f0;
                    margin-right: 30%;
                }
                .time {
                    font-size: 11px;
                    opacity: 0.7;
                    margin-bottom: 5px;
                }
                .content {
                    white-space: pre-wrap;
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
            </style>
        </head>
        <body>
            <a href="/" class="back-button">← Volver</a>
            <h1>📜 Historial de Conversaciones</h1>
            ${historialHTML || '<p style="text-align: center;">No hay conversaciones aún</p>'}
        </body>
        </html>
    `);
});

// Webhook de Twilio - MEJORADO PARA MANEJAR IMÁGENES
app.post('/webhook', async (req, res) => {
    const { From, Body, NumMedia, MediaUrl0 } = req.body;
    
    console.log(`📨 Mensaje recibido de ${From}: ${Body}`);
    
    // Verificar si hay imágenes adjuntas
    let mediaUrl = null;
    if (NumMedia && parseInt(NumMedia) > 0 && MediaUrl0) {
        mediaUrl = MediaUrl0;
        console.log(`📷 Imagen recibida: ${mediaUrl}`);
    }
    
    try {
        // Pasar la URL de la imagen al manejador de mensajes
        const respuesta = await manejarMensaje(From, Body, mediaUrl);
        await enviarMensaje(From, respuesta);
        res.status(200).send('OK');
    } catch (error) {
        console.error('Error en webhook:', error);
        res.status(200).send('OK'); // Siempre responder 200 a Twilio
    }
});

// Página de prueba mejorada
app.get('/test', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Probar Bot - Coffee Express</title>
            <meta charset="utf-8">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
            </style>
        </head>
        <body>
            <h1>🧪 Probar Bot - ${DEV_MODE ? 'Modo Desarrollo' : 'Modo Test'}</h1>
            
            <div class="chat-container" id="chat">
                <div class="message bot">Hola 👋 

Soy el asistente virtual de <strong>Coffee Express</strong>

Escribe <strong>hola</strong> para comenzar o usa las sugerencias rápidas abajo.</div>
            </div>
            
            <div class="suggestions">
                <span class="suggestion" onclick="enviarSugerencia('hola')">👋 Hola</span>
                <span class="suggestion" onclick="enviarSugerencia('1')">Ver catálogo</span>
                <span class="suggestion" onclick="enviarSugerencia('2')">Consultar pedido</span>
                <span class="suggestion" onclick="enviarSugerencia('menu')">📱 Menú</span>
                <span class="suggestion" onclick="enviarSugerencia('5')">5 kg</span>
                <span class="suggestion" onclick="enviarSugerencia('50')">50 kg</span>
                <span class="suggestion" onclick="enviarSugerencia('si')">SI</span>
                <span class="suggestion" onclick="enviarSugerencia('no')">NO</span>
                <span class="suggestion" onclick="enviarSugerencia('info 1')">Info producto</span>
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
                    chat.innerHTML += '<div class="message user">' + mensaje + '</div>';
                    input.value = '';
                    
                    // Enviar al servidor
                    try {
                        const response = await fetch('/test-message', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ from: userPhone, body: mensaje })
                        });
                        
                        const data = await response.json();
                        
                        // Mostrar respuesta del bot con formato
                        let formattedResponse = data.response
                            .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
                            .replace(/_([^_]+)_/g, '<em>$1</em>');
                            
                        chat.innerHTML += '<div class="message bot">' + formattedResponse + '</div>';
                    } catch (error) {
                        chat.innerHTML += '<div class="message bot">❌ Error: ' + error.message + '</div>';
                    }
                    
                    chat.scrollTop = chat.scrollHeight;
                }
                
                function enviarSugerencia(texto) {
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
    `);
});

// Endpoint de prueba
app.post('/test-message', async (req, res) => {
    const { from, body } = req.body;
    const response = await manejarMensaje(from, body);
    res.json({ response });
});

// Panel de administración mejorado
app.get('/admin', (req, res) => {
    const pedidosArray = Array.from(pedidosConfirmados.values());
    const totalVentas = pedidosArray.reduce((sum, p) => sum + (p.totales?.total || 0), 0);
    const totalKilos = pedidosArray.reduce((sum, p) => sum + (p.totales?.cantidad || 0), 0);
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Panel Admin - Coffee Express</title>
            <meta charset="utf-8">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: #f5f5f5;
                }
                h1 {
                    color: #333;
                }
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
                .empty {
                    text-align: center;
                    padding: 40px;
                    color: #666;
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
                .modo-dev {
                    background: #10b981;
                    color: white;
                    padding: 10px;
                    border-radius: 5px;
                    text-align: center;
                    margin-bottom: 20px;
                }
                .productos-list {
                    font-size: 12px;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <a href="/" class="back-button">← Volver</a>
            
            ${DEV_MODE ? '<div class="modo-dev">🔧 MODO DESARROLLO ACTIVO</div>' : ''}
            
            <h1>☕ Panel de Administración</h1>
            
            <div class="stats">
                <div class="stat-card">
                    <h3>Total Pedidos</h3>
                    <div class="value">${pedidosArray.length}</div>
                </div>
                <div class="stat-card">
                    <h3>Pedidos Hoy</h3>
                    <div class="value">${pedidosArray.filter(p => 
                        new Date(p.fecha).toDateString() === new Date().toDateString()
                    ).length}</div>
                </div>
                <div class="stat-card">
                    <h3>Total Ventas</h3>
                    <div class="value">S/${totalVentas.toFixed(2)}</div>
                </div>
                <div class="stat-card">
                    <h3>Kg Vendidos</h3>
                    <div class="value">${totalKilos} kg</div>
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
                        <th>Productos</th>
                        <th>Total kg</th>
                        <th>Total S/</th>
                        <th>Método Pago</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${pedidosArray.length > 0 ? pedidosArray.reverse().map(p => `
                        <tr>
                            <td><strong>${p.id}</strong></td>
                            <td>${new Date(p.fecha).toLocaleString('es-PE')}</td>
                            <td><strong>${p.empresa || '-'}</strong></td>
                            <td>${p.contacto || '-'}<br>${p.telefono || '-'}</td>
                            <td class="productos-list">
                                ${p.items ? p.items.map(item => 
                                    `${item.producto.nombre} (${item.cantidad}kg)`
                                ).join('<br>') : '-'}
                            </td>
                            <td>${p.totales?.cantidad || 0} kg</td>
                            <td><strong>S/${p.totales?.total?.toFixed(2) || '0.00'}</strong></td>
                            <td>${p.metodoPago || '-'}</td>
                            <td><span style="color: green;">✓ ${p.estado}</span></td>
                        </tr>
                    `).join('') : '<tr><td colspan="9" class="empty">No hay pedidos aún. Prueba el bot para generar pedidos de prueba.</td></tr>'}
                </tbody>
            </table>
        </body>
        </html>
    `);
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        mode: DEV_MODE ? 'development' : 'production',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        twilio: twilioConfigured ? 'configured' : 'not configured',
        googleSheets: googleSheets?.initialized ? 'connected' : 'not configured',
        pedidos: pedidosConfirmados.size,
        conversaciones: userStates.size,
        carritos: carritosTemporales.size
    });
});

// Puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`
    ☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕
    🚀 Bot de WhatsApp iniciado - v2.0 Profesional
    📍 Puerto: ${PORT}
    🌐 URL: http://localhost:${PORT}
    📱 Webhook: /webhook
    🔧 Admin: /admin
    🧪 Test: /test
    📜 Historial: /history
    ⚙️ Modo: ${DEV_MODE ? '🔧 DESARROLLO' : (twilioConfigured ? '✅ PRODUCCIÓN' : '⚠️ DEMO')}
    ☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕
    `);
    
    if (DEV_MODE) {
        console.log(`
    🔧 MODO DESARROLLO ACTIVO
    ========================
    Los mensajes NO se enviarán por WhatsApp
    Las respuestas se mostrarán en la consola
    Perfecto para refinar el flujo sin límites
    
    Para cambiar a producción: DEV_MODE=false
    `);
    }
});

module.exports = app;
