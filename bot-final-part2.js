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
                            <td>${p.metodoPago || 'Transferencia'}</td>
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
    🚀 Bot de WhatsApp iniciado - v3.0
    📍 Puerto: ${PORT}
    🌐 URL: http://localhost:${PORT}
    📱 Webhook: /webhook
    🔧 Test: /test
    📊 Admin: /admin
    ⚙️ Modo: ${DEV_MODE ? '🔧 DESARROLLO' : '✅ PRODUCCIÓN'}
    ☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕☕
    
    ${DEV_MODE ? '💡 Los mensajes se mostrarán en la consola\n' : ''}
    
    🆕 NUEVAS FUNCIONALIDADES:
    ✅ Pedido actual visible en el menú
    ✅ Comando "cancelar" para eliminar pedido
    ✅ Solo pago por transferencia bancaria
    ✅ Datos BCP: ${BUSINESS_CONFIG.bcp_cuenta}
    ✅ CCI: ${BUSINESS_CONFIG.cci_cuenta}
    `);
});

module.exports = app;
