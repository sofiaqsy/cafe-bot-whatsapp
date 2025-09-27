const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Crear carpeta para guardar imágenes si no existe
const UPLOADS_DIR = path.join(__dirname, 'uploads');

async function ensureUploadsDir() {
    try {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
        console.log('📁 Carpeta de uploads verificada');
        return true;
    } catch (error) {
        console.error('Error creando carpeta de uploads:', error);
        return false;
    }
}

// Descargar imagen desde URL de Twilio
async function descargarImagen(mediaUrl, fileName, twilioAccountSid, twilioAuthToken) {
    try {
        console.log(`📥 Descargando imagen: ${fileName}`);
        
        const response = await axios({
            method: 'GET',
            url: mediaUrl,
            responseType: 'arraybuffer',
            auth: {
                username: twilioAccountSid,
                password: twilioAuthToken
            },
            timeout: 30000 // 30 segundos timeout
        });

        const filePath = path.join(UPLOADS_DIR, fileName);
        await fs.writeFile(filePath, response.data);
        
        console.log(`✅ Imagen guardada: ${filePath}`);
        return {
            success: true,
            filePath: filePath,
            fileName: fileName,
            size: response.data.length
        };
    } catch (error) {
        console.error('❌ Error descargando imagen:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Procesar imagen recibida
async function procesarImagen(mediaUrl, pedidoId, twilioAccountSid, twilioAuthToken) {
    try {
        // Asegurar que existe la carpeta
        await ensureUploadsDir();
        
        // Generar nombre único para el archivo
        const timestamp = Date.now();
        const fileName = `comprobante_${pedidoId}_${timestamp}.jpg`;
        
        // Descargar la imagen
        const resultado = await descargarImagen(
            mediaUrl, 
            fileName, 
            twilioAccountSid, 
            twilioAuthToken
        );
        
        if (resultado.success) {
            return {
                success: true,
                data: {
                    url: mediaUrl,
                    fileName: resultado.fileName,
                    filePath: resultado.filePath,
                    size: resultado.size,
                    fechaRecepcion: new Date()
                }
            };
        } else {
            return {
                success: false,
                error: resultado.error
            };
        }
    } catch (error) {
        console.error('Error procesando imagen:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Listar comprobantes guardados
async function listarComprobantes() {
    try {
        await ensureUploadsDir();
        const files = await fs.readdir(UPLOADS_DIR);
        const comprobantes = files.filter(file => file.startsWith('comprobante_'));
        
        const detalles = await Promise.all(
            comprobantes.map(async (file) => {
                const filePath = path.join(UPLOADS_DIR, file);
                const stats = await fs.stat(filePath);
                return {
                    fileName: file,
                    size: stats.size,
                    fecha: stats.mtime
                };
            })
        );
        
        return detalles;
    } catch (error) {
        console.error('Error listando comprobantes:', error);
        return [];
    }
}

// Obtener comprobante específico
async function obtenerComprobante(fileName) {
    try {
        const filePath = path.join(UPLOADS_DIR, fileName);
        const exists = await fs.access(filePath).then(() => true).catch(() => false);
        
        if (exists) {
            const data = await fs.readFile(filePath);
            return {
                success: true,
                data: data,
                mimeType: 'image/jpeg'
            };
        } else {
            return {
                success: false,
                error: 'Archivo no encontrado'
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    ensureUploadsDir,
    descargarImagen,
    procesarImagen,
    listarComprobantes,
    obtenerComprobante,
    UPLOADS_DIR
};
