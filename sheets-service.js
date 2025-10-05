/**
 * Google Sheets Service
 * Maneja la integración con Google Sheets API
 */

const { google } = require('googleapis');
const config = require('./config');

class SheetsService {
    constructor() {
        this.sheets = null;
        this.auth = null;
        this.spreadsheetId = config.google.spreadsheetId;
        this.initialized = false;
    }

    /**
     * Inicializar servicio con credenciales
     */
    async initialize() {
        try {
            // Si no hay credenciales configuradas, salir
            if (!config.google.credentials || !config.google.spreadsheetId) {
                console.log('⚠️ Google Sheets no configurado - trabajando en modo offline');
                return false;
            }

            // Configurar autenticación
            this.auth = new google.auth.GoogleAuth({
                credentials: config.google.credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });

            // Crear cliente de Sheets
            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            
            this.initialized = true;
            console.log('✅ Google Sheets Service inicializado');
            return true;
        } catch (error) {
            console.error('❌ Error inicializando Google Sheets:', error.message);
            return false;
        }
    }

    /**
     * Agregar cliente a la hoja Clientes
     */
    async agregarCliente(datosCliente) {
        if (!this.initialized) {
            console.log('⚠️ Sheets no inicializado - guardando solo en memoria');
            return false;
        }

        try {
            // Preparar datos para insertar
            // Formato esperado: [ID, WhatsApp, Empresa, Contacto, Telefono, Email, Direccion, Distrito, Ciudad, FechaRegistro, UltimaCompra, TotalPedidos, TotalComprado, TotalKg, Notas]
            const valores = [[
                datosCliente.id || `CLI-${Date.now().toString().slice(-6)}`,
                datosCliente.whatsapp || '',
                datosCliente.empresa || '',
                datosCliente.contacto || '',
                datosCliente.telefono || '',
                datosCliente.email || '',
                datosCliente.direccion || '',
                datosCliente.distrito || '',
                datosCliente.ciudad || 'Lima',
                datosCliente.fechaRegistro || new Date().toLocaleDateString('es-PE'),
                datosCliente.ultimaCompra || new Date().toLocaleDateString('es-PE'),
                datosCliente.totalPedidos || 1,
                datosCliente.totalComprado || 0,
                datosCliente.totalKg || 1,
                datosCliente.notas || ''
            ]];

            const response = await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'Clientes!A:O', // Columnas A hasta O
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: valores
                }
            });

            console.log(`✅ Cliente agregado a Google Sheets: ${datosCliente.id}`);
            return response.data;
        } catch (error) {
            console.error('❌ Error agregando cliente a Sheets:', error);
            return false;
        }
    }

    /**
     * Agregar pedido a la hoja PedidosWhatsApp
     */
    async agregarPedido(datosPedido) {
        if (!this.initialized) {
            console.log('⚠️ Sheets no inicializado - guardando solo en memoria');
            return false;
        }

        try {
            // Formato para PedidosWhatsApp
            const valores = [[
                datosPedido.id || `CAF-${Date.now().toString().slice(-6)}`,
                datosPedido.fecha || new Date().toLocaleDateString('es-PE'),
                datosPedido.hora || new Date().toLocaleTimeString('es-PE'),
                datosPedido.empresa || '',
                datosPedido.contacto || '',
                datosPedido.telefono || '',
                datosPedido.direccion || '',
                datosPedido.producto || 'Café Orgánico Premium',
                datosPedido.cantidad || 1,
                datosPedido.precioUnit || 0,
                datosPedido.subtotal || 0,
                datosPedido.descuento || 0,
                datosPedido.total || 0,
                datosPedido.metodoPago || 'Promoción',
                datosPedido.estado || 'Pendiente verificación',
                datosPedido.comprobante || 'MUESTRA GRATIS',
                datosPedido.observaciones || '',
                '',  // Columna vacía
                '',  // Columna vacía
                datosPedido.whatsapp || '',
                datosPedido.tipo || 'MUESTRA'
            ]];

            const response = await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'PedidosWhatsApp!A:U',
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: valores
                }
            });

            console.log(`✅ Pedido agregado a Google Sheets: ${datosPedido.id}`);
            return response.data;
        } catch (error) {
            console.error('❌ Error agregando pedido a Sheets:', error);
            return false;
        }
    }
}

module.exports = new SheetsService();
