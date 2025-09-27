const express = require('express');
const twilio = require('twilio');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Configuración de Twilio
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

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
    try {
        const response = await client.messages.create({
            body: message,
            from: twilioPhoneNumber,
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
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Coffee Express WhatsApp Bot</title>
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
                h1 { color: #333; text-align: center; }
                .status {
                    background: #f0f0f0;
                    padding: 20px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .status p { margin: 10px 0; }
                .ok { color: green; }
                .info { color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>☕ Coffee Express WhatsApp Bot</h1>
                <div class="status">
                    <p class="ok">✅ Bot activo y funcionando</p>
                    <p class="info">📱 WhatsApp: ${twilioPhoneNumber || 'No configurado'}</p>
                    <p class="info">🏢 Negocio: ${BUSINESS_CONFIG.name}</p>
                    <p class="info">📊 Pedidos: ${pedidosConfirmados.size}</p>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="/admin" style="display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">
                        Panel de Administración
                    </a>
                </div>
            </div>
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
        res.status(500).send('Error');
    }
});

// Panel de administración
app.get('/admin', (req, res) => {
    const pedidosArray = Array.from(pedidosConfirmados.values());
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Panel Admin - Coffee Express</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: #f5f5f5;
                }
                table {
                    width: 100%;
                    background: white;
                    border-collapse: collapse;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
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
            <h1>☕ Panel de Administración</h1>
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
                    </tr>
                </thead>
                <tbody>
                    ${pedidosArray.length > 0 ? pedidosArray.map(p => `
                        <tr>
                            <td>${p.id}</td>
                            <td>${new Date(p.fecha).toLocaleString('es-PE')}</td>
                            <td>${p.nombreNegocio}</td>
                            <td>${p.producto.nombre}</td>
                            <td>${p.cantidad}kg</td>
                            <td>S/${p.total}</td>
                            <td>${p.estado}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="7" style="text-align: center;">No hay pedidos aún</td></tr>'}
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
        environment: process.env.NODE_ENV || 'development'
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
    ☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕
    `);
});

module.exports = app;
