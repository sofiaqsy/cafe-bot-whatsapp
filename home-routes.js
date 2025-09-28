/**
 * Home and Test Routes
 * Landing pages and testing endpoints
 */

const express = require('express');
const router = express.Router();
const config = require('./config');
const stateManager = require('./state-manager');

/**
 * GET /
 * Home page
 */
router.get('/', (req, res) => {
    const stats = stateManager.getStats();
    
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.business.name} - Bot de WhatsApp</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        h1 {
            color: #333;
            font-size: 2.5em;
            margin-bottom: 10px;
            text-align: center;
        }
        
        .subtitle {
            color: #666;
            text-align: center;
            font-size: 1.2em;
            margin-bottom: 30px;
        }
        
        .status {
            background: #f7f7f7;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .status-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .status-item:last-child {
            border-bottom: none;
        }
        
        .status-label {
            color: #666;
            font-weight: 500;
        }
        
        .status-value {
            color: #333;
            font-weight: bold;
        }
        
        .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 15px;
            font-size: 0.9em;
        }
        
        .status-badge.active {
            background: #d1fae5;
            color: #065f46;
        }
        
        .status-badge.inactive {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .links {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 30px;
        }
        
        .link-card {
            background: #f7f7f7;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            text-decoration: none;
            color: #333;
            transition: all 0.3s;
        }
        
        .link-card:hover {
            background: #667eea;
            color: white;
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        .link-card .icon {
            font-size: 2em;
            margin-bottom: 10px;
        }
        
        .link-card .label {
            font-weight: 600;
            font-size: 1.1em;
        }
        
        .whatsapp-section {
            background: #25d366;
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-top: 30px;
            text-align: center;
        }
        
        .whatsapp-section h3 {
            font-size: 1.5em;
            margin-bottom: 10px;
        }
        
        .whatsapp-number {
            font-size: 1.3em;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .info {
            background: #fef3c7;
            color: #92400e;
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
        }
        
        .info-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>☕ ${config.business.name}</h1>
        <p class="subtitle">Sistema de Pedidos por WhatsApp</p>
        
        <div class="status">
            <div class="status-item">
                <span class="status-label">🟢 Estado del Bot</span>
                <span class="status-value">
                    <span class="status-badge active">Activo</span>
                </span>
            </div>
            <div class="status-item">
                <span class="status-label">📊 Versión</span>
                <span class="status-value">${config.app.version}</span>
            </div>
            <div class="status-item">
                <span class="status-label">⚙️ Modo</span>
                <span class="status-value">${config.app.isDevelopment ? 'Desarrollo' : 'Producción'}</span>
            </div>
            <div class="status-item">
                <span class="status-label">📦 Pedidos Activos</span>
                <span class="status-value">${stats.totalOrders}</span>
            </div>
            <div class="status-item">
                <span class="status-label">👥 Clientes</span>
                <span class="status-value">${stats.registeredCustomers}</span>
            </div>
        </div>
        
        <div class="links">
            <a href="/test" class="link-card">
                <div class="icon">🧪</div>
                <div class="label">Probar Bot</div>
            </a>
            <a href="/admin" class="link-card">
                <div class="icon">📊</div>
                <div class="label">Admin Panel</div>
            </a>
            <a href="/health" class="link-card">
                <div class="icon">💚</div>
                <div class="label">Health Check</div>
            </a>
            <a href="/webhook" class="link-card">
                <div class="icon">🔗</div>
                <div class="label">Webhook Info</div>
            </a>
        </div>
        
        <div class="whatsapp-section">
            <h3>📱 Contáctanos por WhatsApp</h3>
            <p>Envía un mensaje para empezar tu pedido:</p>
            <div class="whatsapp-number">+14155238886</div>
            <p>Escribe "Hola" para comenzar</p>
        </div>
        
        <div class="info">
            <div class="info-title">ℹ️ Información del Sistema</div>
            <p>Horario de atención: ${config.business.horario}</p>
            <p>Email: ${config.business.email}</p>
        </div>
    </div>
</body>
</html>
    `;
    
    res.send(html);
});

/**
 * GET /test
 * Test page for simulating messages
 */
router.get('/test', (req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Bot - ${config.business.name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f0f2f5;
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 500px;
            margin: 0 auto;
        }
        
        .header {
            background: #075e54;
            color: white;
            padding: 20px;
            border-radius: 10px 10px 0 0;
            text-align: center;
        }
        
        .chat-container {
            background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAASklEQVQYlWNgYGBgKD/6/z8DEwMDw38GBgYGFhYWBgYGBgY2NjYGBgYGBgYGBgZ2dnYGBgYGBgYGBgYODg4GBgYGBgYGBgYWFhYGBgYGBgCCugcKs0Hq2AAAAABJRU5ErkJggg==');
            background-color: #e5ddd5;
            min-height: 400px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .message {
            max-width: 70%;
            padding: 10px 15px;
            border-radius: 10px;
            word-wrap: break-word;
        }
        
        .message.user {
            background: #dcf8c6;
            align-self: flex-end;
            margin-left: auto;
        }
        
        .message.bot {
            background: white;
            align-self: flex-start;
        }
        
        .input-container {
            background: white;
            padding: 15px;
            border-radius: 0 0 10px 10px;
            display: flex;
            gap: 10px;
        }
        
        #messageInput {
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 25px;
            outline: none;
        }
        
        #sendButton {
            padding: 10px 20px;
            background: #25d366;
            color: white;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-weight: bold;
        }
        
        #sendButton:hover {
            background: #128c7e;
        }
        
        .quick-replies {
            display: flex;
            gap: 10px;
            margin-top: 10px;
            flex-wrap: wrap;
        }
        
        .quick-reply {
            padding: 8px 15px;
            background: #e3f2fd;
            border: 1px solid #2196f3;
            color: #2196f3;
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.9em;
        }
        
        .quick-reply:hover {
            background: #2196f3;
            color: white;
        }
        
        .back-link {
            display: inline-block;
            margin-bottom: 20px;
            color: #075e54;
            text-decoration: none;
            font-weight: 500;
        }
        
        .back-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="/" class="back-link">← Volver al inicio</a>
        
        <div class="header">
            <h2>🧪 Test del Bot</h2>
            <p>Simula una conversación de WhatsApp</p>
        </div>
        
        <div id="chatContainer" class="chat-container">
            <div class="message bot">
                ¡Hola! 👋 Soy el bot de ${config.business.name}. 
                Escribe "hola" o usa los botones rápidos para empezar.
            </div>
        </div>
        
        <div class="input-container">
            <input type="text" id="messageInput" placeholder="Escribe un mensaje..." />
            <button id="sendButton">Enviar</button>
        </div>
        
        <div class="quick-replies">
            <button class="quick-reply" onclick="sendQuickReply('hola')">Hola</button>
            <button class="quick-reply" onclick="sendQuickReply('1')">Ver catálogo</button>
            <button class="quick-reply" onclick="sendQuickReply('2')">Estado pedido</button>
            <button class="quick-reply" onclick="sendQuickReply('0')">Hablar con asesor</button>
        </div>
    </div>
    
    <script>
        const chatContainer = document.getElementById('chatContainer');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const testPhone = 'whatsapp:+51999999999';
        
        function addMessage(text, isUser) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + (isUser ? 'user' : 'bot');
            messageDiv.textContent = text;
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        
        async function sendMessage() {
            const message = messageInput.value.trim();
            if (!message) return;
            
            addMessage(message, true);
            messageInput.value = '';
            
            try {
                const response = await fetch('/webhook', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        From: testPhone,
                        Body: message
                    })
                });
                
                if (response.ok) {
                    setTimeout(() => {
                        addMessage('✅ Mensaje procesado. En modo producción recibirías la respuesta por WhatsApp.', false);
                    }, 1000);
                } else {
                    addMessage('❌ Error al procesar el mensaje', false);
                }
            } catch (error) {
                addMessage('❌ Error de conexión: ' + error.message, false);
            }
        }
        
        function sendQuickReply(text) {
            messageInput.value = text;
            sendMessage();
        }
        
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    </script>
</body>
</html>
    `;
    
    res.send(html);
});

/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    const serviceInitializer = require('./service-initializer');
    const status = serviceInitializer.getStatus();
    const stats = stateManager.getStats();
    
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: config.app.version,
        environment: config.app.environment,
        services: status,
        statistics: stats
    });
});

