const { google } = require('googleapis');

async function testDriveAccess() {
    try {
        console.log('🔍 Probando acceso a Google Drive...\n');
        
        // Verificar variables de entorno
        const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        const folderId = process.env.DRIVE_FOLDER_ID || process.env.DRIVE_COMPROBANTES_ID;
        
        if (!serviceAccountKey) {
            console.log('❌ Falta GOOGLE_SERVICE_ACCOUNT_KEY');
            return;
        }
        
        if (!folderId) {
            console.log('❌ Falta DRIVE_FOLDER_ID o DRIVE_COMPROBANTES_ID');
            return;
        }
        
        console.log(`📁 ID de carpeta a verificar: ${folderId}`);
        
        // Configurar autenticación
        const credentials = JSON.parse(serviceAccountKey);
        console.log(`👤 Cuenta de servicio: ${credentials.client_email}`);
        
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive']
        });
        
        const drive = google.drive({ version: 'v3', auth });
        
        // Intentar acceder a la carpeta
        console.log('\n🔄 Intentando acceder a la carpeta...');
        
        try {
            const response = await drive.files.get({
                fileId: folderId,
                fields: 'id,name,mimeType,permissions'
            });
            
            console.log('✅ ¡Carpeta encontrada!');
            console.log(`📁 Nombre: ${response.data.name}`);
            console.log(`🆔 ID: ${response.data.id}`);
            console.log(`📋 Tipo: ${response.data.mimeType}`);
            
            if (response.data.permissions) {
                console.log('\n👥 Permisos:');
                response.data.permissions.forEach(perm => {
                    console.log(`   - ${perm.emailAddress || perm.displayName || 'Anónimo'}: ${perm.role}`);
                });
            }
            
            // Intentar listar archivos en la carpeta
            console.log('\n📂 Contenido de la carpeta:');
            const fileList = await drive.files.list({
                q: `'${folderId}' in parents`,
                fields: 'files(id,name,mimeType,createdTime)',
                pageSize: 10
            });
            
            if (fileList.data.files.length === 0) {
                console.log('   (Carpeta vacía)');
            } else {
                fileList.data.files.forEach(file => {
                    console.log(`   📄 ${file.name} (${file.mimeType})`);
                });
            }
            
            console.log('\n✅ ¡Todo funciona correctamente! El bot puede acceder a la carpeta.');
            
        } catch (error) {
            console.log(`\n❌ Error al acceder a la carpeta: ${error.message}`);
            
            if (error.code === 404) {
                console.log('\n📝 Posibles soluciones:');
                console.log('1. Verifica que el ID de la carpeta sea correcto');
                console.log('2. Asegúrate de que la carpeta esté compartida con:');
                console.log(`   ${credentials.client_email}`);
                console.log('3. El permiso debe ser "Editor" o "Propietario"');
            } else if (error.code === 403) {
                console.log('\n🔒 Error de permisos. Asegúrate de compartir la carpeta con:');
                console.log(`   ${credentials.client_email}`);
                console.log('   Con rol: Editor');
            }
        }
        
    } catch (error) {
        console.log('❌ Error general:', error.message);
    }
}

// Ejecutar el test
testDriveAccess();
