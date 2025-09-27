const express = require('express');
const dotenv = require('dotenv');
const imageHandler = require('./image-handler');
const paymentHandler = require('./payment-handler');

dotenv.config();

// Inicializar carpeta de uploads
imageHandler.ensureUploadsDir();

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Servir imágenes estáticas desde la carpeta uploads
app.use('/uploads', express.static('uploads'));

// Configuración de Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886';
const DEV_MODE = process.env.DEV_MODE === 'true';

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
    }
} else if (DEV_MODE) {
    console.log('🔧 MODO DESARROLLO - Sin envío real');
} else {
    console.log('⚠️ Twilio no configurado');
}

// Estado de conversaciones
const userStates = new Map();
const pedidosConfirmados = new Map();

// Configuración del negocio
const BUSINESS_CONFIG = {
    name: process.env.BUSINESS_NAME || "Coffee Express",
    phone: process.env.BUSINESS_PHONE || "+51987654321",
    email: process.env.BUSINESS_EMAIL || "ventas@coffeeexpress.com",
    horario: "Lun-Sab 8:00-18:00"
};

// Productos
const PRODUCTOS = {
    '1': { id: '1', nombre: 'Café Premium', precio: 50 },
    '2': { id: '2', nombre: 'Café Estándar', precio: 40 },
    '3': { id: '3', nombre: 'Café Orgánico', precio: 60 },
    '4': { id: '4', nombre: 'Mezcla Especial', precio: 35 },
    '5': { id: '5', nombre: 'Descafeinado', precio: 45 }
};

// Función para enviar mensaje
async function enviarMensaje(to, message) {
    if (DEV_MODE) {
        console.log(`📤 MODO DEV - Mensaje a ${to}:`, message);
        return { sid: 'dev-' + Date.now() };
    }
    
    if (!twilioConfigured || !client) {
        console.log(`📤 MODO DEMO - Mensaje a ${to}`);
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
        console.error('❌ Error enviando mensaje:', error);
        throw error;
    }
}

