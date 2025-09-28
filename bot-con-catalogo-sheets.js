const express = require('express');
const dotenv = require('dotenv');
const { google } = require('googleapis');

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Configuración de Google Sheets
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const sheets = google.sheets('v4');

// Función para obtener autenticación de Google
async function getAuthClient() {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_CREDENTIALS_PATH || 'credentials.json',
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        return await auth.getClient();
    } catch (error) {
        console.error('Error obteniendo autenticación:', error);
        return null;
    }
}

// Función para obtener catálogo desde Google Sheets
async function obtenerCatalogoSheets() {
    try {
        const authClient = await getAuthClient();
        if (!authClient) {
            console.error('No se pudo autenticar con Google');
            return null;
        }

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'CatalogoWhatsApp!A:I',
            auth: authClient
        });

        const values = response.data.values;
        if (!values || values.length <= 1) {
            console.log('No hay productos en el catálogo');
            return [];
        }

        // Parsear productos (skip header)
        const productos = [];
        for (let i = 1; i < values.length; i++) {
            const row = values[i];
            if (row[8] === 'ACTIVO' && parseFloat(row[6]) > 0) { // Estado ACTIVO y stock > 0
                productos.push({
                    id: row[0] || '',
                    nombre: row[1] || '',
                    precio: parseFloat(row[2]) || 0,
                    origen: row[3] || '',
                    puntaje: row[4] || '',
                    agricultor: row[5] || '',
                    stock: parseFloat(row[6]) || 0,
                    descripcion: row[7] || ''
                });
            }
        }

        console.log(`Catálogo cargado: ${productos.length} productos activos`);
        return productos;
    } catch (error) {
        console.error('Error obteniendo catálogo:', error);
        return null;
    }
}

// Formatear catálogo para WhatsApp
function formatearCatalogo(productos) {
    if (!productos || productos.length === 0) {
        return 'No hay productos disponibles en este momento.\n\nIntenta más tarde o contacta al administrador.';
    }

    let mensaje = '*CATÁLOGO DE CAFÉ DISPONIBLE*\n';
    mensaje += '================================\n\n';

    productos.forEach((p, index) => {
        mensaje += `*${index + 1}. ${p.nombre}*\n`;
        mensaje += `Precio: S/${p.precio} por kg\n`;
        mensaje += `Stock disponible: ${p.stock} kg\n`;
        mensaje += `Origen: ${p.origen}\n`;
        if (p.puntaje) {
            mensaje += `Puntaje: ${p.puntaje}/100\n`;
        }
        if (p.agricultor) {
            mensaje += `Agricultor: ${p.agricultor}\n`;
        }
        if (p.descripcion) {
            mensaje += `Descripción: ${p.descripcion}\n`;
        }
        mensaje += '--------------------------------\n\n';
    });

    mensaje += '*Descuento del 10%* en pedidos mayores a 50kg\n\n';
    mensaje += 'Para hacer un pedido, escribe "pedido" o el número del producto.';

    return mensaje;
}

// Verificar configuración de Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886';

let client = null;
let twilioConfigured = false;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    try {
        const twilio = require('twilio');
        client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        twilioConfigured = true;
        console.log('[OK] Twilio configurado correctamente');
    } catch (error) {
        console.error('[ERROR] Error configurando Twilio:', error.message);
    }
} else {
    console.log('[INFO] Twilio no configurado - Ejecutando en modo demo');
}

// Estado de conversaciones
const userStates = new Map();
const pedidosConfirmados = new Map();

// Cache del catálogo
let catalogoCache = null;
let catalogoCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Función para obtener catálogo con caché
async function obtenerCatalogo() {
    const ahora = Date.now();
    
    // Si el caché es válido, usarlo
    if (catalogoCache && catalogoCacheTime && (ahora - catalogoCacheTime < CACHE_DURATION)) {
        console.log('[CACHE] Usando catálogo en caché');
        return catalogoCache;
    }

    // Si no, obtener nuevo catálogo
    console.log('[UPDATE] Actualizando catálogo desde Google Sheets');
    const nuevoCatalogo = await obtenerCatalogoSheets();
    
    if (nuevoCatalogo) {
        catalogoCache = nuevoCatalogo;
        catalogoCacheTime = ahora;
    }
    
    return catalogoCache || [];
}

// Configuración del negocio
const BUSINESS_CONFIG = {
    name: process.env.BUSINESS_NAME || "Coffee Express",
    phone: process.env.BUSINESS_PHONE || "+51987654321",
    email: process.env.BUSINESS_EMAIL || "ventas@coffeeexpress.com"
};

