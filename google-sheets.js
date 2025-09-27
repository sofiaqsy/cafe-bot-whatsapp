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
                
                // Crear hojas necesarias si no existen
                await this.crearHojasNecesarias();
                
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

    async crearHojasNecesarias() {
        if (!this.initialized) return false;
        
        try {
            // Obtener lista de hojas
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId
            });

            const sheets = response.data.sheets || [];
            const nombresHojas = sheets.map(sheet => sheet.properties.title);
            
            // Crear hoja de Pedidos si no existe
            if (!nombresHojas.includes('PedidosWhatsApp')) {
                await this.crearHojaPedidos();
            }
            
            // Crear hoja de Clientes si no existe
            if (!nombresHojas.includes('Clientes')) {
                await this.crearHojaClientes();
            }
            
            return true;
        } catch (error) {
            console.error('Error creando hojas:', error.message);
            return false;
        }
    }

    async crearHojaPedidos() {
        console.log('📝 Creando hoja PedidosWhatsApp...');
        
        try {
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
            const headers = [
                'ID Pedido',
                'Fecha',
                'Hora',
                'Empresa',
                'Contacto',
                'Teléfono',
                'Dirección',
                'Producto',
                'Cantidad (kg)',
                'Precio Unit.',
                'Subtotal',
                'Descuento',
                'Total',
                'Método Pago',
                'Estado',
                'Comprobante',
                'Observaciones',
                'Tipo',
                'ID Cliente',
                'Usuario WhatsApp'
            ];

            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: 'PedidosWhatsApp!A1:T1',
                valueInputOption: 'RAW',
                requestBody: {
                    values: [headers]
                }
            });

            console.log('✅ Hoja PedidosWhatsApp creada');
        } catch (error) {
            console.error('Error creando hoja de pedidos:', error.message);
        }
    }

    async crearHojaClientes() {
        console.log('📝 Creando hoja Clientes...');
        
        try {
            // Crear nueva hoja
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.spreadsheetId,
                requestBody: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: 'Clientes',
                                gridProperties: {
                                    rowCount: 1000,
                                    columnCount: 15
                                }
                            }
                        }
                    }]
                }
            });

            // Agregar encabezados
            const headers = [
                'ID Cliente',
                'WhatsApp',
                'Empresa/Negocio',
                'Nombre Contacto',
                'Teléfono Contacto',
                'Email',
                'Dirección',
                'Distrito',
                'Ciudad',
                'Fecha Registro',
                'Última Compra',
                'Total Pedidos',
                'Total Comprado (S/)',
                'Total Kg',
                'Notas'
            ];

            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: 'Clientes!A1:O1',
                valueInputOption: 'RAW',
                requestBody: {
                    values: [headers]
                }
            });

            // Aplicar formato a los encabezados
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.spreadsheetId,
                requestBody: {
                    requests: [{
                        repeatCell: {
                            range: {
                                sheetId: this.obtenerSheetId('Clientes'),
                                startRowIndex: 0,
                                endRowIndex: 1
                            },
                            cell: {
                                userEnteredFormat: {
                                    backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
                                    textFormat: { 
                                        foregroundColor: { red: 1, green: 1, blue: 1 },
                                        bold: true 
                                    }
                                }
                            },
                            fields: 'userEnteredFormat(backgroundColor,textFormat)'
                        }
                    }]
                }
            }).catch(() => {}); // Ignorar error de formato

            console.log('✅ Hoja Clientes creada');
        } catch (error) {
            console.error('Error creando hoja de clientes:', error.message);
        }
    }

    async obtenerSheetId(nombreHoja) {
        try {
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId
            });
            
            const hoja = response.data.sheets.find(
                sheet => sheet.properties.title === nombreHoja
            );
            
            return hoja ? hoja.properties.sheetId : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Buscar cliente por teléfono WhatsApp
     */
    async buscarCliente(telefonoWhatsApp) {
        if (!this.initialized) return null;
        
        try {
            // Normalizar teléfono
            const telefonoNormalizado = telefonoWhatsApp
                .replace('whatsapp:', '')
                .replace(/[^0-9+]/g, '');
            
            // Obtener todos los clientes
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Clientes!A:O'
            });
            
            if (!response.data.values || response.data.values.length <= 1) {
                console.log('📊 No hay clientes registrados');
                return null;
            }
            
            // Buscar cliente por teléfono
            const clientes = response.data.values.slice(1); // Omitir encabezados
            const clienteRow = clientes.find(row => {
                const telCliente = row[1] ? row[1].replace(/[^0-9+]/g, '') : '';
                return telCliente === telefonoNormalizado;
            });
            
            if (clienteRow) {
                console.log(`✅ Cliente encontrado: ${clienteRow[2]}`);
                return {
                    idCliente: clienteRow[0],
                    whatsapp: clienteRow[1],
                    empresa: clienteRow[2],
                    contacto: clienteRow[3],
                    telefonoContacto: clienteRow[4],
                    email: clienteRow[5],
                    direccion: clienteRow[6],
                    distrito: clienteRow[7],
                    ciudad: clienteRow[8],
                    fechaRegistro: clienteRow[9],
                    ultimaCompra: clienteRow[10],
                    totalPedidos: parseInt(clienteRow[11] || '0'),
                    totalComprado: parseFloat(clienteRow[12] || '0'),
                    totalKg: parseFloat(clienteRow[13] || '0'),
                    notas: clienteRow[14]
                };
            }
            
            console.log(`ℹ️ Cliente no encontrado: ${telefonoNormalizado}`);
            return null;
        } catch (error) {
            console.error('Error buscando cliente:', error.message);
            return null;
        }
    }

    /**
     * Guardar o actualizar cliente
     */
    async guardarCliente(datosCliente) {
        if (!this.initialized) return null;
        
        try {
            const telefonoNormalizado = datosCliente.whatsapp
                .replace('whatsapp:', '')
                .replace(/[^0-9+]/g, '');
            
            // Buscar si el cliente ya existe
            const clienteExistente = await this.buscarCliente(datosCliente.whatsapp);
            
            if (clienteExistente) {
                // Actualizar cliente existente
                console.log(`📝 Actualizando cliente: ${clienteExistente.empresa}`);
                
                // Buscar la fila del cliente
                const response = await this.sheets.spreadsheets.values.get({
                    spreadsheetId: this.spreadsheetId,
                    range: 'Clientes!A:A'
                });
                
                const filaCliente = response.data.values.findIndex(
                    row => row[0] === clienteExistente.idCliente
                );
                
                if (filaCliente > 0) {
                    const nuevosValores = [[
                        clienteExistente.idCliente,
                        telefonoNormalizado,
                        datosCliente.empresa || clienteExistente.empresa,
                        datosCliente.contacto || clienteExistente.contacto,
                        datosCliente.telefonoContacto || clienteExistente.telefonoContacto,
                        datosCliente.email || clienteExistente.email || '',
                        datosCliente.direccion || clienteExistente.direccion,
                        datosCliente.distrito || clienteExistente.distrito || '',
                        datosCliente.ciudad || clienteExistente.ciudad || 'Lima',
                        clienteExistente.fechaRegistro,
                        new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' }),
                        (clienteExistente.totalPedidos + 1).toString(),
                        (clienteExistente.totalComprado + (datosCliente.totalPedido || 0)).toString(),
                        (clienteExistente.totalKg + (datosCliente.cantidadKg || 0)).toString(),
                        clienteExistente.notas || ''
                    ]];
                    
                    await this.sheets.spreadsheets.values.update({
                        spreadsheetId: this.spreadsheetId,
                        range: `Clientes!A${filaCliente + 1}:O${filaCliente + 1}`,
                        valueInputOption: 'RAW',
                        requestBody: { values: nuevosValores }
                    });
                    
                    console.log(`✅ Cliente actualizado: ${datosCliente.empresa}`);
                    return clienteExistente.idCliente;
                }
            } else {
                // Crear nuevo cliente
                const idCliente = 'CLI-' + Date.now().toString().slice(-8);
                const fechaActual = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
                
                console.log(`🆕 Creando nuevo cliente: ${datosCliente.empresa}`);
                
                const nuevosValores = [[
                    idCliente,
                    telefonoNormalizado,
                    datosCliente.empresa || 'Sin nombre',
                    datosCliente.contacto || '',
                    datosCliente.telefonoContacto || telefonoNormalizado,
                    datosCliente.email || '',
                    datosCliente.direccion || '',
                    datosCliente.distrito || '',
                    datosCliente.ciudad || 'Lima',
                    fechaActual,
                    fechaActual,
                    '1',
                    (datosCliente.totalPedido || 0).toString(),
                    (datosCliente.cantidadKg || 0).toString(),
                    ''
                ]];
                
                await this.sheets.spreadsheets.values.append({
                    spreadsheetId: this.spreadsheetId,
                    range: 'Clientes!A:O',
                    valueInputOption: 'RAW',
                    insertDataOption: 'INSERT_ROWS',
                    requestBody: { values: nuevosValores }
                });
                
                console.log(`✅ Nuevo cliente creado: ${datosCliente.empresa} (${idCliente})`);
                return idCliente;
            }
        } catch (error) {
            console.error('Error guardando cliente:', error.message);
            return null;
        }
    }

    /**
     * Agregar pedido con gestión de cliente
     */
    async agregarPedido(datosPedido) {
        if (!this.initialized) return false;

        try {
            // Primero gestionar el cliente
            const idCliente = await this.guardarCliente({
                whatsapp: datosPedido.telefono,
                empresa: datosPedido.cafeteria || datosPedido.nombreNegocio,
                contacto: datosPedido.contacto?.split(' - ')[0] || '',
                telefonoContacto: datosPedido.contacto?.split(' - ')[1] || datosPedido.telefono,
                direccion: datosPedido.direccion,
                totalPedido: datosPedido.total,
                cantidadKg: datosPedido.cantidad
            });
            
            // Formatear fecha y hora
            const fecha = new Date();
            const fechaStr = fecha.toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
            const horaStr = fecha.toLocaleTimeString('es-PE', { timeZone: 'America/Lima' });
            
            // Preparar datos del pedido
            const values = [[
                datosPedido.id || `PED-${Date.now().toString().slice(-6)}`,
                fechaStr,
                horaStr,
                datosPedido.cafeteria || datosPedido.nombreNegocio || 'Sin nombre',
                datosPedido.contacto?.split(' - ')[0] || 'Sin contacto',
                datosPedido.telefono || 'Sin teléfono',
                datosPedido.direccion || 'Sin dirección',
                datosPedido.producto?.nombre || 'Producto',
                datosPedido.cantidad || 0,
                datosPedido.producto?.precio || 0,
                datosPedido.subtotal || datosPedido.total || 0,
                datosPedido.descuento || 0,
                datosPedido.total || 0,
                datosPedido.metodoPago || 'Transferencia',
                datosPedido.estado || 'Pendiente',
                datosPedido.urlComprobante || '',
                datosPedido.observaciones || '',
                datosPedido.esReorden ? 'Reorden' : 'Nuevo',
                idCliente || '',
                datosPedido.telefono || ''
            ]];

            // Agregar a la hoja
            const response = await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'PedidosWhatsApp!A:T',
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                requestBody: {
                    values: values
                }
            });

            console.log(`✅ Pedido ${datosPedido.id} agregado a Google Sheets`);
            console.log(`👤 Cliente: ${idCliente}`);
            return true;
        } catch (error) {
            console.error('❌ Error agregando pedido a Sheets:', error.message);
            return false;
        }
    }

    /**
     * Obtener estadísticas del cliente
     */
    async obtenerEstadisticasCliente(telefonoWhatsApp) {
        const cliente = await this.buscarCliente(telefonoWhatsApp);
        
        if (cliente) {
            return {
                existe: true,
                ...cliente,
                esClienteFrecuente: cliente.totalPedidos >= 3,
                esClienteVIP: cliente.totalComprado >= 1000
            };
        }
        
        return {
            existe: false,
            esNuevo: true
        };
    }
}

// Crear instancia única
const sheetsService = new GoogleSheetsIntegration();

module.exports = sheetsService;