// Función principal mejorada para manejar mensajes
async function manejarMensaje(from, body, mediaUrl = null) {
    const mensaje = body ? body.trim() : '';
    let userState = userStates.get(from) || { step: 'inicio', data: {} };
    let respuesta = '';

    console.log(`📩 De: ${from} | Estado: ${userState.step}`);
    if (mediaUrl) console.log(`📷 Imagen: ${mediaUrl}`);

    try {
        // Si estamos esperando comprobante y llega imagen
        if (userState.step === 'esperando_comprobante' && mediaUrl) {
            const resultado = await imageHandler.procesarImagen(
                mediaUrl,
                userState.data.pedidoId,
                TWILIO_ACCOUNT_SID,
                TWILIO_AUTH_TOKEN
            );
            
            if (resultado.success) {
                // Actualizar pedido
                const pedido = pedidosConfirmados.get(userState.data.pedidoId);
                if (pedido) {
                    pedido.comprobante = resultado.data;
                    pedido.estadoPago = 'Comprobante recibido';
                    pedidosConfirmados.set(userState.data.pedidoId, pedido);
                }
                
                respuesta = `✅ *¡COMPROBANTE RECIBIDO!*

📋 Pedido: ${userState.data.pedidoId}
💰 Monto: S/${userState.data.total}
📸 Comprobante: ✓ Recibido

Tu pedido será procesado en las próximas horas.
Te notificaremos cuando esté en camino.

¡Gracias por tu compra! ☕

Escribe *menu* para volver al inicio`;
                
                userState.step = 'pedido_completado';
            } else {
                respuesta = `❌ Error al procesar el comprobante.

Por favor intenta nuevamente o escribe:
• *saltar* para completar sin comprobante
• *menu* para volver al inicio`;
            }
        }
        // Si llega imagen cuando no se espera
        else if (mediaUrl && userState.step !== 'esperando_comprobante') {
            respuesta = `📷 Imagen recibida.

Para enviar un comprobante, primero completa un pedido.

Escribe *hola* para comenzar o *menu* para ver opciones.`;
        }
        // Flujo normal de texto
        else {
            switch (userState.step) {
                case 'inicio':
                    if (mensaje.toLowerCase().includes('hola')) {
                        respuesta = `☕ ¡Bienvenido a ${BUSINESS_CONFIG.name}!

¿Qué deseas hacer?

*1* - Ver catálogo y pedir
*2* - Consultar pedido
*3* - Información
*4* - Hablar con asesor

Envía el número de tu opción`;
                        userState.step = 'menu_principal';
                    } else {
                        respuesta = 'Hola 👋 Escribe *hola* para comenzar';
                    }
                    break;

                case 'menu_principal':
                    switch (mensaje) {
                        case '1':
                            respuesta = `📋 *CATÁLOGO DE CAFÉ*

*1.* Café Premium - S/50/kg
*2.* Café Estándar - S/40/kg  
*3.* Café Orgánico - S/60/kg
*4.* Mezcla Especial - S/35/kg
*5.* Descafeinado - S/45/kg

Descuento 10% en pedidos ≥50kg

Selecciona un producto (1-5):`;
                            userState.step = 'seleccionar_producto';
                            break;

                        case '2':
                            respuesta = 'Ingresa tu código de pedido:';
                            userState.step = 'consultar_pedido';
                            break;

                        case '3':
                            respuesta = `📞 *INFORMACIÓN*

${BUSINESS_CONFIG.name}
📱 ${BUSINESS_CONFIG.phone}
📧 ${BUSINESS_CONFIG.email}
🕒 ${BUSINESS_CONFIG.horario}

Escribe *menu* para volver`;
                            userState.step = 'info_mostrada';
                            break;

                        case '4':
                            respuesta = 'Escribe tu consulta:';
                            userState.step = 'consulta_asesor';
                            break;

                        default:
                            respuesta = 'Opción no válida. Selecciona 1-4';
                    }
                    break;

                case 'seleccionar_producto':
                    const producto = PRODUCTOS[mensaje];
                    if (producto) {
                        userState.data.producto = producto;
                        respuesta = `✅ ${producto.nombre}
Precio: S/${producto.precio}/kg

¿Cuántos kilos deseas? (mínimo 5kg):`;
                        userState.step = 'ingresar_cantidad';
                    } else {
                        respuesta = 'Selecciona un producto válido (1-5)';
                    }
                    break;

                case 'ingresar_cantidad':
                    const cantidad = parseFloat(mensaje);
                    if (!isNaN(cantidad) && cantidad >= 5) {
                        userState.data.cantidad = cantidad;
                        const subtotal = cantidad * userState.data.producto.precio;
                        const descuento = cantidad >= 50 ? subtotal * 0.1 : 0;
                        const total = subtotal - descuento;
                        
                        userState.data.subtotal = subtotal;
                        userState.data.descuento = descuento;
                        userState.data.total = total;

                        respuesta = `📊 *RESUMEN DEL PEDIDO*

${userState.data.producto.nombre}
Cantidad: ${cantidad}kg
Subtotal: S/${subtotal}
${descuento > 0 ? `Descuento: -S/${descuento}` : ''}
*TOTAL: S/${total}*

¿Confirmar pedido? (*SI* / *NO*)`;
                        userState.step = 'confirmar_pedido';
                    } else {
                        respuesta = 'Ingresa una cantidad válida (mínimo 5kg)';
                    }
                    break;

                case 'confirmar_pedido':
                    if (mensaje.toLowerCase() === 'si' || mensaje.toLowerCase() === 'sí') {
                        respuesta = 'Nombre de tu empresa:';
                        userState.step = 'datos_empresa';
                    } else {
                        respuesta = 'Pedido cancelado. Escribe *menu* para volver';
                        userState.step = 'inicio';
                    }
                    break;

                case 'datos_empresa':
                    userState.data.empresa = mensaje;
                    respuesta = 'Nombre del contacto:';
                    userState.step = 'datos_contacto';
                    break;

                case 'datos_contacto':
                    userState.data.contacto = mensaje;
                    respuesta = 'Teléfono de contacto:';
                    userState.step = 'datos_telefono';
                    break;

                case 'datos_telefono':
                    userState.data.telefono = mensaje;
                    respuesta = 'Dirección de entrega:';
                    userState.step = 'datos_direccion';
                    break;

                case 'datos_direccion':
                    userState.data.direccion = mensaje;
                    respuesta = paymentHandler.obtenerMensajeMetodoPago();
                    userState.step = 'seleccionar_pago';
                    break;

                case 'seleccionar_pago':
                    // Generar ID del pedido
                    const pedidoId = 'CAF-' + Date.now().toString().slice(-6);
                    userState.data.pedidoId = pedidoId;
                    
                    const resultadoPago = paymentHandler.procesarMetodoPago(mensaje, userState);
                    
                    if (resultadoPago.valido) {
                        // Guardar pedido
                        pedidosConfirmados.set(pedidoId, {
                            ...userState.data,
                            id: pedidoId,
                            fecha: new Date(),
                            estado: 'Pendiente',
                            whatsapp: from
                        });
                        
                        respuesta = resultadoPago.respuesta;
                    } else {
                        respuesta = resultadoPago.respuesta;
                    }
                    break;

                case 'esperando_comprobante':
                    if (mensaje.toLowerCase() === 'saltar') {
                        respuesta = `⚠️ Pedido registrado sin comprobante.

ID: ${userState.data.pedidoId}

Envía el comprobante lo antes posible para procesar tu pedido.

Escribe *menu* para volver`;
                        userState.step = 'pedido_sin_comprobante';
                    } else {
                        respuesta = `📸 Esperando comprobante de pago...

Envía una foto del voucher o escribe:
• *saltar* para completar sin comprobante
• *menu* para volver al inicio`;
                    }
                    break;

                case 'consultar_pedido':
                    const pedido = pedidosConfirmados.get(mensaje.toUpperCase());
                    if (pedido) {
                        respuesta = `📦 *ESTADO DEL PEDIDO*

ID: ${pedido.id}
Estado: ${pedido.estado}
${pedido.estadoPago ? `Pago: ${pedido.estadoPago}` : ''}
Fecha: ${new Date(pedido.fecha).toLocaleString('es-PE')}

${pedido.producto.nombre}
${pedido.cantidad}kg - S/${pedido.total}

Escribe *menu* para volver`;
                    } else {
                        respuesta = `No se encontró el pedido ${mensaje}.

Verifica el código e intenta nuevamente.
Escribe *menu* para volver`;
                    }
                    userState.step = 'consulta_completada';
                    break;

                default:
                    if (mensaje.toLowerCase() === 'menu' || mensaje.toLowerCase() === 'menú') {
                        respuesta = `📱 *MENÚ PRINCIPAL*

*1* - Ver catálogo
*2* - Consultar pedido
*3* - Información
*4* - Asesor

Selecciona una opción:`;
                        userState.step = 'menu_principal';
                    } else {
                        respuesta = 'No entendí. Escribe *menu* para ver opciones';
                    }
            }
        }

        userStates.set(from, userState);
        return respuesta;
    } catch (error) {
        console.error('Error:', error);
        return '❌ Ocurrió un error. Escribe *menu* para reiniciar';
    }
}

