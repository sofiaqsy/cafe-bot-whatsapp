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

// Inicializar Twilio solo si hay credenciales
let client = null;
let twilioConfigured = false;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    try {
        const twilio = require('twilio');
        client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        twilioConfigured = true;
        console.log('✅ Twilio configurado correctamente');
    } catch (error) {
        console.error('⚠️ Error configurando Twilio:', error.message);
        twilioConfigured = false;
    }
} else {
    console.log('⚠️ Twilio no configurado - Ejecutando en modo demo');
    console.log('   Configura TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN para activar WhatsApp');
}

// Estado de conversaciones
const userStates = new Map();
const pedidosConfirmados = new Map();

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

    console.log(`📩 De: ${from} | Mensaje: "${mensaje}" | Estado: ${userState.step}`);

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

2️⃣ Café Arábica Estándar - S/40/kg
   📍 Origen: Satipo

3️⃣ Café Orgánico Certificado - S/60/kg
   📍 Origen: Villa Rica

4️⃣ Mezcla Especial - S/35/kg
   📍 Blend peruano

5️⃣ Café Descafeinado - S/45/kg
   📍 Origen: Cusco

💰 Descuento del 10% en pedidos mayores a 50kg

¿Deseas hacer un pedido? Escribe "sí" o "menú" para volver.`;
                        userState.step = 'viendo_catalogo';
                        break;

                    case '2':
                        respuesta = '¿Cuál es el nombre de tu cafetería o negocio?';
                        userState.step = 'pedido_nombre';
                        break;

                    case '3':
                        respuesta = 'Por favor, ingresa el ID de tu pedido (ej: CAF-123456):';
                        userState.step = 'consulta_pedido';
                        break;

                    case '4':
                        respuesta = `📞 INFORMACIÓN DE CONTACTO

🏢 ${BUSINESS_CONFIG.name}
📱 WhatsApp: ${BUSINESS_CONFIG.phone}
📧 Email: ${BUSINESS_CONFIG.email}
🕒 Horario: Lun-Sab 8:00-18:00

Escribe "menú" para volver al menú principal.`;
                        userState.step = 'info_mostrada';
                        break;

                    case '5':
                        respuesta = `Un asesor se comunicará contigo pronto.
Mientras tanto, puedes escribir tu consulta y la procesaremos.`;
                        userState.step = 'esperando_consulta';
                        break;

                    default:
                        respuesta = 'Por favor, selecciona una opción válida (1-5).';
                }
                break;

            case 'pedido_nombre':
                userState.data.nombreNegocio = mensaje;
                respuesta = `Perfecto, ${mensaje}. 

¿Qué producto deseas pedir?
1️⃣ Premium | 2️⃣ Estándar | 3️⃣ Orgánico | 4️⃣ Mezcla | 5️⃣ Descafeinado`;
                userState.step = 'pedido_producto';
                break;

            case 'pedido_producto':
                const producto = detectarProducto(mensaje);
                if (producto) {
                    userState.data.producto = producto;
                    respuesta = `Has seleccionado: ${producto.nombre}
Precio: S/${producto.precio}/kg

¿Cuántos kilos deseas? (mínimo 5kg)`;
                    userState.step = 'pedido_cantidad';
                } else {
                    respuesta = 'Por favor, selecciona un producto válido (1-5).';
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

                    respuesta = `📊 RESUMEN DEL PEDIDO:
${userState.data.producto.nombre}
Cantidad: ${cantidad}kg
Subtotal: S/${subtotal}
${descuento > 0 ? `Descuento (10%): -S/${descuento}` : 'Sin descuento'}
TOTAL: S/${total}

¿Cuál es la dirección de entrega?`;
                    userState.step = 'pedido_direccion';
                } else {
                    respuesta = 'Por favor, ingresa una cantidad válida (mínimo 5kg).';
                }
                break;

            case 'pedido_direccion':
                userState.data.direccion = mensaje;
                respuesta = '¿Número de contacto para la entrega?';
                userState.step = 'pedido_contacto';
                break;

            case 'pedido_contacto':
                userState.data.contacto = mensaje;
                const pedidoId = 'CAF-' + Date.now().toString().slice(-6);
                
                pedidosConfirmados.set(pedidoId, {
                    ...userState.data,
                    id: pedidoId,
                    fecha: new Date(),
                    estado: 'Confirmado',
                    telefono: from
                });

                respuesta = `✅ PEDIDO CONFIRMADO