// Función para enviar mensaje
async function enviarMensaje(to, message) {
    if (!twilioConfigured || !client) {
        console.log(`[MODO DEMO] Mensaje a ${to}:`, message.substring(0, 100) + '...');
        return { sid: 'demo-' + Date.now() };
    }
    
    try {
        const response = await client.messages.create({
            body: message,
            from: TWILIO_PHONE_NUMBER,
            to: to
        });
        console.log(`[OK] Mensaje enviado a ${to}`);
        return response;
    } catch (error) {
        console.error('[ERROR] Error enviando mensaje:', error.message);
        throw error;
    }
}

// Función para manejar mensajes
async function manejarMensaje(from, body) {
    const mensaje = body.trim();
    let userState = userStates.get(from) || { step: 'inicio', data: {} };
    let respuesta = '';

    console.log(`[MENSAJE] De: ${from} | Texto: "${mensaje}" | Estado: ${userState.step}`);

    try {
        const mensajeLower = mensaje.toLowerCase();
        
        // Si escribe "catálogo" en cualquier momento
        if (mensajeLower.includes('catálogo') || mensajeLower.includes('catalogo') || 
            mensajeLower.includes('productos')) {
            
            const catalogo = await obtenerCatalogo();
            respuesta = formatearCatalogo(catalogo);
            userState.step = 'viendo_catalogo';
            userStates.set(from, userState);
            return respuesta;
        }

        switch (userState.step) {
            case 'inicio':
                if (mensajeLower.includes('hola')) {
                    respuesta = `Bienvenido a ${BUSINESS_CONFIG.name}

En qué podemos ayudarte hoy:

1. Ver catálogo de productos
2. Hacer un pedido
3. Consultar estado de pedido
4. Información de contacto
5. Hablar con un asesor

Escribe el número de tu opción`;
                    userState.step = 'menu_principal';
                } else {
                    respuesta = 'Hola, escribe "hola" para comenzar.';
                }
                break;

            case 'menu_principal':
                switch (mensaje) {
                    case '1':
                        const catalogo = await obtenerCatalogo();
                        respuesta = formatearCatalogo(catalogo);
                        userState.step = 'viendo_catalogo';
                        break;

                    case '2':
                        respuesta = 'Cuál es el nombre de tu cafetería o negocio:';
                        userState.step = 'pedido_nombre';
                        break;

                    case '3':
                        respuesta = 'Por favor, ingresa el ID de tu pedido (ejemplo: CAF-123456):';
                        userState.step = 'consulta_pedido';
                        break;

                    case '4':
                        respuesta = `INFORMACIÓN DE CONTACTO

Empresa: ${BUSINESS_CONFIG.name}
WhatsApp: ${BUSINESS_CONFIG.phone}
Email: ${BUSINESS_CONFIG.email}
Horario: Lun-Sab 8:00-18:00

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
                if (mensajeLower.includes('pedido') || mensajeLower === 'sí' || mensajeLower === 'si') {
                    respuesta = 'Cuál es el nombre de tu cafetería o negocio:';
                    userState.step = 'pedido_nombre';
                } else if (mensajeLower.includes('menú') || mensajeLower.includes('menu')) {
                    respuesta = `Menú principal:
1. Catálogo / 2. Pedido / 3. Estado / 4. Info / 5. Asesor`;
                    userState.step = 'menu_principal';
                } else {
                    // Verificar si seleccionó un producto por número
                    const numero = parseInt(mensaje);
                    const catalogo = await obtenerCatalogo();
                    
                    if (!isNaN(numero) && numero > 0 && numero <= catalogo.length) {
                        const productoSeleccionado = catalogo[numero - 1];
                        userState.data.producto = productoSeleccionado;
                        respuesta = `Has seleccionado: *${productoSeleccionado.nombre}*
Precio: S/${productoSeleccionado.precio}/kg
Stock disponible: ${productoSeleccionado.stock}kg

Cuál es el nombre de tu cafetería o negocio:`;
                        userState.step = 'pedido_nombre_con_producto';
                    } else {
                        respuesta = 'Escribe "pedido" para hacer un pedido, el número del producto, o "menú" para volver.';
                    }
                }
                break;

            case 'pedido_nombre_con_producto':
                userState.data.nombreNegocio = mensaje;
                respuesta = `Perfecto, ${mensaje}. 

Ya tienes seleccionado: *${userState.data.producto.nombre}*

Cuántos kilos deseas (mínimo 5kg, máximo ${userState.data.producto.stock}kg disponibles):`;
                userState.step = 'pedido_cantidad';
                break;

            case 'pedido_nombre':
                userState.data.nombreNegocio = mensaje;
                const catalogoPedido = await obtenerCatalogo();
                
                if (catalogoPedido && catalogoPedido.length > 0) {
                    respuesta = `Perfecto, ${mensaje}.\n\n`;
                    respuesta += 'Selecciona un producto:\n\n';
                    
                    catalogoPedido.forEach((p, i) => {
                        respuesta += `${i + 1}. ${p.nombre} - S/${p.precio}/kg\n`;
                    });
                    
                    respuesta += '\nEscribe el número del producto que deseas.';
                    userState.step = 'pedido_producto';
                } else {
                    respuesta = 'Lo sentimos, no hay productos disponibles en este momento. Intenta más tarde.';
                    userState.step = 'menu_principal';
                }
                break;

            case 'pedido_producto':
                const catalogoProducto = await obtenerCatalogo();
                const numProducto = parseInt(mensaje);
                
                if (!isNaN(numProducto) && numProducto > 0 && numProducto <= catalogoProducto.length) {
                    const producto = catalogoProducto[numProducto - 1];
                    userState.data.producto = producto;
                    respuesta = `Has seleccionado: *${producto.nombre}*
Precio: S/${producto.precio}/kg
Stock disponible: ${producto.stock}kg

Cuántos kilos deseas (mínimo 5kg):`;
                    userState.step = 'pedido_cantidad';
                } else {
                    respuesta = 'Por favor, selecciona un número de producto válido.';
                }
                break;

            case 'pedido_cantidad':
                const cantidad = parseFloat(mensaje);
                const productoActual = userState.data.producto;
                
                if (!isNaN(cantidad) && cantidad >= 5) {
                    if (cantidad > productoActual.stock) {
                        respuesta = `Lo sentimos, solo tenemos ${productoActual.stock}kg disponibles.
Cuántos kilos deseas (máximo ${productoActual.stock}kg):`;
                    } else {
                        userState.data.cantidad = cantidad;
                        const subtotal = cantidad * productoActual.precio;
                        const descuento = cantidad >= 50 ? subtotal * 0.1 : 0;
                        const total = subtotal - descuento;
                        
                        userState.data.subtotal = subtotal;
                        userState.data.descuento = descuento;
                        userState.data.total = total;

                        respuesta = `*RESUMEN DEL PEDIDO:*
${productoActual.nombre}
Cantidad: ${cantidad}kg
Subtotal: S/${subtotal.toFixed(2)}
${descuento > 0 ? `Descuento (10%): -S/${descuento.toFixed(2)}` : 'Sin descuento'}
*TOTAL: S/${total.toFixed(2)}*

Cuál es la dirección de entrega:`;
                        userState.step = 'pedido_direccion';
                    }
                } else {
                    respuesta = 'Por favor, ingresa una cantidad válida (mínimo 5kg).';
                }
                break;

            case 'pedido_direccion':
                userState.data.direccion = mensaje;
                respuesta = 'Número de contacto para la entrega:';
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

                respuesta = `*PEDIDO CONFIRMADO*

ID: ${pedidoId}
${userState.data.nombreNegocio}
${userState.data.producto.nombre}
${userState.data.cantidad}kg - S/${userState.data.total.toFixed(2)}

Dirección de entrega: ${userState.data.direccion}
Contacto: ${userState.data.contacto}

Tiempo estimado: 24-48 horas

Guarda tu ID para seguimiento.
Gracias por tu compra.

Escribe "menú" para volver al inicio.`;
                
                userState = { step: 'pedido_completado', data: {} };
                break;

            case 'consulta_pedido':
                const idConsulta = mensaje.toUpperCase();
                if (pedidosConfirmados.has(idConsulta)) {
                    const pedido = pedidosConfirmados.get(idConsulta);
                    respuesta = `*ESTADO DEL PEDIDO ${idConsulta}*

Cliente: ${pedido.nombreNegocio}
Producto: ${pedido.producto.nombre}
Cantidad: ${pedido.cantidad}kg
Total: S/${pedido.total.toFixed(2)}
Estado: ${pedido.estado}
Fecha: ${pedido.fecha.toLocaleDateString()}

Escribe "menú" para volver.`;
                } else {
                    respuesta = `No se encontró el pedido ${idConsulta}.
Verifica el ID e intenta nuevamente.

Escribe "menú" para volver.`;
                }
                userState.step = 'consulta_completada';
                break;

            default:
                if (mensajeLower.includes('menú') || mensajeLower.includes('menu')) {
                    respuesta = `Menú principal:
1. Catálogo / 2. Pedido / 3. Estado / 4. Info / 5. Asesor`;
                    userState.step = 'menu_principal';
                } else if (mensajeLower.includes('catálogo') || mensajeLower.includes('catalogo')) {
                    const catalogoDefault = await obtenerCatalogo();
                    respuesta = formatearCatalogo(catalogoDefault);
                    userState.step = 'viendo_catalogo';
                } else {
                    respuesta = 'No entendí tu mensaje. Escribe "menú" para ver opciones.';
                }
        }

        userStates.set(from, userState);
        return respuesta;
    } catch (error) {
        console.error('Error procesando mensaje:', error);
        return 'Ocurrió un error. Por favor, escribe "menú" para reiniciar.';
    }
}

// Webhook de Twilio
app.post('/webhook', async (req, res) => {
    if (!twilioConfigured) {
        console.log('[INFO] Webhook recibido pero Twilio no está configurado');
        return res.status(200).send('OK - Modo Demo');
    }
    
    const { From, Body } = req.body;
    
    console.log(`[WEBHOOK] Mensaje recibido de ${From}: ${Body}`);
    
    try {
        const respuesta = await manejarMensaje(From, Body);
        await enviarMensaje(From, respuesta);
        res.status(200).send('OK');
    } catch (error) {
        console.error('Error en webhook:', error);
        res.status(200).send('OK');
    }
});

// Endpoint de prueba
app.post('/test-message', async (req, res) => {
    const { from, body } = req.body;
    const response = await manejarMensaje(from, body);
    res.json({ response });
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
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                .chat-container { border: 1px solid #ddd; border-radius: 10px; padding: 20px; height: 400px; overflow-y: scroll; background: #f9f9f9; }
                .message { margin: 10px 0; padding: 10px; border-radius: 10px; }
                .user { background: #667eea; color: white; text-align: right; }
                .bot { background: white; border: 1px solid #ddd; }
                input { width: 100%; padding: 10px; margin-top: 20px; border: 1px solid #ddd; border-radius: 5px; }
                button { width: 100%; padding: 10px; margin-top: 10px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; }
            </style>
        </head>
        <body>
            <h1>Probar Bot</h1>
            <div class="chat-container" id="chat">
                <div class="message bot">Hola, escribe "hola" para comenzar.</div>
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
                    
                    chat.innerHTML += '<div class="message user">' + mensaje + '</div>';
                    input.value = '';
                    
                    const response = await fetch('/test-message', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ from: userPhone, body: mensaje })
                    });
                    
                    const data = await response.json();
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

// Ruta principal
app.get('/', (req, res) => {
    const twilioStatus = twilioConfigured 
        ? `Configurado (${TWILIO_PHONE_NUMBER})`
        : 'No configurado - Modo Demo';
    
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
                <h1>Coffee Express WhatsApp Bot</h1>
                
                <div class="status">
                    <p class="${twilioConfigured ? 'ok' : 'warning'}">
                        Estado del Bot: ${twilioConfigured ? 'Activo y funcionando' : 'Modo Demo'}
                    </p>
                    <p class="info">WhatsApp: ${twilioStatus}</p>
                    <p class="info">Negocio: ${BUSINESS_CONFIG.name}</p>
                    <p class="info">Email: ${BUSINESS_CONFIG.email}</p>
                    <p class="info">Google Sheets: ${SPREADSHEET_ID ? 'Configurado' : 'No configurado'}</p>
                </div>
                
                <div class="center">
                    <a href="/test" class="button">Probar Bot</a>
                    <a href="/health" class="button">Health Check</a>
                </div>
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
        environment: process.env.NODE_ENV || 'development',
        twilio: twilioConfigured ? 'configured' : 'not configured',
        sheets: SPREADSHEET_ID ? 'configured' : 'not configured',
        catalogoCacheStatus: catalogoCache ? 'cached' : 'empty'
    });
});

// Puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`
    ========================================
    Bot de WhatsApp iniciado
    Puerto: ${PORT}
    URL: http://localhost:${PORT}
    Webhook: /webhook
    Test: /test
    Twilio: ${twilioConfigured ? '[OK] Configurado' : '[INFO] Modo Demo'}
    Google Sheets: ${SPREADSHEET_ID ? '[OK] Configurado' : '[PENDIENTE] No configurado'}
    ========================================
    `);
    
    if (!twilioConfigured) {
        console.log(`
    IMPORTANTE: El bot está en modo demo
    Para activar WhatsApp, configura:
    - TWILIO_ACCOUNT_SID
    - TWILIO_AUTH_TOKEN
    `);
    }
    
    if (!SPREADSHEET_ID) {
        console.log(`
    IMPORTANTE: Google Sheets no configurado
    Para activar el catálogo desde Sheets:
    - Configura SPREADSHEET_ID
    - Configura GOOGLE_CREDENTIALS_PATH
    `);
    }
    
    // Cargar catálogo inicial
    obtenerCatalogo().then(catalogo => {
        if (catalogo && catalogo.length > 0) {
            console.log(`[OK] Catálogo inicial cargado: ${catalogo.length} productos`);
        } else {
            console.log('[INFO] No se pudo cargar el catálogo inicial');
        }
    });
});

module.exports = app;