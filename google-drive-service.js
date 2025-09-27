const { google } = require('googleapis');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class GoogleDriveService {
    constructor() {
        this.drive = null;
        this.auth = null;
        this.folderId = null;
        this.initialized = false;
        this.useLocalStorage = false;
    }

    /**
     * Inicializa el servicio de Google Drive
     */
    async initialize() {
        try {
            // Verificar si Drive está habilitado
            if (process.env.DRIVE_ENABLED !== 'TRUE') {
                console.log('⚠️ Google Drive deshabilitado - Usando almacenamiento local');
                this.useLocalStorage = true;
                await this.ensureLocalUploadsDir();
                return true;
            }

            // Buscar el ID de la carpeta (soporta ambas variables)
            this.folderId = process.env.DRIVE_FOLDER_ID || process.env.DRIVE_COMPROBANTES_ID;
            
            if (!this.folderId) {
                console.log('⚠️ No se encontró ID de carpeta de Drive - Usando almacenamiento local');
                this.useLocalStorage = true;
                await this.ensureLocalUploadsDir();
                return true;
            }

            console.log(`📁 Intentando conectar con carpeta de Drive: ${this.folderId}`);

            // Configurar autenticación
            const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
            if (!serviceAccountKey) {
                console.log('⚠️ Falta GOOGLE_SERVICE_ACCOUNT_KEY - Usando almacenamiento local');
                this.useLocalStorage = true;
                await this.ensureLocalUploadsDir();
                return true;
            }

            const credentials = JSON.parse(serviceAccountKey);
            
            this.auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/drive']
            });

            this.drive = google.drive({ version: 'v3', auth: this.auth });

            // Intentar verificar acceso (no crítico)
            try {
                await this.verifyFolderAccess();
                console.log('✅ Google Drive conectado correctamente');
                console.log(`📁 Carpeta de comprobantes lista: ${this.folderId}`);
                this.initialized = true;
                this.useLocalStorage = false;
            } catch (verifyError) {
                console.log('⚠️ No se pudo acceder a la carpeta de Drive:', verifyError.message);
                console.log('   Usando almacenamiento local como respaldo');
                this.useLocalStorage = true;
                await this.ensureLocalUploadsDir();
            }

            return true;

        } catch (error) {
            console.log('⚠️ Error inicializando Google Drive:', error.message);
            console.log('   Usando almacenamiento local como respaldo');
            this.useLocalStorage = true;
            await this.ensureLocalUploadsDir();
            return true; // No fallar, usar local
        }
    }

    /**
     * Crea carpeta local si no existe
     */
    async ensureLocalUploadsDir() {
        const uploadsDir = path.join(__dirname, 'uploads');
        try {
            await fs.mkdir(uploadsDir, { recursive: true });
            console.log('📁 Carpeta local de uploads lista');
            return true;
        } catch (error) {
            console.error('Error creando carpeta uploads:', error);
            return false;
        }
    }

    /**
     * Verifica que tenemos acceso al folder
     */
    async verifyFolderAccess() {
        if (!this.drive || !this.folderId) {
            throw new Error('Drive no configurado');
        }

        const response = await this.drive.files.get({
            fileId: this.folderId,
            fields: 'id, name'
        });
        
        console.log(`✅ Acceso verificado a: ${response.data.name}`);
        return true;
    }

    /**
     * Sube una imagen desde URL (Twilio) a Google Drive o localmente
     */
    async subirImagenDesdeURL(imageUrl, fileName, metadata = {}) {
        try {
            console.log(`📸 Procesando imagen: ${fileName}`);
            console.log(`🔗 URL de origen: ${imageUrl}`);
            
            // Descargar imagen de Twilio con reintentos
            const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
            const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
            
            let response;
            let intentos = 0;
            const maxIntentos = 3;
            
            while (intentos < maxIntentos) {
                try {
                    intentos++;
                    console.log(`🔄 Intento ${intentos} de descargar imagen...`);
                    
                    response = await axios({
                        method: 'GET',
                        url: imageUrl,
                        responseType: this.useLocalStorage ? 'arraybuffer' : 'stream',
                        auth: {
                            username: twilioAccountSid,
                            password: twilioAuthToken
                        },
                        timeout: 15000,
                        maxRedirects: 5,
                        validateStatus: function (status) {
                            return status >= 200 && status < 500; // Aceptar más códigos
                        }
                    });
                    
                    if (response.status === 200) {
                        console.log('✅ Imagen descargada correctamente');
                        break;
                    } else if (response.status === 404) {
                        console.log('⚠️ Imagen no encontrada (404), reintentando...');
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
                    } else {
                        console.log(`⚠️ Respuesta con código ${response.status}`);
                        break;
                    }
                } catch (downloadError) {
                    console.log(`❌ Error en intento ${intentos}:`, downloadError.message);
                    if (intentos >= maxIntentos) {
                        throw downloadError;
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            if (!response || response.status !== 200) {
                throw new Error(`No se pudo descargar la imagen (código ${response?.status || 'desconocido'})`);
            }

            // Si usamos almacenamiento local
            if (this.useLocalStorage) {
                return await this.guardarImagenLocal(response.data, fileName, metadata);
            }

            // Si usamos Google Drive
            if (this.drive && this.initialized) {
                return await this.guardarImagenDrive(response, fileName, metadata);
            }

            // Fallback a local si hay problemas
            console.log('⚠️ Usando almacenamiento local como fallback');
            const bufferData = response.data instanceof Buffer ? response.data : Buffer.from(response.data);
            return await this.guardarImagenLocal(bufferData, fileName, metadata);

        } catch (error) {
            console.error('❌ Error procesando imagen:', error.message);
            
            // Intentar guardar localmente como último recurso
            try {
                console.log('🔄 Intentando guardar localmente como respaldo...');
                const localPath = path.join(__dirname, 'uploads', fileName);
                await this.ensureLocalUploadsDir();
                // Crear archivo vacío como marcador
                await fs.writeFile(localPath, 'Error al descargar imagen');
                
                return {
                    success: false,
                    error: error.message,
                    localFallback: true,
                    fileName: fileName
                };
            } catch (localError) {
                return {
                    success: false,
                    error: error.message
                };
            }
        }
    }

    /**
     * Guarda imagen en Google Drive
     */
    async guardarImagenDrive(response, fileName, metadata) {
        try {
            const fileMetadata = {
                name: fileName,
                parents: [this.folderId],
                description: JSON.stringify(metadata)
            };

            const mimeType = response.headers['content-type'] || 'image/jpeg';

            const media = {
                mimeType: mimeType,
                body: response.data
            };

            const driveResponse = await this.drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id, name, webViewLink'
            });

            console.log(`✅ Imagen subida a Drive: ${driveResponse.data.name}`);
            console.log(`🔗 Link: ${driveResponse.data.webViewLink}`);

            return {
                success: true,
                fileId: driveResponse.data.id,
                fileName: driveResponse.data.name,
                webViewLink: driveResponse.data.webViewLink,
                storage: 'drive'
            };
        } catch (error) {
            console.error('Error guardando en Drive:', error.message);
            throw error;
        }
    }

    /**
     * Guarda imagen localmente
     */
    async guardarImagenLocal(data, fileName, metadata) {
        try {
            const uploadsDir = path.join(__dirname, 'uploads');
            const filePath = path.join(uploadsDir, fileName);
            
            await fs.writeFile(filePath, data);
            
            // Guardar metadata en archivo JSON
            const metadataPath = path.join(uploadsDir, `${fileName}.json`);
            await fs.writeFile(metadataPath, JSON.stringify({
                ...metadata,
                fileName: fileName,
                savedAt: new Date().toISOString(),
                storage: 'local'
            }, null, 2));
            
            console.log(`✅ Imagen guardada localmente: ${fileName}`);
            
            return {
                success: true,
                fileName: fileName,
                filePath: filePath,
                storage: 'local',
                warning: 'Almacenamiento temporal - La imagen se perderá al reiniciar el servidor'
            };
        } catch (error) {
            console.error('Error guardando localmente:', error.message);
            throw error;
        }
    }

    /**
     * Lista archivos (Drive o local)
     */
    async listarComprobantes(limite = 10) {
        try {
            if (this.useLocalStorage) {
                return await this.listarComprobantesLocal(limite);
            }

            if (this.drive && this.initialized) {
                const response = await this.drive.files.list({
                    q: `'${this.folderId}' in parents and trashed = false`,
                    fields: 'files(id, name, createdTime, webViewLink)',
                    orderBy: 'createdTime desc',
                    pageSize: limite
                });
                return response.data.files;
            }

            return [];
        } catch (error) {
            console.error('Error listando archivos:', error.message);
            return [];
        }
    }

    /**
     * Lista archivos locales
     */
    async listarComprobantesLocal(limite) {
        try {
            const uploadsDir = path.join(__dirname, 'uploads');
            await this.ensureLocalUploadsDir();
            
            const files = await fs.readdir(uploadsDir);
            const imageFiles = files.filter(f => 
                f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png')
            );
            
            const fileDetails = await Promise.all(
                imageFiles.slice(0, limite).map(async (fileName) => {
                    const filePath = path.join(uploadsDir, fileName);
                    const stats = await fs.stat(filePath);
                    return {
                        id: fileName,
                        name: fileName,
                        createdTime: stats.birthtime,
                        webViewLink: `/uploads/${fileName}`,
                        storage: 'local'
                    };
                })
            );
            
            return fileDetails.sort((a, b) => b.createdTime - a.createdTime);
        } catch (error) {
            console.error('Error listando archivos locales:', error);
            return [];
        }
    }

    /**
     * Busca comprobantes por código de pedido
     */
    async buscarComprobantePorPedido(codigoPedido) {
        try {
            if (this.useLocalStorage) {
                const uploadsDir = path.join(__dirname, 'uploads');
                const files = await fs.readdir(uploadsDir);
                const matches = files.filter(f => f.includes(codigoPedido));
                
                return matches.map(fileName => ({
                    id: fileName,
                    name: fileName,
                    webViewLink: `/uploads/${fileName}`,
                    storage: 'local'
                }));
            }

            if (this.drive && this.initialized) {
                const response = await this.drive.files.list({
                    q: `'${this.folderId}' in parents and name contains '${codigoPedido}' and trashed = false`,
                    fields: 'files(id, name, createdTime, webViewLink)',
                    orderBy: 'createdTime desc'
                });
                return response.data.files;
            }

            return [];
        } catch (error) {
            console.error('Error buscando comprobante:', error.message);
            return [];
        }
    }
}

// Exportar instancia única
const driveService = new GoogleDriveService();

module.exports = driveService;
