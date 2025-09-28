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
    console.log('   Para activarlo, configura GOOGLE_SPREADSHEET_ID y GOOGLE_SERVICE_ACCOUNT_KEY');
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

// Configuración del negocio
const BUSINESS_CONFIG = {
    name: process.env.BUSINESS_NAME || "Coffee Express",
    phone: process.env.BUSINESS_PHONE || "+51987654321",
    email: process.env.BUSINESS_EMAIL || "ventas@coffeeexpress.com",
    horario: "Lun-Sab 8:00-18:00",
    delivery_min: 5
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
function obtenerMenu(userState) {
    let headerPedido = '';
    
    // Si hay un pedido en proceso, mostrarlo en el header
    if (userState.data && userState.data.producto) {
        const cantidadStr = userState.data.cantidad ? `${userState.data.cantidad}kg` : 'cantidad por definir';
        const totalStr = userState.data.total ? formatearPrecio(userState.data.total) : 'por calcular';
        
        headerPedido = `🛒 *PEDIDO ACTUAL:*
━━━━━━━━━━━━━━━━━
📦 ${userState.data.producto.nombre}
⚖️ Cantidad: ${cantidadStr}
💰 Total: ${totalStr}
━━━━━━━━━━━━━━━━━

💡 _Escribe *cancelar* para eliminar el pedido_

`;
    }
    
    return `${headerPedido}📱 *MENÚ PRINCIPAL*

*1* - Ver catálogo y pedir ☕
*2* - Consultar pedido 📦
*3* - Información del negocio ℹ️

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
            respuesta = obtenerMenu(userState);
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
            respuesta = `${mensajeCancelacion}📱 *MENÚ PRINCIPAL*

*1* - Ver catálogo y pedir ☕
*2* - Consultar pedido 📦
*3* - Información del negocio ℹ️

Envía el número de tu elección`;
            userStates.set(from, userState);
            return respuesta;
        }

        // Flujo principal
        switch (userState.step) {
            case 'inicio':
                // Acceso directo con números
                if (['1', '2', '3'].includes(mensaje)) {
                    userState.step = 'menu_principal';
                    userStates.set(from, userState);
                    return manejarMensaje(from, mensaje);
                }
                
                // Acceso con saludos
                if (mensaje.toLowerCase().includes('hola') || 
                    mensaje.toLowerCase().includes('buenas') ||
                    mensaje.toLowerCase().includes('buenos') ||
                    mensaje.toLowerCase() === 'menu' ||
                    mensaje.toLowerCase() === 'menú') {
                    
                    respuesta = obtenerMenu(userState);
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
                switch (mensaje) {
                    case '1':
                        // Mostrar si hay pedido actual antes del catálogo
                        let headerCatalogo = '';
                        if (userState.data && userState.data.producto) {
                            headerCatalogo = `⚠️ *Tienes un pedido en proceso*
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

*Métodos de pago:*
💳 Transferencia bancaria
💵 Yape/Plin
💰 Efectivo contra entrega

Escribe *menu* para volver`;
                        userState.step = 'info_mostrada';
                        break;

                    default:
                        respuesta = `Por favor, envía un número válido:

*1* - Ver catálogo
*2* - Consultar pedido
*3* - Información`;
                }
                break;

            case 'seleccion_producto':
                if (PRODUCTOS[mensaje]) {
                    const producto = PRODUCTOS[mensaje];
                    
                    // Si había un producto anterior, mencionar el cambio
                    let mensajeCambio = '';
                    if (userState.data && userState.data.producto && userState.data.producto.id !== producto.id) {
                        mensajeCambio = `_Cambiando de ${userState.data.producto.nombre} a ${producto.nombre}_\n\n`;
                    }
                    
                    userState.data.producto = producto;
                    // Limpiar cantidad y total anteriores al cambiar producto
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
                    respuesta = `👤 *DATOS DEL CLIENTE*

Por favor, ingresa el *nombre de tu empresa o negocio*:`;
                    userState.step = 'datos_empresa';
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
                let instruccionesPago = '';
                
                switch(mensaje) {
                    case '1':
                        metodoPago = 'Transferencia bancaria';
                        instruccionesPago = `
*DATOS BANCARIOS:*
Banco: BCP
Cuenta: 123-456789-0-12
Titular: Coffee Express SAC`;
                        break;
                    case '2':
                        metodoPago = 'Yape/Plin';
                        instruccionesPago = `
*YAPE/PLIN:*
Número: ${BUSINESS_CONFIG.phone}
Nombre: Coffee Express`;
                        break;
                    case '3':
                        metodoPago = 'Efectivo contra entrega';
                        instruccionesPago = `
*PAGO CONTRA ENTREGA*
Prepare el monto exacto`;
                        break;
                    default:
                        respuesta = `❌ Por favor, selecciona una opción válida:

*1* - Transferencia
*2* - Yape/Plin
*3* - Efectivo`;
                        return respuesta;
                }
                
                userState.data.metodoPago = metodoPago;
                
                // Generar ID único
                const pedidoId = 'CAF-' + Date.now().toString().slice(-6);
                
                const pedidoCompleto = {
                    id: pedidoId,
                    fecha: new Date(),
                    producto: userState.data.producto,
                    cantidad: userState.data.cantidad,
                    total: userState.data.total,
                    empresa: userState.data.empresa,
                    contacto: userState.data.contacto,
                    telefono: userState.data.telefono,
                    direccion: userState.data.direccion,
                    metodoPago: metodoPago,
                    estado: 'Confirmado'
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
                            metodoPago: metodoPago,
                            observaciones: '',
                            estado: 'Confirmado'
                        });
                        console.log('✅ Pedido guardado en Google Sheets');
                    } catch (error) {
                        console.error('⚠️ Error guardando en Google Sheets:', error.message);
                    }
                }

                respuesta = `✅ *¡PEDIDO CONFIRMADO!*
━━━━━━━━━━━━━━━━━

📋 *Código:* ${pedidoId}
📅 *Fecha:* ${new Date().toLocaleDateString('es-PE')}

*RESUMEN:*
📦 ${userState.data.producto.nombre}
⚖️ ${userState.data.cantidad}kg
💰 *Total: ${formatearPrecio(userState.data.total)}*

*CLIENTE:*
🏢 ${userState.data.empresa}
👤 ${userState.data.contacto}
📱 ${userState.data.telefono}
📍 ${userState.data.direccion}

*PAGO:* ${metodoPago}
${instruccionesPago}

━━━━━━━━━━━━━━━━━
⏰ *Entrega:* 24-48 horas
📞 Te contactaremos pronto

💡 *Guarda tu código ${pedidoId}*

¡Gracias por tu compra! ☕

_Escribe *menu* para nuevo pedido_`;
                
                userState = { step: 'pedido_completado', data: {} };
                break;

            case 'consulta_pedido':
                const pedido = pedidosConfirmados.get(mensaje.toUpperCase());
                if (pedido) {
                    const tiempoTranscurrido = Math.round((new Date() - new Date(pedido.fecha)) / (1000 * 60 * 60));
                    const horasTexto = tiempoTranscurrido < 1 ? 'menos de 1 hora' : `${tiempoTranscurrido} horas`;
                    
                    respuesta = `📦 *ESTADO DEL PEDIDO*

📋 *Código:* ${pedido.id}
✅ *Estado:* ${pedido.estado}
⏱️ *Registrado hace:* ${horasTexto}

*DETALLES:*
🏢 ${pedido.empresa}
📦 ${pedido.producto.nombre}
⚖️ ${pedido.cantidad}kg
💰 Total: ${formatearPrecio(pedido.total)}
📍 ${pedido.direccion}

━━━━━━━━━━━━━━━━━
⏰ *Entrega estimada:* 24-48 horas

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
                        <h3>Conversaciones</h3>
                        <div class="value">${userStates.size}</div>
                    </div>
                </div>
                
                <div class="status">
                    <p>🔧 Modo: ${DEV_MODE ? 'DESARROLLO' : 'PRODUCCIÓN'}</p>
                    <p>📱 WhatsApp: ${twilioConfigured ? '✅ Configurado' : '⚠️ No configurado'}</p>
                    <p>📊 Google Sheets: ${sheetsConfigured ? '✅ Conectado' : '⚠️ No configurado'}</p>
                    <p>🏢 Negocio: ${BUSINESS_CONFIG.name}</p>
                    <p>📧 Email: ${BUSINESS_CONFIG.email}</p>
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

// Servir la página de prueba
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
    </style>
</head>
<body>
    <h1>🧪 Probar Bot - Modo Desarrollo</h1>
    
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
        <span class="suggestion" onclick="enviarTexto('menu')">📱 Menú</span>
        <span class="suggestion" onclick="enviarTexto('10')">10 kg</span>
        <span class="suggestion" onclick="enviarTexto('si')">SI</span>
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
    const { From, Body } = req.body;
    
    console.log(`📨 Mensaje recibido de ${From}: ${Body}`);
    
    try {
        const respuesta = await manejarMensaje(From, Body);
        await enviarMensaje(From, respuesta);
        res.status(200).send('OK');
    } catch (error) {
        console.error('Error en webhook:', error);
        res.status(200).send('OK');
    }
});

