/**
 * Admin Route Handler
 * Admin dashboard for viewing orders and statistics
 */

const express = require('express');
const router = express.Router();
const stateManager = require('./state-manager');
const config = require('./config');
const { ORDER_STATES } = require('./order-states');

/**
 * GET /admin
 * Admin dashboard
 */
router.get('/', (req, res) => {
    const stats = stateManager.getStats();
    const orders = Array.from(stateManager.confirmedOrders.values());
    
    // Calculate totals
    const totalSales = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalKilos = orders.reduce((sum, o) => sum + (o.cantidad || 0), 0);
    const todayOrders = orders.filter(o => {
        const orderDate = new Date(o.fecha || o.timestamp);
        const today = new Date();
        return orderDate.toDateString() === today.toDateString();
    });
    
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - ${config.business.name}</title>
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
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            color: #333;
            font-size: 2em;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #666;
            font-size: 1.1em;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.08);
            transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }
        
        .stat-card .label {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        
        .stat-card .value {
            color: #333;
            font-size: 2.5em;
            font-weight: bold;
        }
        
        .stat-card .change {
            color: #10b981;
            font-size: 0.9em;
            margin-top: 5px;
        }
        
        .stat-card.primary {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
        }
        
        .stat-card.primary .label {
            color: rgba(255,255,255,0.9);
        }
        
        .stat-card.primary .value {
            color: white;
        }
        
        .orders-table {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.08);
            overflow-x: auto;
        }
        
        .orders-table h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.5em;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th {
            background: #f7f7f7;
            color: #666;
            font-weight: 600;
            text-align: left;
            padding: 15px;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        td {
            padding: 15px;
            border-top: 1px solid #e5e5e5;
            color: #333;
        }
        
        tr:hover {
            background: #f9f9f9;
        }
        
        .badge {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
        }
        
        .badge.pending {
            background: #fef3c7;
            color: #92400e;
        }
        
        .badge.confirmed {
            background: #d1fae5;
            color: #065f46;
        }
        
        .badge.paid {
            background: #dbeafe;
            color: #1e40af;
        }
        
        .badge.reorder {
            background: #e9d5ff;
            color: #6b21a8;
        }
        
        .empty-state {
            text-align: center;
            padding: 60px;
            color: #999;
        }
        
        .empty-state svg {
            width: 100px;
            height: 100px;
            margin-bottom: 20px;
            opacity: 0.3;
        }
        
        .actions {
            margin-bottom: 20px;
            display: flex;
            gap: 10px;
        }
        
        .btn {
            padding: 10px 20px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1em;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
        
        .btn:hover {
            background: #5a67d8;
        }
        
        .btn.secondary {
            background: #e5e5e5;
            color: #333;
        }
        
        .btn.secondary:hover {
            background: #d4d4d4;
        }
        
        @media (max-width: 768px) {
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            table {
                font-size: 0.9em;
            }
            
            th, td {
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Dashboard Administrativo</h1>
            <p>${config.business.name} - Sistema de Gestión de Pedidos</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card primary">
                <div class="label">Ventas Totales</div>
                <div class="value">S/${totalSales.toFixed(2)}</div>
                <div class="change">📈 Este mes</div>
            </div>
            
            <div class="stat-card">
                <div class="label">Total Pedidos</div>
                <div class="value">${orders.length}</div>
                <div class="change">📦 Todos los tiempos</div>
            </div>
            
            <div class="stat-card">
                <div class="label">Kg Vendidos</div>
                <div class="value">${totalKilos}</div>
                <div class="change">☕ Total café</div>
            </div>
            
            <div class="stat-card">
                <div class="label">Clientes</div>
                <div class="value">${stats.registeredCustomers}</div>
                <div class="change">👥 Registrados</div>
            </div>
            
            <div class="stat-card">
                <div class="label">Pedidos Hoy</div>
                <div class="value">${todayOrders.length}</div>
                <div class="change">📅 ${new Date().toLocaleDateString('es-PE')}</div>
            </div>
            
            <div class="stat-card">
                <div class="label">Pendientes</div>
                <div class="value" style="color: #f59e0b;">${stats.pendingOrders}</div>
                <div class="change">⏳ Verificación</div>
            </div>
        </div>
        
        <div class="orders-table">
            <div class="actions">
                <a href="/" class="btn secondary">← Volver</a>
                <button class="btn" onclick="location.reload()">🔄 Actualizar</button>
            </div>
            
            <h2>Pedidos Recientes</h2>
            
            ${orders.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Total</th>
                            <th>Tipo</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.reverse().slice(0, 50).map(order => `
                            <tr>
                                <td><strong>${order.id}</strong></td>
                                <td>${new Date(order.fecha || order.timestamp).toLocaleString('es-PE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</td>
                                <td>
                                    <strong>${order.empresa || 'Sin nombre'}</strong><br>
                                    <small>${order.telefono}</small>
                                </td>
                                <td>${order.producto?.nombre || 'Producto'}</td>
                                <td>${order.cantidad || 0} kg</td>
                                <td><strong>S/${(order.total || 0).toFixed(2)}</strong></td>
                                <td>
                                    ${order.esReorden ? 
                                        '<span class="badge reorder">REORDEN</span>' : 
                                        '<span class="badge">NUEVO</span>'
                                    }
                                </td>
                                <td>
                                    ${order.status === 'Pago recibido - En verificación' ?
                                        '<span class="badge paid">💳 Pago recibido</span>' :
                                        order.status === 'Confirmado' || order.estado === 'Confirmado' ?
                                        '<span class="badge confirmed">✓ Confirmado</span>' :
                                        '<span class="badge pending">⏳ Pendiente</span>'
                                    }
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : `
                <div class="empty-state">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2">
                        </path>
                    </svg>
                    <h3>No hay pedidos aún</h3>
                    <p>Los pedidos aparecerán aquí cuando los clientes realicen compras.</p>
                </div>
            `}
        </div>
    </div>
    
    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>
    `;
    
    res.send(html);
});

module.exports = router;
