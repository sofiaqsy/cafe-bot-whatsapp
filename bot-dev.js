const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

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

// Historial de conversaciones para modo dev
const conversationHistory = new Map();

// Configuración del negocio
const BUSINESS_CONFIG = {
    name: process.env.BUSINESS_NAME || "Coffee Express",
    phone: process.env.BUSINESS_PHONE || "+51987654321",
    email: process.env.BUSINESS_EMAIL || "ventas@coffeeexpress.com"
};

// Productos disponibles
const PRODUCTOS = {
    premium: {
        id: 'premium',
        nombre: 'Café Arábica Premium',
        precio: 50,
        origen: 'Chanchamayo, Junín',
        keywords: ['1', 'premium', 'arabica premium']
    },
    estandar: {
        id: 'estandar',
        nombre: 'Café Arábica Estándar',
        precio: 40,
        origen: 'Satipo, Junín',
        keywords: ['2', 'estandar', 'standard']
    },
    organico: {
        id: 'organico',
        nombre: 'Café Orgánico Certificado',
        precio: 60,
        origen: 'Villa Rica, Pasco',
        keywords: ['3', 'organico', 'organic']
    },
    mezcla: {
        id: 'mezcla',
        nombre: 'Mezcla Especial Cafeterías',
        precio: 35,
        origen: 'Blend peruano',
        keywords: ['4', 'mezcla', 'blend']
    },
    descafeinado: {
        id: 'descafeinado',
        nombre: 'Café Descafeinado Suave',
        precio: 45,
        origen: 'Cusco',
        keywords: ['5', 'descafeinado', 'suave']
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

// Función para detectar producto
function detectarProducto(mensaje) {
    const msgLower = mensaje.toLowerCase();
    
    for (const [key, producto] of Object.entries(PRODUCTOS)) {
        for (const keyword of producto.keywords) {
            if (msgLower.includes(keyword)) {
                return producto;
            }
        }
    }
    return null;
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
        switch (userState.step) {
            case 'inicio':
                if (mensaje.toLowerCase().includes('hola')) {
                    respuesta = `☕ ¡Bienvenido a ${BUSINESS_CONFIG.name}!

¿En qué podemos ayudarte hoy?

1️⃣ Ver catálogo de productos
2️⃣ Hacer un pedido
3️⃣ Consultar estado de pedido
4️⃣ Información de contacto
5️⃣ Hablar con un asesor

Escribe el número de tu opción 👆`;
                    userState.step = 'menu_principal';
                } else {
                    respuesta = '¡Hola! 👋 Escribe "hola" para comenzar.';
                }
                break;

            case 'menu_principal':
                switch (mensaje) {
                    case '1':
                        respuesta = `📋 CATÁLOGO DE CAFÉ EN GRANO

1️⃣ Café Arábica Premium - S/50/kg
   📍 Origen: Chanchamayo
   🌟 Notas: Chocolate y frutos rojos

2️⃣ Café Arábica Estándar - S/40/kg
   📍 Origen: Satipo
   🌟 Notas: Caramelo y nueces

3️⃣ Café Orgánico Certificado - S/60/kg
   📍 Origen: Villa Rica
   🌟 Notas: Floral y cítrico

4️⃣ Mezcla Especial - S/35/kg
   📍 Blend peruano
   🌟 Notas: Equilibrado y suave

5️⃣ Café Descafeinado - S/45/kg
   📍 Origen: Cusco
   🌟 Notas: Suave y aromático

💰 Descuento del 10% en pedidos mayores a 50kg

¿Deseas hacer un pedido? Escribe "sí" o "menú" para volver.`;
                        userState.step = 'viendo_catalogo';
                        break;

                    case '2':
                        respuesta = '📝 NUEVO PEDIDO\n\n¿Cuál es el nombre de tu cafetería o negocio?';
                        userState.step = 'pedido_nombre';
                        break;

                    case '3':
                        respuesta = '🔍 CONSULTAR PEDIDO\n\nPor favor, ingresa el ID de tu pedido (ej: CAF-123456):';
                        userState.step = 'consulta_pedido';
                        break;

                    case '4':
                        respuesta = `📞 INFORMACIÓN DE CONTACTO

🏢 ${BUSINESS_CONFIG.name}
📱 WhatsApp: ${BUSINESS_CONFIG.phone}
📧 Email: ${BUSINESS_CONFIG.email}
🕒 Horario: Lun-Sab 8:00-18:00
📍 Lima, Perú

Escribe "menú" para volver al menú principal.`;
                        userState.step = 'info_mostrada';
                        break;

                    case '5':
                        respuesta = `💬 CONTACTO CON ASESOR

Un asesor se comunicará contigo pronto.
Mientras tanto, puedes escribir tu consulta aquí y la procesaremos.

¿Cuál es tu consulta?`;
                        userState.step = 'esperando_consulta';
                        break;

                    default:
                        respuesta = '❌ Por favor, selecciona una opción válida (1-5).';
                }
                break;

            case 'viendo_catalogo':
                if (mensaje.toLowerCase().includes('sí') || mensaje.toLowerCase().includes('si')) {
                    respuesta = '📝 NUEVO PEDIDO\n\n¿Cuál es el nombre de tu cafetería o negocio?';
                    userState.step = 'pedido_nombre';
                } else if (mensaje.toLowerCase().includes('menú') || mensaje.toLowerCase().includes('menu')) {
                    respuesta = `📱 MENÚ PRINCIPAL

1️⃣ Catálogo | 2️⃣ Pedido | 3️⃣ Consultar | 4️⃣ Info | 5️⃣ Asesor

Selecciona una opción:`;
                    userState.step = 'menu_principal';
                } else {
                    respuesta = 'Por favor, escribe "sí" para hacer un pedido o "menú" para volver.';
                }
                break;

            case 'pedido_nombre':
                userState.data.nombreNegocio = mensaje;
                respuesta = `Perfecto, ${mensaje}. 

¿Qué producto deseas pedir?

1️⃣ Premium (S/50/kg)
2️⃣ Estándar (S/40/kg) 
3️⃣ Orgánico (S/60/kg)
4️⃣ Mezcla (S/35/kg)
5️⃣ Descafeinado (S/45/kg)

Escribe el número o nombre del producto:`;
                userState.step = 'pedido_producto';
                break;

            case 'pedido_producto':
                const producto = detectarProducto(mensaje);
                if (producto) {
                    userState.data.producto = producto;
                    respuesta = `✅ Has seleccionado: ${producto.nombre}
💰 Precio: S/${producto.precio}/kg
📍 Origen: ${producto.origen}

¿Cuántos kilos deseas? (mínimo 5kg)`;
                    userState.step = 'pedido_cantidad';
                } else {
                    respuesta = '❌ Por favor, selecciona un producto válido (1-5) o escribe el nombre.';
                }
                break;

            case 'pedido_cantidad':
                const cantidad = parseFloat(mensaje);
                if (!isNaN(cantidad) && cantidad >= 5) {
                    userState.data.cantidad = cantidad;
                    const subtotal = cantidad * userState.data.producto.precio;
                    const descuento = cantidad >= 50 ? subtotal * 0.1 : 0;
                    const total = subtotal - descuento;
                    
                    userState.data.subtotal = subtotal;
                    userState.data.descuento = descuento;
                    userState.data.total = total;

                    respuesta = `📊 RESUMEN DEL PEDIDO
${'-'.repeat(30)}
📦 Producto: ${userState.data.producto.nombre}
⚖️ Cantidad: ${cantidad}kg
💵 Precio unitario: S/${userState.data.producto.precio}/kg
${'-'.repeat(30)}
Subtotal: S/${subtotal.toFixed(2)}
${descuento > 0 ? `🎉 Descuento (10%): -S/${descuento.toFixed(2)}` : ''}
${'-'.repeat(30)}
💰 TOTAL: S/${total.toFixed(2)}

📍 ¿Cuál es la dirección de entrega?`;
                    userState.step = 'pedido_direccion';
                } else if (!isNaN(cantidad) && cantidad < 5) {
                    respuesta = `❌ El pedido mínimo es de 5kg. 
Has ingresado ${cantidad}kg.

Por favor, ingresa una cantidad de 5kg o más:`;
                } else {
                    respuesta = '❌ Por favor, ingresa una cantidad válida en números (mínimo 5kg).';
                }
                break;

            case 'pedido_direccion':
                userState.data.direccion = mensaje;
                respuesta = '📱 ¿Número de teléfono para coordinar la entrega?';
                userState.step = 'pedido_contacto';
                break;

            case 'pedido_contacto':
                userState.data.contacto = mensaje;
                respuesta = '✉️ ¿Alguna observación especial para tu pedido? (opcional)\n\nEscribe tu observación o "no" si no tienes ninguna:';
                userState.step = 'pedido_observaciones';
                break;

            case 'pedido_observaciones':
                if (mensaje.toLowerCase() !== 'no') {
                    userState.data.observaciones = mensaje;
                }
                
                const pedidoId = 'CAF-' + Date.now().toString().slice(-6);
                
                const pedidoCompleto = {
                    ...userState.data,
                    id: pedidoId,
                    fecha: new Date(),
                    estado: 'Confirmado',
                    telefono: from
                };
                
                pedidosConfirmados.set(pedidoId, pedidoCompleto);
                
                // Intentar guardar en Google Sheets si está configurado
                if (googleSheets && googleSheets.initialized) {
                    try {
                        await googleSheets.agregarPedido(pedidoCompleto);
                        console.log('✅ Pedido guardado en Google Sheets');
                    } catch (error) {
                        console.error('⚠️ Error guardando en Google Sheets:', error.message);
                    }
                }

                respuesta = `✅ ¡PEDIDO CONFIRMADO!
${'='.repeat(35)}

📋 ID de pedido: ${pedidoId}
📅 Fecha: ${new Date().toLocaleDateString('es-PE')}

DETALLES DEL PEDIDO:
${'-'.repeat(35)}
🏪 Cliente: ${userState.data.nombreNegocio}
☕ Producto: ${userState.data.producto.nombre}
⚖️ Cantidad: ${userState.data.cantidad}kg
💰 Total a pagar: S/${userState.data.total.toFixed(2)}
${userState.data.descuento > 0 ? '🎉 Descuento aplicado: 10%' : ''}

ENTREGA:
${'-'.repeat(35)}
📍 Dirección: ${userState.data.direccion}
📱 Contacto: ${userState.data.contacto}
${userState.data.observaciones ? `📝 Observaciones: ${userState.data.observaciones}` : ''}
⏰ Tiempo estimado: 24-48 horas

${'='.repeat(35)}
💡 Guarda tu ID ${pedidoId} para seguimiento

¡Gracias por tu compra! ☕

Escribe "menú" para volver al inicio o "salir" para terminar.`;
                
                userState = { step: 'pedido_completado', data: {} };
                break;

            case 'consulta_pedido':
                const pedido = pedidosConfirmados.get(mensaje.toUpperCase());
                if (pedido) {
                    const tiempoTranscurrido = Math.round((new Date() - new Date(pedido.fecha)) / (1000 * 60));
                    respuesta = `📦 ESTADO DEL PEDIDO ${pedido.id}
${'-'.repeat(35)}

Estado actual: ✅ ${pedido.estado}
Tiempo transcurrido: ${tiempoTranscurrido} minutos

DETALLES:
${'-'.repeat(35)}
📅 Fecha: ${new Date(pedido.fecha).toLocaleString('es-PE')}
🏪 Cliente: ${pedido.nombreNegocio}
☕ Producto: ${pedido.producto.nombre}
⚖️ Cantidad: ${pedido.cantidad}kg
💰 Total: S/${pedido.total.toFixed(2)}
📍 Dirección: ${pedido.direccion}

⏰ Entrega estimada: 24-48 horas

Escribe "menú" para volver.`;
                } else {
                    respuesta = `❌ No encontramos el pedido ${mensaje}.

Verifica que el ID esté correcto o escribe "menú" para volver.

💡 El formato del ID es: CAF-123456`;
                }
                userState.step = 'consulta_completada';
                break;

            case 'esperando_consulta':
                userState.data.consulta = mensaje;
                respuesta = `✅ Consulta recibida

Tu mensaje ha sido registrado:
"${mensaje}"

Un asesor se comunicará contigo pronto al número registrado.

Escribe "menú" para volver al menú principal.`;
                userState.step = 'consulta_registrada';
                break;

            default:
                if (mensaje.toLowerCase().includes('menú') || mensaje.toLowerCase().includes('menu')) {
                    respuesta = `📱 MENÚ PRINCIPAL

1️⃣ Catálogo | 2️⃣ Pedido | 3️⃣ Consultar | 4️⃣ Info | 5️⃣ Asesor

Selecciona una opción:`;
                    userState.step = 'menu_principal';
                } else if (mensaje.toLowerCase() === 'salir') {
                    respuesta = `👋 ¡Gracias por contactarnos!

${BUSINESS_CONFIG.name} agradece tu preferencia.

Para volver a comenzar, escribe "hola" cuando quieras. ☕`;
                    userState = { step: 'inicio', data: {} };
                } else {
                    respuesta = `No entendí tu mensaje. 

Opciones disponibles:
• Escribe "menú" para ver opciones
• Escribe "hola" para reiniciar
• Escribe "salir" para terminar`;
                }
        }

        // Guardar estado
        userStates.set(from, userState);

        return respuesta;
    } catch (error) {
        console.error('Error procesando mensaje:', error);
        return '❌ Ocurrió un error. Por favor, escribe "menú" para reiniciar.';
    }
}

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
                    <div class="content">${msg.message.replace(/\n/g, '<br>')}</div>
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
                <div class="message bot">¡Hola! 👋 Soy el bot de Coffee Express. 
                
Escribe "hola" para comenzar o usa las sugerencias rápidas abajo.</div>
            </div>
            
            <div class="suggestions">
                <span class="suggestion" onclick="enviarSugerencia('hola')">👋 Hola</span>
                <span class="suggestion" onclick="enviarSugerencia('1')">1️⃣</span>
                <span class="suggestion" onclick="enviarSugerencia('2')">2️⃣</span>
                <span class="suggestion" onclick="enviarSugerencia('menú')">📱 Menú</span>
                <span class="suggestion" onclick="enviarSugerencia('5')">5 kg</span>
                <span class="suggestion" onclick="enviarSugerencia('50')">50 kg</span>
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
                        
                        // Mostrar respuesta del bot
                        chat.innerHTML += '<div class="message bot">' + data.response + '</div>';
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
    const totalVentas = pedidosArray.reduce((sum, p) => sum + (p.total || 0), 0);
    const totalKilos = pedidosArray.reduce((sum, p) => sum + (p.cantidad || 0), 0);
    
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
                        <th>Cliente</th>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Descuento</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Dirección</th>
                    </tr>
                </thead>
                <tbody>
                    ${pedidosArray.length > 0 ? pedidosArray.reverse().map(p => `
                        <tr>
                            <td><strong>${p.id}</strong></td>
                            <td>${new Date(p.fecha).toLocaleString('es-PE')}</td>
                            <td>${p.nombreNegocio}</td>
                            <td>${p.producto.nombre}</td>
                            <td>${p.cantidad}kg</td>
                            <td>${p.descuento > 0 ? '10%' : '-'}</td>
                            <td><strong>S/${p.total.toFixed(2)}</strong></td>
                            <td><span style="color: green;">✓ ${p.estado}</span></td>
                            <td>${p.direccion}</td>
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
        conversaciones: userStates.size
    });
});

// Puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`
    ☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕
    🚀 Bot de WhatsApp iniciado
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
