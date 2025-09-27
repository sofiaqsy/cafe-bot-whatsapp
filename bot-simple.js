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

// Productos disponibles - SIMPLIFICADO
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

        // Flujo principal
        switch (userState.step) {
            case 'inicio':
                if (mensaje.toLowerCase().includes('hola')) {
                    const hora = new Date().getHours();
                    const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
                    
                    respuesta = `${saludo} ☕

Bienvenido a *${BUSINESS_CONFIG.name}*

¿Qué deseas hacer?

*1* - Ver catálogo ☕
*2* - Consultar pedido 📦
*3* - Hablar con asesor 💬
*4* - Información ℹ️

_Envía el número de tu elección_`;
                    userState.step = 'menu_principal';
                } else {
                    respuesta = `Hola 👋

Soy el asistente virtual de *${BUSINESS_CONFIG.name}*

Escribe *hola* para comenzar`;
                }
                break;

            case 'menu_principal':
                switch (mensaje) {
                    case '1':
                        respuesta = `☕ *CATÁLOGO DE CAFÉ*

*1. Premium* - S/50/kg
   Chanchamayo - Chocolate y frutos rojos

*2. Estándar* - S/40/kg
   Satipo - Caramelo y nueces

*3. Orgánico* ✅ - S/60/kg
   Villa Rica - Floral y cítrico

*4. Mezcla* - S/35/kg
   Blend - Ideal espresso

*5. Descafeinado* - S/45/kg
   Cusco - Suave sin cafeína

🏷️ *Descuento 10%* pedidos ≥50kg
📦 Mínimo: 5kg

*Envía el número para pedir*`;
                        userState.step = 'seleccion_producto';
                        break;

                    case '2':
                        respuesta = `🔍 *CONSULTAR PEDIDO*

Ingresa tu código de pedido
_Ejemplo: CAF-123456_`;
                        userState.step = 'consulta_pedido';
                        break;

                    case '3':
                        respuesta = `💬 *CONTACTAR ASESOR*

Escribe tu consulta:`;
                        userState.step = 'esperando_consulta';
                        break;

                    case '4':
                        respuesta = `ℹ️ *INFORMACIÓN*

*${BUSINESS_CONFIG.name}*
📱 ${BUSINESS_CONFIG.phone}
📧 ${BUSINESS_CONFIG.email}
🕒 ${BUSINESS_CONFIG.horario}

Escribe *menu* para volver`;
                        userState.step = 'info_mostrada';
                        break;

                    default:
                        respuesta = `Por favor, envía un número del *1* al *4*`;
                }
                break;

            case 'seleccion_producto':
                if (PRODUCTOS[mensaje]) {
                    const producto = PRODUCTOS[mensaje];
                    userState.data.producto = producto;
                    
                    respuesta = `✅ *${producto.nombre}*
Precio: ${formatearPrecio(producto.precio)}/kg

*¿Cuántos kilos necesitas?*
_Mínimo: 5kg_`;
                    userState.step = 'cantidad_producto';
                } else {
                    respuesta = `Por favor, selecciona un producto (1-5)`;
                }
                break;

            case 'cantidad_producto':
                const cantidad = parseFloat(mensaje);
                
                if (!isNaN(cantidad) && cantidad >= BUSINESS_CONFIG.delivery_min) {
                    userState.data.cantidad = cantidad;
                    const calculo = calcularDescuento(cantidad, userState.data.producto.precio);
                    userState.data = { ...userState.data, ...calculo };

                    respuesta = `📊 *RESUMEN DEL PEDIDO*

📦 ${userState.data.producto.nombre}
⚖️ ${cantidad} kg × ${formatearPrecio(userState.data.producto.precio)}

Subtotal: ${formatearPrecio(calculo.subtotal)}
${calculo.descuento > 0 ? 
`Descuento: -${formatearPrecio(calculo.descuento)}` : ''}
*TOTAL: ${formatearPrecio(calculo.total)}*

*¿Confirmar pedido?*
Envía *SI* o *NO*`;
                    userState.step = 'confirmar_pedido';
                } else {
                    respuesta = `Cantidad mínima: *5kg*
Ingresa una cantidad válida:`;
                }
                break;

            case 'confirmar_pedido':
                if (mensaje.toLowerCase() === 'si' || mensaje.toLowerCase() === 'sí') {
                    respuesta = `👤 *DATOS DEL CLIENTE*

Nombre de la empresa:`;
                    userState.step = 'datos_empresa';
                } else {
                    respuesta = `Pedido cancelado.

Escribe *menu* para volver`;
                    userState = { step: 'inicio', data: {} };
                }
                break;

            case 'datos_empresa':
                userState.data.empresa = mensaje;
                respuesta = `Nombre del contacto:`;
                userState.step = 'datos_contacto';
                break;

            case 'datos_contacto':
                userState.data.contacto = mensaje;
                respuesta = `Teléfono:`;
                userState.step = 'datos_telefono';
                break;

            case 'datos_telefono':
                userState.data.telefono = mensaje;
                respuesta = `Dirección de entrega:`;
                userState.step = 'datos_direccion';
                break;

            case 'datos_direccion':
                userState.data.direccion = mensaje;
                
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
                    estado: 'Confirmado'
                };
                
                pedidosConfirmados.set(pedidoId, pedidoCompleto);

                respuesta = `✅ *¡PEDIDO CONFIRMADO!*

📋 Código: *${pedidoId}*
📦 ${userState.data.producto.nombre}
⚖️ ${userState.data.cantidad}kg
💰 Total: ${formatearPrecio(userState.data.total)}

🏢 ${userState.data.empresa}
📱 ${userState.data.telefono}
📍 ${userState.data.direccion}

⏰ Entrega: 24-48 horas

¡Gracias por tu compra! ☕

_Escribe *menu* para nuevo pedido_`;
                
                userState = { step: 'pedido_completado', data: {} };
                break;

            default:
                respuesta = `No entendí tu mensaje.

Escribe *menu* para ver opciones
o *hola* para reiniciar`;
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
                    font-family: Arial, sans-serif;
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
                h1 { text-align: center; }
                .status {
                    background: #f0f0f0;
                    padding: 20px;
                    border-radius: 5px;
                    margin: 20px 0;
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
            </style>
        </head>
        <body>
            <div class="container">
                <h1>☕ Coffee Express WhatsApp Bot</h1>
                
                <div class="status">
                    <p>🔧 Modo: ${DEV_MODE ? 'DESARROLLO' : 'PRODUCCIÓN'}</p>
                    <p>📱 WhatsApp: ${twilioConfigured ? '✅ Configurado' : '⚠️ No configurado'}</p>
                    <p>📊 Pedidos: ${pedidosConfirmados.size}</p>
                    <p>💬 Conversaciones: ${userStates.size}</p>
                </div>
                
                <div class="center">
                    <a href="/test" class="button">🧪 Probar Bot</a>
                    <a href="/admin" class="button">📊 Admin</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Servir la página de prueba
app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
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
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Admin - Coffee Express</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    background: #f5f5f5;
                }
                table {
                    width: 100%;
                    background: white;
                    border-collapse: collapse;
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
            </style>
        </head>
        <body>
            <h1>📊 Panel de Administración</h1>
            
            <h2>Pedidos (${pedidos.length})</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Fecha</th>
                        <th>Empresa</th>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Total</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${pedidos.map(p => `
                        <tr>
                            <td>${p.id}</td>
                            <td>${new Date(p.fecha).toLocaleString('es-PE')}</td>
                            <td>${p.empresa}</td>
                            <td>${p.producto.nombre}</td>
                            <td>${p.cantidad}kg</td>
                            <td>S/${p.total.toFixed(2)}</td>
                            <td>${p.estado}</td>
                        </tr>
                    `).join('')}
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
    🚀 Bot de WhatsApp iniciado
    📍 Puerto: ${PORT}
    🌐 URL: http://localhost:${PORT}
    📱 Webhook: /webhook
    🔧 Test: /test
    📊 Admin: /admin
    ⚙️ Modo: ${DEV_MODE ? '🔧 DESARROLLO' : '✅ PRODUCCIÓN'}
    ☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕
    `);
});

module.exports = app;
