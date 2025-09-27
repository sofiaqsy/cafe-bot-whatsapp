// Versión alternativa del image-handler sin Google Drive
// Solo guarda las imágenes localmente en Heroku

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Crear carpeta para guardar imágenes si no existe
const UPLOADS_DIR = path.join(__dirname, 'uploads');

async function ensureUploadsDir() {
    try {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
        console.log('📁 Carpeta de uploads local verificada');
        return true;
    } catch (error) {
        console.error('Error creando carpeta de uploads:', error);
        return false;
    }
}

// Descargar imagen desde URL de Twilio (SIN Google Drive)
async function descargarImagen(mediaUrl, fileName, twilioAccountSid, twilioAuthToken) {
    try {
        console.log(`📥 Descargando imagen localmente: ${fileName}`);
        
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
        
        console.log(`✅ Imagen guardada localmente: ${filePath}`);
        console.log(`📊 Tamaño: ${(response.data.length / 1024).toFixed(2)} KB`);
        
        return {
            success: true,
            filePath: filePath,
            fileName: fileName,
            size: response.data.length,
            storage: 'local' // Indicador de que está en almacenamiento local
        };
    } catch (error) {
        console.error('❌ Error descargando imagen:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Procesar imagen recibida (versión sin Google Drive)
async function procesarImagen(mediaUrl, pedidoId, twilioAccountSid, twilioAuthToken) {
    try {
        console.log('📸 Procesando imagen (almacenamiento local)...');
        
        // Asegurar que existe la carpeta
        await ensureUploadsDir();
        
        // Generar nombre único para el archivo
        const timestamp = Date.now();
        const fileName = `comprobante_${pedidoId}_${timestamp}.jpg`;
        
        // Descargar la imagen localmente
        const resultado = await descargarImagen(
            mediaUrl, 
            fileName, 
            twilioAccountSid, 
            twilioAuthToken
        );
        
        if (resultado.success) {
            console.log('✅ Imagen procesada y guardada localmente');
            return {
                success: true,
                data: {
                    url: mediaUrl,
                    fileName: resultado.fileName,
                    filePath: resultado.filePath,
                    size: resultado.size,
                    fechaRecepcion: new Date(),
                    storage: 'local',
                    nota: 'Imagen guardada temporalmente en servidor'
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

// Listar comprobantes guardados localmente
async function listarComprobantes() {
    try {
        await ensureUploadsDir();
        const files = await fs.readdir(UPLOADS_DIR);
        const comprobantes = files.filter(file => file.startsWith('comprobante_'));
        
        console.log(`📋 Comprobantes locales encontrados: ${comprobantes.length}`);
        
        const detalles = await Promise.all(
            comprobantes.map(async (file) => {
                const filePath = path.join(UPLOADS_DIR, file);
                try {
                    const stats = await fs.stat(filePath);
                    return {
                        fileName: file,
                        size: stats.size,
                        fecha: stats.mtime,
                        storage: 'local'
                    };
                } catch (error) {
                    return null;
                }
            })
        );
        
        return detalles.filter(d => d !== null);
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
                mimeType: 'image/jpeg',
                storage: 'local'
            };
        } else {
            return {
                success: false,
                error: 'Archivo no encontrado en almacenamiento local'
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Función para limpiar archivos antiguos (opcional - para no llenar el disco de Heroku)
async function limpiarArchivosAntiguos(diasAntiguedad = 7) {
    try {
        await ensureUploadsDir();
        const files = await fs.readdir(UPLOADS_DIR);
        const ahora = new Date();
        let archivosEliminados = 0;
        
        for (const file of files) {
            if (file.startsWith('comprobante_')) {
                const filePath = path.join(UPLOADS_DIR, file);
                const stats = await fs.stat(filePath);
                const diasDiferencia = (ahora - stats.mtime) / (1000 * 60 * 60 * 24);
                
                if (diasDiferencia > diasAntiguedad) {
                    await fs.unlink(filePath);
                    archivosEliminados++;
                    console.log(`🗑️ Archivo antiguo eliminado: ${file}`);
                }
            }
        }
        
        if (archivosEliminados > 0) {
            console.log(`✅ Limpieza completada: ${archivosEliminados} archivos eliminados`);
        }
        
        return archivosEliminados;
    } catch (error) {
        console.error('Error limpiando archivos antiguos:', error);
        return 0;
    }
}

module.exports = {
    ensureUploadsDir,
    descargarImagen,
    procesarImagen,
    listarComprobantes,
    obtenerComprobante,
    limpiarArchivosAntiguos,
    UPLOADS_DIR
};
