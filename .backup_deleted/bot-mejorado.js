const express = require('express');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

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

// Crear carpeta para guardar imágenes si no existe
const UPLOADS_DIR = path.join(__dirname, 'uploads');
async function ensureUploadsDir() {
    try {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
        console.log('📁 Carpeta de uploads creada/verificada');
    } catch (error) {
        console.error('Error creando carpeta de uploads:', error);
    }
}
ensureUploadsDir();

// Estado de conversaciones
const userStates = new Map();
const pedidosConfirmados = new Map();

// Configuración del negocio
const BUSINESS_CONFIG = {
    name: process.env.BUSINESS_NAME || "Coffee Express",
    phone: process.env.BUSINESS_PHONE || "+51987654321",
    email: process.env.BUSINESS_EMAIL || "ventas@coffeeexpress.com"
};

// Configuración de métodos de pago
const METODOS_PAGO = {
    'BCP': {
        cuenta: '191-71374-73085',
        cci: '00219100713747308552',
        titular: 'Rosal Express'
    },
    'INTERBANK': {
        cuenta: '123-456789-0-12',
        cci: '00312345678901234567',
        titular: 'Rosal Express'
    },
    'YAPE': {
        numero: '+51987654321',
        titular: 'Rosal Express'
    },
    'PLIN': {
        numero: '+51987654321',
        titular: 'Rosal Express'
    }
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

// Función para descargar imagen desde Twilio
async function descargarImagen(mediaUrl, fileName) {
    try {
        const response = await axios({
            method: 'GET',
            url: mediaUrl,
            responseType: 'stream',
            auth: {
                username: TWILIO_ACCOUNT_SID,
                password: TWILIO_AUTH_TOKEN
            }
        });

        const filePath = path.join(UPLOADS_DIR, fileName);
        const writer = fs.createWriteStream(filePath);
        
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`✅ Imagen guardada: ${filePath}`);
                resolve(filePath);
            });
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('❌ Error descargando imagen:', error.message);
        throw error;
    }
}

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
async function manejarMensaje(from, body, mediaUrl = null) {
    const mensaje = body ? body.trim() : '';
    let userState = userStates.get(from) || { step: 'inicio', data: {} };
    let respuesta = '';

    console.log(`📩 De: ${from} | Mensaje: "${mensaje}" | Estado: ${userState.step}`);
    if (mediaUrl) {
        console.log(`📷 Imagen recibida: ${mediaUrl}`);
    }

    try {
        // Si se está esperando un comprobante y llega una imagen
        if (userState.step === 'esperando_comprobante' && mediaUrl) {
            try {
                // Generar nombre único para el archivo
                const timestamp = Date.now();
                const fileName = `comprobante_${userState.data.pedidoId}_${timestamp}.jpg`;
                
                // Descargar y guardar la imagen
                const filePath = await descargarImagen(mediaUrl, fileName);
                
                // Guardar información del comprobante
                userState.data.comprobante = {
                    url: mediaUrl,
                    fileName: fileName,
                    filePath: filePath,
                    fechaRecepcion: new Date()
                };
                
                // Actualizar el pedido con el comprobante
                const pedido = pedidosConfirmados.get(userState.data.pedidoId);
                if (pedido) {
                    pedido.comprobante = userState.data.comprobante;
                    pedido.estadoPago = 'Comprobante recibido';
                    pedidosConfirmados.set(userState.data.pedidoId, pedido);
                }
                
                respuesta = `✅ ¡Comprobante recibido correctamente!

📋 RESUMEN DE TU PEDIDO:
ID: ${userState.data.pedidoId}
${userState.data.nombreNegocio}
${userState.data.producto.nombre}
${userState.data.cantidad}kg - S/${userState.data.total}

📍 Entrega: ${userState.data.direccion}
📱 Contacto: ${userState.data.contacto}

✅ PAGO: Comprobante recibido
⏰ Tiempo de entrega: 24-48 horas

Validaremos tu pago y te notificaremos cuando tu pedido esté en camino.

¡Gracias por tu compra! ☕

Escribe "menú" para volver al inicio.`;
                
                userState = { step: 'pedido_completado', data: {} };
            } catch (error) {
                console.error('Error procesando comprobante:', error);
                respuesta = `❌ Hubo un problema al recibir el comprobante. 

Por favor, intenta enviar la imagen nuevamente o escribe "saltar" para completar el pedido sin comprobante.`;
            }
        }
        // Si llega una imagen pero no se está esperando
        else if (mediaUrl && userState.step !== 'esperando_comprobante') {
            respuesta = `📷 Imagen recibida pero no esperada en este momento.

Si necesitas enviar un comprobante de pago, primero debes completar un pedido.

Escribe "menú" para ver las opciones disponibles.`;
        }
        // Manejo normal de mensajes de texto
        else {
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

                case 'viendo_catalogo':
                    if (mensaje.toLowerCase() === 'sí' || mensaje.toLowerCase() === 'si') {
                        respuesta = '¿Cuál es el nombre de tu cafetería o negocio?';
                        userState.step = 'pedido_nombre';
                    } else if (mensaje.toLowerCase().includes('menú') || mensaje.toLowerCase().includes('menu')) {
                        respuesta = `Menú principal:
1️⃣ Catálogo | 2️⃣ Pedido | 3️⃣ Estado | 4️⃣ Info | 5️⃣ Asesor`;
                        userState.step = 'menu_principal';
                    } else {
                        respuesta = 'Escribe "sí" para hacer un pedido o "menú" para volver.';
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
                    respuesta = '¿Cuál es tu nombre completo?';
                    userState.step = 'pedido_nombre_contacto';
                    break;

                case 'pedido_nombre_contacto':
                    userState.data.nombreContacto = mensaje;
                    respuesta = '¿Número de teléfono para coordinar la entrega?';
                    userState.step = 'pedido_telefono';
                    break;

                case 'pedido_telefono':
                    userState.data.contacto = mensaje;
                    respuesta = `Selecciona tu método de pago:

1️⃣ Transferencia BCP
2️⃣ Transferencia Interbank
3️⃣ Yape
4️⃣ Plin
5️⃣ Pago contra entrega (+S/5 adicional)

Escribe el número de tu opción`;
                    userState.step = 'seleccionar_metodo_pago';
                    break;

                case 'seleccionar_metodo_pago':
                    let metodoSeleccionado = null;
                    let infoMetodo = '';
                    
                    switch (mensaje) {
                        case '1':
                            metodoSeleccionado = 'BCP';
                            infoMetodo = `💰 DATOS PARA TRANSFERENCIA BCP:
                            
Cuenta BCP Soles: ${METODOS_PAGO.BCP.cuenta}
CCI: ${METODOS_PAGO.BCP.cci}
Titular: ${METODOS_PAGO.BCP.titular}`;
                            break;
                        case '2':
                            metodoSeleccionado = 'INTERBANK';
                            infoMetodo = `💰 DATOS PARA TRANSFERENCIA INTERBANK:
                            
Cuenta Interbank: ${METODOS_PAGO.INTERBANK.cuenta}
CCI: ${METODOS_PAGO.INTERBANK.cci}
Titular: ${METODOS_PAGO.INTERBANK.titular}`;
                            break;
                        case '3':
                            metodoSeleccionado = 'YAPE';
                            infoMetodo = `💰 DATOS PARA YAPE:
                            
Número: ${METODOS_PAGO.YAPE.numero}
Titular: ${METODOS_PAGO.YAPE.titular}`;
                            break;
                        case '4':
                            metodoSeleccionado = 'PLIN';
                            infoMetodo = `💰 DATOS PARA PLIN:
                            
Número: ${METODOS_PAGO.PLIN.numero}
Titular: ${METODOS_PAGO.PLIN.titular}`;
                            break;
                        case '5':
                            metodoSeleccionado = 'CONTRA_ENTREGA';
                            userState.data.total += 5; // Cargo adicional
                            infoMetodo = `💰 PAGO CONTRA ENTREGA SELECCIONADO

Se agregó S/5 al total por este método de pago.
Total final: S/${userState.data.total}`;
                            break;
                        default:
                            respuesta = 'Por favor, selecciona una opción válida (1-5)';
                            break;
                    }
                    
                    if (metodoSeleccionado) {
                        userState.data.metodoPago = metodoSeleccionado;
                        const pedidoId = 'CAF-' + Date.now().toString().slice(-6);
                        userState.data.pedidoId = pedidoId;
                        
                        // Guardar pedido
                        pedidosConfirmados.set(pedidoId, {
                            ...userState.data,
                            id: pedidoId,
                            fecha: new Date(),
                            estado: 'Pendiente de pago',
                            telefono: from
                        });
                        
                        if (metodoSeleccionado === 'CONTRA_ENTREGA') {
                            respuesta = `✅ PEDIDO CONFIRMADO

ID: ${pedidoId}
${userState.data.nombreNegocio}
${userState.data.producto.nombre}
${userState.data.cantidad}kg - S/${userState.data.total}

📍 Entrega: ${userState.data.direccion}
📱 Contacto: ${userState.data.contacto}
💰 Método: Pago contra entrega

⏰ Tiempo estimado: 24-48 horas

Guarda tu ID para seguimiento.
¡Gracias por tu compra! ☕

Escribe "menú" para volver al inicio.`;
                            userState = { step: 'pedido_completado', data: {} };
                        } else {
                            respuesta = `${infoMetodo}

💰 Monto a transferir: S/ ${userState.data.total}

Tu código de pedido es: ${pedidoId}

📸 ENVÍO DE COMPROBANTE:
Por favor, envía una foto del comprobante de pago después de realizar la transferencia.

⚠️ IMPORTANTE: Envía la imagen del comprobante ahora para confirmar tu pedido.`;
                            userState.step = 'esperando_comprobante';
                        }
                    }
                    break;

                case 'esperando_comprobante':
                    if (mensaje.toLowerCase() === 'saltar') {
                        respuesta = `⚠️ Pedido registrado sin comprobante.

ID: ${userState.data.pedidoId}

Por favor, envía el comprobante lo antes posible para procesar tu pedido.

Escribe "menú" para volver al inicio.`;
                        userState = { step: 'pedido_completado', data: {} };
                    } else {
                        respuesta = `📸 Esperando comprobante de pago...

Por favor, envía una foto del voucher de transferencia.

Si tienes problemas, escribe "saltar" para completar el pedido sin comprobante.`;
                    }
                    break;

                case 'consulta_pedido':
                    const pedido = pedidosConfirmados.get(mensaje.toUpperCase());
                    if (pedido) {
                        respuesta = `📦 ESTADO DEL PEDIDO ${pedido.id}

Cliente: ${pedido.nombreNegocio}
Producto: ${pedido.producto.nombre}
Cantidad: ${pedido.cantidad}kg
Total: S/${pedido.total}
Estado: ${pedido.estado}
${pedido.estadoPago ? `Pago: ${pedido.estadoPago}` : ''}
Fecha: ${new Date(pedido.fecha).toLocaleString('es-PE')}

Escribe "menú" para volver.`;
                    } else {
                        respuesta = `No se encontró el pedido ${mensaje}.

Verifica el ID e intenta nuevamente.
Escribe "menú" para volver.`;
                    }
                    userState.step = 'consulta_completada';
                    break;

                default:
                    if (mensaje.toLowerCase().includes('menú') || mensaje.toLowerCase().includes('menu')) {
                        respuesta = `Menú principal:
1️⃣ Catálogo | 2️⃣ Pedido | 3️⃣ Estado | 4️⃣ Info | 5️⃣ Asesor`;
                        userState.step = 'menu_principal';
                    } else if (mensaje.toLowerCase() === 'hola') {
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
                        respuesta = 'No entendí tu mensaje. Escribe "menú" para ver las opciones o "hola" para reiniciar.';
                    }
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
            </style>
        </head>
        <body>
            <div class="container">
                <h1>☕ Coffee Express WhatsApp Bot</h1>
                <h2>✨ Bot con soporte de imágenes para comprobantes</h2>
                
                <div class="status">
                    <p class="${twilioConfigured ? 'ok' : 'warning'}">
                        ${twilioConfigured ? '✅' : '⚠️'} Estado del Bot: 
                        ${twilioConfigured ? 'Activo y funcionando' : 'Modo Demo'}
                    </p>
                    <p class="info">📱 WhatsApp: ${twilioStatus}</p>
                    <p class="info">🏢 Negocio: ${BUSINESS_CONFIG.name}</p>
                    <p class="info">📧 Email: ${BUSINESS_CONFIG.email}</p>
                    <p class="info">📊 Pedidos procesados: ${pedidosConfirmados.size}</p>
                    <p class="info">📸 Carpeta de imágenes: ${UPLOADS_DIR}</p>
                    <p class="info">🕒 Uptime: ${Math.floor(process.uptime() / 60)} minutos</p>
                </div>
                
                <div class="center">
                    <a href="/admin" class="button">📊 Panel de Administración</a>
                    <a href="/health" class="button">🏥 Health Check</a>
                    <a href="/test" class="button">🧪 Probar Bot</a>
                </div>
                
                ${twilioConfigured ? `
                <div style="margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 5px;">
                    <h3>🚀 Bot Activo con Soporte de Imágenes</h3>
                    <p>El webhook está configurado en: <code>/webhook</code></p>
                    <p>Configura esta URL en Twilio: <code>${req.protocol}://${req.get('host')}/webhook</code></p>
                    <p>✅ El bot ahora puede recibir y procesar imágenes de comprobantes de pago</p>
                </div>
                ` : ''}
            </div>
        </body>
        </html>
    `);
});

// Webhook de Twilio - MEJORADO PARA MANEJAR IMÁGENES
app.post('/webhook', async (req, res) => {
    if (!twilioConfigured) {
        console.log('⚠️ Webhook recibido pero Twilio no está configurado');
        return res.status(200).send('OK - Modo Demo');
    }
    
    const { From, Body, NumMedia, MediaUrl0 } = req.body;
    
    console.log(`📨 Mensaje recibido de ${From}: ${Body}`);
    
    // Verificar si hay imágenes adjuntas
    let mediaUrl = null;
    if (NumMedia && parseInt(NumMedia) > 0 && MediaUrl0) {
        mediaUrl = MediaUrl0;
        console.log(`📷 Imagen recibida: ${mediaUrl}`);
    }
    
    try {
        // Manejar el mensaje con soporte de imágenes
        const respuesta = await manejarMensaje(From, Body, mediaUrl);
        await enviarMensaje(From, respuesta);
        res.status(200).send('OK');
    } catch (error) {
        console.error('Error en webhook:', error);
        res.status(200).send('OK'); // Siempre responder 200 a Twilio
    }
});

// Panel de administración mejorado
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
                .status-badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                }
                .status-pendiente {
                    background: #fef3c7;
                    color: #92400e;
                }
                .status-confirmado {
                    background: #d1fae5;
                    color: #065f46;
                }
                .status-comprobante {
                    background: #dbeafe;
                    color: #1e40af;
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
                    <h3>Con Comprobante</h3>
                    <div class="value">${pedidosArray.filter(p => p.comprobante).length}</div>
                </div>
                <div class="stat-card">
                    <h3>Total Ventas</h3>
                    <div class="value">S/${pedidosArray.reduce((sum, p) => sum + (p.total || 0), 0).toFixed(2)}</div>
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
                        <th>Método Pago</th>
                        <th>Estado Pago</th>
                        <th>Dirección</th>
                        <th>Comprobante</th>
                    </tr>
                </thead>
                <tbody>
                    ${pedidosArray.length > 0 ? pedidosArray.map(p => `
                        <tr>
                            <td><strong>${p.id}</strong></td>
                            <td>${new Date(p.fecha).toLocaleString('es-PE')}</td>
                            <td>${p.nombreNegocio}<br><small>${p.nombreContacto || ''}</small></td>
                            <td>${p.producto.nombre}</td>
                            <td>${p.cantidad}kg</td>
                            <td><strong>S/${p.total}</strong></td>
                            <td>${p.metodoPago || 'N/A'}</td>
                            <td>
                                <span class="status-badge ${p.estadoPago === 'Comprobante recibido' ? 'status-comprobante' : 'status-pendiente'}">
                                    ${p.estadoPago || 'Pendiente'}
                                </span>
                            </td>
                            <td>${p.direccion}</td>
                            <td>${p.comprobante ? '✅ Sí' : '❌ No'}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="10" class="empty">No hay pedidos aún. Prueba el bot enviando "hola" por WhatsApp.</td></tr>'}
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
        pedidos: pedidosConfirmados.size,
        imageSupport: true,
        uploadsDir: UPLOADS_DIR
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
    📸 Soporte de imágenes: ACTIVADO
    ⚙️ Twilio: ${twilioConfigured ? '✅ Configurado' : '⚠️ Modo Demo'}
    📁 Carpeta uploads: ${UPLOADS_DIR}
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
