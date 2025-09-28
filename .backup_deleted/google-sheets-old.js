const { google } = require('googleapis');

class GoogleSheetsIntegration {
    constructor() {
        this.auth = null;
        this.sheets = null;
        this.drive = null;
        this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
        this.initialized = false;
    }

    async initialize() {
        try {
            // Verificar si hay credenciales configuradas
            if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY && !process.env.GOOGLE_CREDENTIALS) {
                console.log('⚠️ Google Sheets no configurado - Se requieren credenciales');
                return false;
            }

            if (!this.spreadsheetId) {
                console.log('⚠️ GOOGLE_SPREADSHEET_ID no configurado');
                return false;
            }

            // Parsear credenciales
            let credentials;
            try {
                credentials = JSON.parse(
                    process.env.GOOGLE_SERVICE_ACCOUNT_KEY || 
                    process.env.GOOGLE_CREDENTIALS
                );
            } catch (error) {
                console.error('❌ Error parseando credenciales de Google:', error.message);
                return false;
            }

            // Configurar autenticación
            this.auth = new google.auth.GoogleAuth({
                credentials: credentials,
                scopes: [
                    'https://www.googleapis.com/auth/spreadsheets',
                    'https://www.googleapis.com/auth/drive'
                ]
            });

            // Inicializar servicios
            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            this.drive = google.drive({ version: 'v3', auth: this.auth });

            // Verificar acceso al spreadsheet
            try {
                await this.sheets.spreadsheets.get({
                    spreadsheetId: this.spreadsheetId
                });
                console.log('✅ Google Sheets conectado correctamente');
                console.log(`📊 Spreadsheet ID: ${this.spreadsheetId}`);
                this.initialized = true;
                
                // Crear hoja de WhatsApp si no existe
                await this.crearHojaWhatsApp();
                
                return true;
            } catch (error) {
                console.error('❌ Error accediendo al spreadsheet:', error.message);
                console.log('   Verifica que el Service Account tenga permisos de edición');
                return false;
            }
        } catch (error) {
            console.error('❌ Error inicializando Google Sheets:', error);
            return false;
        }
    }

    async crearHojaWhatsApp() {
        if (!this.initialized) return false;
        
        try {
            // Obtener lista de hojas
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId
            });

            const sheets = response.data.sheets || [];
            const hojaWhatsApp = sheets.find(sheet => 
                sheet.properties.title === 'PedidosWhatsApp'
            );

            if (!hojaWhatsApp) {
                console.log('📝 Creando hoja PedidosWhatsApp...');
                
                // Crear nueva hoja
                await this.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: this.spreadsheetId,
                    requestBody: {
                        requests: [{
                            addSheet: {
                                properties: {
                                    title: 'PedidosWhatsApp',
                                    gridProperties: {
                                        rowCount: 1000,
                                        columnCount: 20
                                    }
                                }
                            }
                        }]
                    }
                });

                // Agregar encabezados
                const headers = [[
                    'ID_Pedido',
                    'Fecha',
                    'Hora',
                    'Cliente',
                    'Cafetería',
                    'Teléfono',
                    'Producto',
                    'Cantidad_kg',
                    'Precio_Unitario',
                    'Subtotal',
                    'Descuento',
                    'Total',
                    'Dirección',
                    'Contacto',
                    'Observaciones',
                    'Estado',
                    'Fecha_Entrega',
                    'Método_Pago',
                    'Origen'
                ]];

                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: this.spreadsheetId,
                    range: 'PedidosWhatsApp!A1:S1',
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: headers }
                });

                console.log('✅ Hoja PedidosWhatsApp creada con éxito');
            } else {
                console.log('✅ Hoja PedidosWhatsApp ya existe');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error creando hoja WhatsApp:', error.message);
            return false;
        }
    }

    async agregarPedido(pedidoData) {
        if (!this.initialized) {
            console.log('⚠️ Google Sheets no inicializado');
            return false;
        }

        try {
            const fecha = new Date();
            const fechaStr = fecha.toISOString().split('T')[0];
            const horaStr = fecha.toTimeString().split(' ')[0];
            const fechaEntrega = new Date(fecha.getTime() + 24 * 60 * 60 * 1000);

            const values = [[
                pedidoData.id,
                fechaStr,
                horaStr,
                pedidoData.nombreNegocio || '',
                pedidoData.cafeteria || pedidoData.nombreNegocio || '',
                pedidoData.telefono || '',
                pedidoData.producto?.nombre || '',
                pedidoData.cantidad || 0,
                pedidoData.producto?.precio || 0,
                pedidoData.subtotal || 0,
                pedidoData.descuento || 0,
                pedidoData.total || 0,
                pedidoData.direccion || '',
                pedidoData.contacto || '',
                pedidoData.observaciones || '',
                pedidoData.estado || 'Confirmado',
                fechaEntrega.toISOString().split('T')[0],
                pedidoData.metodoPago || 'Por definir',
                'WhatsApp'
            ]];

            const response = await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'PedidosWhatsApp!A:S',
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                requestBody: { values }
            });

            console.log(`✅ Pedido ${pedidoData.id} guardado en Google Sheets`);
            return true;
        } catch (error) {
            console.error('❌ Error guardando pedido en Sheets:', error.message);
            return false;
        }
    }

    async leerPedidos(limite = 50) {
        if (!this.initialized) return [];

        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'PedidosWhatsApp!A2:S'
            });

            const rows = response.data.values || [];
            
            const pedidos = rows.map(row => ({
                id: row[0],
                fecha: row[1],
                hora: row[2],
                cliente: row[3],
                cafeteria: row[4],
                telefono: row[5],
                producto: row[6],
                cantidad: parseFloat(row[7]) || 0,
                precioUnitario: parseFloat(row[8]) || 0,
                subtotal: parseFloat(row[9]) || 0,
                descuento: parseFloat(row[10]) || 0,
                total: parseFloat(row[11]) || 0,
                direccion: row[12],
                contacto: row[13],
                observaciones: row[14],
                estado: row[15],
                fechaEntrega: row[16],
                metodoPago: row[17],
                origen: row[18]
            }));

            // Retornar los últimos pedidos según el límite
            return pedidos.slice(-limite).reverse();
        } catch (error) {
            console.error('❌ Error leyendo pedidos:', error.message);
            return [];
        }
    }

    async actualizarEstadoPedido(pedidoId, nuevoEstado) {
        if (!this.initialized) return false;

        try {
            // Primero buscar el pedido
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'PedidosWhatsApp!A:A'
            });

            const ids = response.data.values || [];
            const rowIndex = ids.findIndex(row => row[0] === pedidoId);

            if (rowIndex === -1) {
                console.log(`⚠️ Pedido ${pedidoId} no encontrado`);
                return false;
            }

            // Actualizar el estado (columna P = columna 16)
            const updateRange = `PedidosWhatsApp!P${rowIndex + 1}`;
            
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: updateRange,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[nuevoEstado]]
                }
            });

            console.log(`✅ Estado del pedido ${pedidoId} actualizado a ${nuevoEstado}`);
            return true;
        } catch (error) {
            console.error('❌ Error actualizando estado:', error.message);
            return false;
        }
    }

    async obtenerEstadisticas() {
        if (!this.initialized) return null;

        try {
            const pedidos = await this.leerPedidos(100);
            const hoy = new Date().toISOString().split('T')[0];
            
            const pedidosHoy = pedidos.filter(p => p.fecha === hoy);
            
            const stats = {
                totalPedidos: pedidos.length,
                pedidosHoy: pedidosHoy.length,
                ventasHoy: pedidosHoy.reduce((sum, p) => sum + p.total, 0),
                kilosHoy: pedidosHoy.reduce((sum, p) => sum + p.cantidad, 0),
                productoMasVendido: this.obtenerProductoMasVendido(pedidos),
                clientesHoy: [...new Set(pedidosHoy.map(p => p.cafeteria))].length
            };

            return stats;
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error.message);
            return null;
        }
    }

    obtenerProductoMasVendido(pedidos) {
        const productos = {};
        
        pedidos.forEach(p => {
            if (p.producto) {
                productos[p.producto] = (productos[p.producto] || 0) + p.cantidad;
            }
        });

        let maxProducto = '';
        let maxCantidad = 0;
        
        for (const [producto, cantidad] of Object.entries(productos)) {
            if (cantidad > maxCantidad) {
                maxCantidad = cantidad;
                maxProducto = producto;
            }
        }

        return { nombre: maxProducto, cantidad: maxCantidad };
    }

    async verificarConexion() {
        if (!this.initialized) {
            await this.initialize();
        }
        return this.initialized;
    }
}

// Singleton
const googleSheets = new GoogleSheetsIntegration();

module.exports = googleSheets;