ID: ${pedidoId}
${userState.data.nombreNegocio}
${userState.data.producto.nombre}
${userState.data.cantidad}kg - S/${userState.data.total}

📍 Entrega: ${userState.data.direccion}
📱 Contacto: ${userState.data.contacto}

⏰ Tiempo estimado: 24-48 horas

Guarda tu ID para seguimiento.
¡Gracias por tu compra! ☕

Escribe "menú" para volver al inicio.`;
                
                userState = { step: 'pedido_completado', data: {} };
                break;

            default:
                if (mensaje.toLowerCase().includes('menú') || mensaje.toLowerCase().includes('menu')) {
                    respuesta = `Menú principal:
1️⃣ Catálogo | 2️⃣ Pedido | 3️⃣ Estado | 4️⃣ Info | 5️⃣ Asesor`;
                    userState.step = 'menu_principal';
                } else {
                    respuesta = 'No entendí tu mensaje. Escribe "menú" para ver las opciones.';
                }
        }

        userStates.set(from, userState);
        return respuesta;
    } catch (error) {
        console.error('Error procesando mensaje:', error);
        return '❌ Ocurrió un error. Por favor, escribe "menú" para reiniciar.';
    }
}

// Ruta principal
app.get('/', (req, res) => {
    const twilioStatus = twilioConfigured 
        ? `✅ Configurado (${TWILIO_PHONE_NUMBER})`
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
                h1 { 
                    color: #333; 
                    text-align: center;
                    margin-bottom: 30px;
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
                .ok { color: #22c55e; font-weight: 600; }
                .warning { color: #f59e0b; font-weight: 600; }
                .info { color: #666; }
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
                .alert {
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    color: #991b1b;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .alert h3 {
                    margin: 0 0 10px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>☕ Coffee Express WhatsApp Bot</h1>
                
                ${!twilioConfigured ? `
                <div class="alert">
                    <h3>⚠️ Configuración Pendiente</h3>
                    <p>El bot está ejecutándose en modo demo. Para activar WhatsApp:</p>
                    <ol>
                        <li>Obtén tus credenciales de Twilio</li>
                        <li>Configura TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN</li>
                        <li>Reinicia la aplicación</li>
                    </ol>
                </div>
                ` : ''}
                
                <div class="status">
                    <p class="${twilioConfigured ? 'ok' : 'warning'}">
                        ${twilioConfigured ? '✅' : '⚠️'} Estado del Bot: 
                        ${twilioConfigured ? 'Activo y funcionando' : 'Modo Demo'}
                    </p>
                    <p class="info">📱 WhatsApp: ${twilioStatus}</p>
                    <p class="info">🏢 Negocio: ${BUSINESS_CONFIG.name}</p>
                    <p class="info">📧 Email: ${BUSINESS_CONFIG.email}</p>
                    <p class="info">📊 Pedidos procesados: ${pedidosConfirmados.size}</p>
                    <p class="info">🕒 Uptime: ${Math.floor(process.uptime() / 60)} minutos</p>
                </div>
                
                <div class="center">
                    <a href="/admin" class="button">📊 Panel de Administración</a>
                    <a href="/health" class="button">🏥 Health Check</a>
                    <a href="/test" class="button">🧪 Probar Bot</a>
                </div>
                
                ${twilioConfigured ? `
                <div style="margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 5px;">
                    <h3>🚀 Bot Activo</h3>
                    <p>El webhook está configurado en: <code>/webhook</code></p>
                    <p>Configura esta URL en Twilio: <code>${req.protocol}://${req.get('host')}/webhook</code></p>
                </div>
                ` : ''}
            </div>
        </body>
        </html>
    `);
});