// WEBHOOK MEJORADO PARA IMÁGENES
app.post('/webhook', async (req, res) => {
    const { From, Body, NumMedia, MediaUrl0 } = req.body;
    
    console.log(`📨 Mensaje de ${From}: ${Body}`);
    
    // Detectar si hay imagen
    let mediaUrl = null;
    if (NumMedia && parseInt(NumMedia) > 0 && MediaUrl0) {
        mediaUrl = MediaUrl0;
        console.log(`📷 Imagen recibida: ${mediaUrl}`);
    }
    
    try {
        const respuesta = await manejarMensaje(From, Body, mediaUrl);
        await enviarMensaje(From, respuesta);
        res.status(200).send('OK');
    } catch (error) {
        console.error('Error en webhook:', error);
        res.status(200).send('OK');
    }
});

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
                    font-family: -apple-system, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                }
                .container {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                h1 { text-align: center; color: #333; }
                .status {
                    background: #f5f5f5;
                    padding: 20px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .status p { margin: 10px 0; }
                .ok { color: #22c55e; }
                .warning { color: #f59e0b; }
                .feature {
                    background: #e0f2fe;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 10px 0;
                }
                .button {
                    display: inline-block;
                    padding: 10px 20px;
                    background: #667eea;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 5px;
                }
                .button:hover { background: #5a67d8; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>☕ Coffee Express WhatsApp Bot</h1>
                <h2>✨ Con Soporte de Imágenes</h2>
                
                <div class="status">
                    <p class="${twilioConfigured ? 'ok' : 'warning'}">
                        ${twilioConfigured ? '✅' : '⚠️'} Twilio: 
                        ${twilioConfigured ? 'Configurado' : 'No configurado'}
                    </p>
                    <p>📱 WhatsApp: ${TWILIO_PHONE_NUMBER}</p>
                    <p>📊 Pedidos: ${pedidosConfirmados.size}</p>
                    <p>📸 Carpeta uploads: ${imageHandler.UPLOADS_DIR}</p>
                    <p>🕒 Uptime: ${Math.floor(process.uptime() / 60)} min</p>
                </div>
                
                <div class="feature">
                    <h3>🆕 Características con Imágenes:</h3>
                    <ul>
                        <li>✅ Recepción de comprobantes de pago</li>
                        <li>✅ Descarga y almacenamiento automático</li>
                        <li>✅ Validación de imágenes</li>
                        <li>✅ Múltiples métodos de pago</li>
                        <li>✅ Estado de pago en pedidos</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <a href="/admin" class="button">📊 Panel Admin</a>
                    <a href="/comprobantes" class="button">📸 Ver Comprobantes</a>
                    <a href="/health" class="button">🏥 Health Check</a>
                </div>
                
                ${twilioConfigured ? `
                <div style="margin-top: 20px; padding: 15px; background: #f0fdf4; border-radius: 5px;">
                    <strong>✅ Bot Activo</strong><br>
                    Webhook: ${req.protocol}://${req.get('host')}/webhook
                </div>
                ` : ''}
            </div>
        </body>
        </html>
    `);
});

// Panel de administración mejorado
app.get('/admin', (req, res) => {
    const pedidos = Array.from(pedidosConfirmados.values());
    const conComprobante = pedidos.filter(p => p.comprobante).length;
    const sinComprobante = pedidos.filter(p => !p.comprobante && p.requiereComprobante).length;
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Panel Admin - Coffee Express</title>
            <meta charset="utf-8">
            <style>
                body {
                    font-family: -apple-system, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: #f5f5f5;
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
                th { background: #667eea; color: white; }
                .status-badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                }
                .badge-success { background: #d1fae5; color: #065f46; }
                .badge-warning { background: #fed7aa; color: #c2410c; }
                .badge-info { background: #dbeafe; color: #1e40af; }
                .comprobante-link {
                    color: #667eea;
                    text-decoration: none;
                }
                .comprobante-link:hover {
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <h1>📊 Panel de Administración</h1>
            
            <div class="stats">
                <div class="stat-card">
                    <h3>Total Pedidos</h3>
                    <div class="value">${pedidos.length}</div>
                </div>
                <div class="stat-card">
                    <h3>Con Comprobante</h3>
                    <div class="value" style="color: #22c55e;">${conComprobante}</div>
                </div>
                <div class="stat-card">
                    <h3>Sin Comprobante</h3>
                    <div class="value" style="color: #f59e0b;">${sinComprobante}</div>
                </div>
                <div class="stat-card">
                    <h3>Total Ventas</h3>
                    <div class="value">S/${pedidos.reduce((sum, p) => sum + (p.total || 0), 0).toFixed(2)}</div>
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
                        <th>Total</th>
                        <th>Método Pago</th>
                        <th>Estado</th>
                        <th>Comprobante</th>
                    </tr>
                </thead>
                <tbody>
                    ${pedidos.reverse().map(p => `
                        <tr>
                            <td><strong>${p.id}</strong></td>
                            <td>${new Date(p.fecha).toLocaleString('es-PE')}</td>
                            <td>${p.empresa || '-'}<br><small>${p.contacto || ''}</small></td>
                            <td>${p.producto ? p.producto.nombre : '-'}<br><small>${p.cantidad || 0}kg</small></td>
                            <td><strong>S/${p.total || 0}</strong></td>
                            <td>${p.metodoPago || '-'}</td>
                            <td>
                                <span class="status-badge ${p.estadoPago === 'Comprobante recibido' ? 'badge-success' : 'badge-warning'}">
                                    ${p.estadoPago || p.estado || 'Pendiente'}
                                </span>
                            </td>
                            <td>
                                ${p.comprobante ? 
                                    `<a href="/uploads/${p.comprobante.fileName}" class="comprobante-link" target="_blank">Ver 📸</a>` : 
                                    '❌ No'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div style="margin-top: 20px;">
                <a href="/" style="padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">← Volver</a>
                <a href="/comprobantes" style="padding: 10px 20px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin-left: 10px;">Ver Comprobantes</a>
            </div>
        </body>
        </html>
    `);
});

// Nueva ruta para ver comprobantes
app.get('/comprobantes', async (req, res) => {
    const comprobantes = await imageHandler.listarComprobantes();
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Comprobantes - Coffee Express</title>
            <meta charset="utf-8">
            <style>
                body {
                    font-family: -apple-system, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: #f5f5f5;
                }
                h1 { color: #333; }
                .grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 20px;
                    margin: 20px 0;
                }
                .card {
                    background: white;
                    padding: 15px;
                    border-radius: 10px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                .card img {
                    width: 100%;
                    height: 150px;
                    object-fit: cover;
                    border-radius: 5px;
                    margin-bottom: 10px;
                }
                .card h3 {
                    margin: 0 0 10px 0;
                    font-size: 14px;
                    color: #333;
                }
                .card p {
                    margin: 5px 0;
                    font-size: 12px;
                    color: #666;
                }
                .back {
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
            <a href="/admin" class="back">← Volver al Admin</a>
            <h1>📸 Comprobantes Recibidos</h1>
            
            <div class="grid">
                ${comprobantes.length > 0 ? comprobantes.map(c => `
                    <div class="card">
                        <img src="/uploads/${c.fileName}" alt="${c.fileName}">
                        <h3>${c.fileName}</h3>
                        <p>📅 ${new Date(c.fecha).toLocaleString('es-PE')}</p>
                        <p>📦 Tamaño: ${(c.size / 1024).toFixed(2)} KB</p>
                    </div>
                `).join('') : '<p>No hay comprobantes guardados aún</p>'}
            </div>
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
        mode: DEV_MODE ? 'development' : 'production',
        twilio: twilioConfigured ? 'configured' : 'not configured',
        pedidos: pedidosConfirmados.size,
        imageSupport: true,
        uploadsDir: imageHandler.UPLOADS_DIR
    });
});

// Puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`
    ☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕
    🚀 Bot de WhatsApp - v5.0
    📍 Puerto: ${PORT}
    🌐 URL: http://localhost:${PORT}
    📱 Webhook: /webhook
    📊 Admin: /admin
    📸 Comprobantes: /comprobantes
    ⚙️ Modo: ${DEV_MODE ? '🔧 DESARROLLO' : (twilioConfigured ? '✅ PRODUCCIÓN' : '⚠️ DEMO')}
    
    🆕 SOPORTE DE IMÁGENES ACTIVADO
    ✅ Recepción de comprobantes
    ✅ Almacenamiento local
    ✅ Panel de administración mejorado
    ☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕
    `);
});

module.exports = app;