/**
 * GET /debug/orders
 * Debug endpoint to show all orders
 */
router.get('/debug/orders', (req, res) => {
    const orders = Array.from(stateManager.confirmedOrders.entries()).map(([id, order]) => ({
        id,
        userId: order.userId,
        telefono: order.telefono,
        estado: order.status || order.estado,
        empresa: order.empresa,
        producto: order.producto?.nombre,
        total: order.total,
        fecha: order.timestamp || order.fecha
    }));
    
    res.json({
        totalOrders: orders.length,
        orders: orders,
        debug: {
            message: 'Para ver más detalles, revisa los logs del servidor',
            tip: 'Los pedidos pendientes deben tener estado: Pendiente verificación'
        }
    });
    
    // También imprimir en consola
    stateManager.debugShowAllOrders();
});

/**
 * GET /debug/test-order
 * Crear un pedido de prueba
 */
router.get('/debug/test-order', (req, res) => {
    const testUserId = req.query.user || 'whatsapp:+51936934501';
    const testOrderId = 'TEST-' + Date.now().toString().slice(-6);
    
    const testOrder = {
        id: testOrderId,
        userId: testUserId,
        telefono: testUserId,
        fecha: new Date(),
        timestamp: new Date(),
        producto: {
            nombre: 'Café Arábica Premium (TEST)',
            precio: 50
        },
        cantidad: 10,
        total: 500,
        empresa: 'Empresa de Prueba',
        contacto: 'Contacto Test',
        direccion: 'Dirección de prueba',
        status: 'Pendiente verificación',
        estado: 'Pendiente verificación',
        comprobanteRecibido: false
    };
    
    stateManager.addConfirmedOrder(testOrderId, testOrder);
    
    // Buscar inmediatamente
    const found = stateManager.getUserOrders(testUserId);
    
    res.json({
        message: 'Pedido de prueba creado',
        orderId: testOrderId,
        userId: testUserId,
        orderCreated: testOrder,
        searchResult: {
            found: found.length > 0,
            ordersFound: found.length,
            details: found
        }
    });
});

/**
 * GET /debug/search
 * Buscar pedidos de un usuario
 */
router.get('/debug/search/:userId', (req, res) => {
    const userId = decodeURIComponent(req.params.userId);
    const orders = stateManager.getUserOrders(userId);
    const pendingOrders = stateManager.getPendingOrders(userId);
    
    res.json({
        userId: userId,
        totalOrders: orders.length,
        pendingOrders: pendingOrders.length,
        orders: orders.map(o => ({
            id: o.id,
            estado: o.status || o.estado,
            total: o.total,
            fecha: o.timestamp || o.fecha
        }))
    });
});

module.exports = router;
