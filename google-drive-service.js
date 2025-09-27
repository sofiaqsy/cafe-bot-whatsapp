const { google } = require('googleapis');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class GoogleDriveService {
    constructor() {
        this.drive = null;
        this.auth = null;
        this.folderId = null;
    }

    /**
     * Inicializa el servicio de Google Drive
     */
    async initialize() {
        try {
            // Verificar si Drive está habilitado
            if (process.env.DRIVE_ENABLED !== 'TRUE') {
                console.log('⚠️ Google Drive no está habilitado');
                return false;
            }

            // Verificar que existe el folder de comprobantes
            if (!process.env.DRIVE_COMPROBANTES_ID) {
                console.log('⚠️ Falta configurar DRIVE_COMPROBANTES_ID');
                return false;
            }

            this.folderId = process.env.DRIVE_COMPROBANTES_ID;

            // Configurar autenticación
            const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
            if (!serviceAccountKey) {
                console.log('⚠️ Falta GOOGLE_SERVICE_ACCOUNT_KEY');
                return false;
            }

            const credentials = JSON.parse(serviceAccountKey);
            
            this.auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/drive.file']
            });

            this.drive = google.drive({ version: 'v3', auth: this.auth });

            // Verificar acceso al folder
            await this.verifyFolderAccess();

            console.log('✅ Google Drive inicializado correctamente');
            console.log(`📁 Folder de comprobantes: ${this.folderId}`);
            return true;

        } catch (error) {
            console.error('❌ Error inicializando Google Drive:', error.message);
            return false;
        }
    }

    /**
     * Verifica que tenemos acceso al folder
     */
    async verifyFolderAccess() {
        try {
            const response = await this.drive.files.get({
                fileId: this.folderId,
                fields: 'id, name'
            });
            console.log(`✅ Acceso verificado al folder: ${response.data.name}`);
            return true;
        } catch (error) {
            console.error('❌ No se puede acceder al folder:', error.message);
            throw error;
        }
    }

    /**
     * Sube una imagen desde URL (Twilio) a Google Drive
     */
    async subirImagenDesdeURL(imageUrl, fileName, metadata = {}) {
        try {
            if (!this.drive) {
                throw new Error('Google Drive no inicializado');
            }

            // Descargar imagen de Twilio con autenticación
            const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
            const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
            
            const response = await axios.get(imageUrl, {
                responseType: 'stream',
                auth: {
                    username: twilioAccountSid,
                    password: twilioAuthToken
                }
            });

            // Preparar metadata para Drive
            const fileMetadata = {
                name: fileName,
                parents: [this.folderId],
                description: JSON.stringify(metadata)
            };

            // Determinar el tipo MIME
            const mimeType = response.headers['content-type'] || 'image/jpeg';

            const media = {
                mimeType: mimeType,
                body: response.data
            };

            // Subir a Drive
            const driveResponse = await this.drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id, name, webViewLink'
            });

            console.log(`✅ Imagen subida: ${driveResponse.data.name}`);
            console.log(`🔗 Link: ${driveResponse.data.webViewLink}`);

            return {
                success: true,
                fileId: driveResponse.data.id,
                fileName: driveResponse.data.name,
                webViewLink: driveResponse.data.webViewLink
            };

        } catch (error) {
            console.error('❌ Error subiendo imagen a Drive:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Lista archivos en el folder de comprobantes
     */
    async listarComprobantes(limite = 10) {
        try {
            const response = await this.drive.files.list({
                q: `'${this.folderId}' in parents and trashed = false`,
                fields: 'files(id, name, createdTime, webViewLink)',
                orderBy: 'createdTime desc',
                pageSize: limite
            });

            return response.data.files;
        } catch (error) {
            console.error('❌ Error listando archivos:', error.message);
            return [];
        }
    }

    /**
     * Busca comprobantes por código de pedido
     */
    async buscarComprobantePorPedido(codigoPedido) {
        try {
            const response = await this.drive.files.list({
                q: `'${this.folderId}' in parents and name contains '${codigoPedido}' and trashed = false`,
                fields: 'files(id, name, createdTime, webViewLink)',
                orderBy: 'createdTime desc'
            });

            return response.data.files;
        } catch (error) {
            console.error('❌ Error buscando comprobante:', error.message);
            return [];
        }
    }
}

// Exportar instancia única
const driveService = new GoogleDriveService();

module.exports = driveService;
