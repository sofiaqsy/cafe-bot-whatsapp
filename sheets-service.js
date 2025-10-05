/**
 * Google Sheets Service
 * Maneja la integración con Google Sheets API
 */

const { google } = require('googleapis');

class SheetsService {
    constructor() {
        this.sheets = null;
        this.auth = null;
        this.spreadsheetId = null; // Se asignará en initialize()
        this.initialized = false;
    }

    /**
     * Inicializar servicio con credenciales
     */
    async initialize() {
        try {
            // Obtener credenciales y spreadsheet ID de las variables de entorno
            const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
            const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
            
            if (!credentialsJson || !spreadsheetId) {
                console.log('⚠️ Google Sheets no configurado - trabajando en modo offline');
                console.log('   Necesitas GOOGLE_SERVICE_ACCOUNT_KEY y GOOGLE_SPREADSHEET_ID');
                return false;
            }

            // Parsear las credenciales JSON
            let credentials;
            try {
                credentials = JSON.parse(credentialsJson);
            } catch (error) {
                console.error('❌ Error parseando GOOGLE_SERVICE_ACCOUNT_KEY:', error.message);
                return false;
            }

            // Configurar autenticación
            this.auth = new google.auth.GoogleAuth({
                credentials: credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });

            // Crear cliente de Sheets
            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            this.spreadsheetId = spreadsheetId;
            
            this.initialized = true;
            console.log('✅ Google Sheets Service inicializado');
            console.log('   Spreadsheet ID:', spreadsheetId);
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
    /**
     * Verificar si un cliente ya existe en Google Sheets
     */
    async verificarClienteExiste(numeroWhatsApp) {
        if (!this.initialized) {
            console.log('⚠️ Sheets no inicializado - no se puede verificar cliente');
            return false;
        }

        try {
            // Buscar en la columna B (WhatsApp) de la hoja Clientes
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Clientes!B:B' // Columna WhatsApp
            });

            const valores = response.data.values || [];
            
            // Buscar si el número existe (ignorar la primera fila que es el header)
            for (let i = 1; i < valores.length; i++) {
                const whatsappEnSheet = valores[i][0];
                if (whatsappEnSheet) {
                    // Limpiar y comparar
                    const numeroLimpio = whatsappEnSheet.toString().replace(/[^0-9]/g, '');
                    const numeroBuscado = numeroWhatsApp.toString().replace(/[^0-9]/g, '');
                    
                    if (numeroLimpio === numeroBuscado || numeroLimpio.includes(numeroBuscado) || numeroBuscado.includes(numeroLimpio)) {
                        console.log(`✅ Cliente encontrado en Sheets: ${numeroWhatsApp}`);
                        return true;
                    }
                }
            }
            
            console.log(`ℹ️ Cliente no encontrado en Sheets: ${numeroWhatsApp}`);
            return false;
        } catch (error) {
            console.error('❌ Error verificando cliente en Sheets:', error.message);
            // En caso de error, retornar false para permitir continuar
            return false;
        }
    }
}

module.exports = new SheetsService();