// Panel admin
app.get('/admin', (req, res) => {
    const pedidos = Array.from(pedidosConfirmados.values());
    const totalVentas = pedidos.reduce((sum, p) => sum + p.total, 0);
    const totalKilos = pedidos.reduce((sum, p) => sum + p.cantidad, 0);
    
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
                    <h3>Pedidos Hoy</h3>
                    <div class="value">${pedidos.filter(p => 
                        new Date(p.fecha).toDateString() === new Date().toDateString()
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
                        <th>Método Pago</th>
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
                            <td>${p.metodoPago || '-'}</td>
                            <td style="color: green;">✓ ${p.estado}</td>
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
    🚀 Bot de WhatsApp iniciado - v3.0 Con Pedido Actual
    📍 Puerto: ${PORT}
    🌐 URL: http://localhost:${PORT}
    📱 Webhook: /webhook
    🔧 Test: /test
    📊 Admin: /admin
    ⚙️ Modo: ${DEV_MODE ? '🔧 DESARROLLO' : '✅ PRODUCCIÓN'}
    ☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕
    
    ${DEV_MODE ? '💡 Los mensajes se mostrarán en la consola\n' : ''}
    
    🆕 NUEVA FUNCIONALIDAD:
    - El menú muestra el pedido actual en proceso
    - Comando "cancelar" para eliminar el pedido
    - El pedido se mantiene al navegar por el menú
    `);
});

module.exports = app;