// Webhook de Twilio
app.post('/webhook', async (req, res) => {
    if (!twilioConfigured) {
        console.log('⚠️ Webhook recibido pero Twilio no está configurado');
        return res.status(200).send('OK - Modo Demo');
    }
    
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

// Página de prueba
app.get('/test', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Probar Bot - Coffee Express</title>
            <meta charset="utf-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 50px auto;
                    padding: 20px;
                }
                .chat-container {
                    border: 1px solid #ddd;
                    border-radius: 10px;
                    padding: 20px;
                    height: 400px;
                    overflow-y: scroll;
                    background: #f9f9f9;
                }
                .message {
                    margin: 10px 0;
                    padding: 10px;
                    border-radius: 10px;
                }
                .user {
                    background: #667eea;
                    color: white;
                    text-align: right;
                }
                .bot {
                    background: white;
                    border: 1px solid #ddd;
                }
                input {
                    width: 100%;
                    padding: 10px;
                    margin-top: 20px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                }
                button {
                    width: 100%;
                    padding: 10px;
                    margin-top: 10px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <h1>🧪 Probar Bot - Modo Demo</h1>
            <div class="chat-container" id="chat">
                <div class="message bot">¡Hola! Escribe "hola" para comenzar.</div>
            </div>
            <input type="text" id="input" placeholder="Escribe tu mensaje..." />
            <button onclick="enviar()">Enviar</button>
            
            <script>
                let userPhone = 'test-' + Date.now();
                
                async function enviar() {
                    const input = document.getElementById('input');
                    const chat = document.getElementById('chat');
                    const mensaje = input.value;
                    
                    if (!mensaje) return;
                    
                    // Mostrar mensaje del usuario
                    chat.innerHTML += '<div class="message user">' + mensaje + '</div>';
                    input.value = '';
                    
                    // Enviar al servidor
                    const response = await fetch('/test-message', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ from: userPhone, body: mensaje })
                    });
                    
                    const data = await response.json();
                    
                    // Mostrar respuesta del bot
                    chat.innerHTML += '<div class="message bot">' + data.response.replace(/\\n/g, '<br>') + '</div>';
                    chat.scrollTop = chat.scrollHeight;
                }
                
                document.getElementById('input').addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') enviar();
                });
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

// Panel de administración
app.get('/admin', (req, res) => {
    const pedidosArray = Array.from(pedidosConfirmados.values());
    
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
            </style>
        </head>
        <body>
            <a href="/" class="back-button">← Volver</a>
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
                    <div class="value">S/${pedidosArray.reduce((sum, p) => sum + (p.total || 0), 0).toFixed(2)}</div>
                </div>
                <div class="stat-card">
                    <h3>Kg Vendidos</h3>
                    <div class="value">${pedidosArray.reduce((sum, p) => sum + (p.cantidad || 0), 0)} kg</div>
                </div>
            </div>
            
            <h2>Pedidos Recientes</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Fecha</th>
                        <th>Cliente</th>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Dirección</th>
                    </tr>
                </thead>
                <tbody>
                    ${pedidosArray.length > 0 ? pedidosArray.map(p => `
                        <tr>
                            <td><strong>${p.id}</strong></td>
                            <td>${new Date(p.fecha).toLocaleString('es-PE')}</td>
                            <td>${p.nombreNegocio}</td>
                            <td>${p.producto.nombre}</td>
                            <td>${p.cantidad}kg</td>
                            <td><strong>S/${p.total}</strong></td>
                            <td><span style="color: green;">✓ ${p.estado}</span></td>
                            <td>${p.direccion}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="8" class="empty">No hay pedidos aún. Prueba el bot enviando "hola" por WhatsApp.</td></tr>'}
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
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        twilio: twilioConfigured ? 'configured' : 'not configured',
        pedidos: pedidosConfirmados.size
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
    ⚙️ Twilio: ${twilioConfigured ? '✅ Configurado' : '⚠️ Modo Demo'}
    ☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕
    `);
    
    if (!twilioConfigured) {
        console.log(`
    ⚠️  IMPORTANTE: El bot está en modo demo
    Para activar WhatsApp, configura:
    - TWILIO_ACCOUNT_SID
    - TWILIO_AUTH_TOKEN
    `);
    }
});

module.exports = app;
