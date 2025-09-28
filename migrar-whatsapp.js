/**
 * Script de migración para actualizar WhatsApp al formato completo
 * Actualiza los registros que tienen formato antiguo (+51...) al nuevo (whatsapp:+51...)
 */

require('dotenv').config();
const googleSheets = require('./google-sheets');

async function migrarFormatoWhatsApp() {
    console.log('========================================');
    console.log('MIGRACIÓN DE FORMATO WHATSAPP');
    console.log('========================================\n');
    
    // Inicializar Google Sheets
    console.log('1. Inicializando Google Sheets...');
    const initialized = await googleSheets.initialize();
    
    if (!initialized) {
        console.error('❌ Error: Google Sheets no se pudo inicializar');
        return;
    }
    
    console.log('✅ Google Sheets inicializado\n');
    
    try {
        // Obtener todos los clientes
        console.log('2. Obteniendo clientes actuales...');
        const response = await googleSheets.sheets.spreadsheets.values.get({
            spreadsheetId: googleSheets.spreadsheetId,
            range: 'Clientes!A:O'
        });
        
        if (!response.data.values || response.data.values.length <= 1) {
            console.log('No hay clientes para migrar');
            return;
        }
        
        const headers = response.data.values[0];
        const clientes = response.data.values.slice(1);
        
        console.log(`   Encontrados ${clientes.length} clientes\n`);
        
        // Procesar cada cliente
        console.log('3. Procesando clientes...');
        console.log('----------------------------------------');
        
        let actualizados = 0;
        let yaActualizados = 0;
        
        for (let i = 0; i < clientes.length; i++) {
            const cliente = clientes[i];
            const idCliente = cliente[0];
            const whatsappActual = cliente[1] || '';
            const empresa = cliente[2] || 'Sin nombre';
            
            console.log(`\nCliente ${i + 1}/${clientes.length}:`);
            console.log(`  ID: ${idCliente}`);
            console.log(`  Empresa: ${empresa}`);
            console.log(`  WhatsApp actual: ${whatsappActual}`);
            
            // Verificar si necesita actualización
            if (whatsappActual && !whatsappActual.startsWith('whatsapp:')) {
                // Necesita actualización
                const nuevoWhatsApp = `whatsapp:${whatsappActual}`;
                
                console.log(`  ⚠️ Necesita actualización`);
                console.log(`  📝 Nuevo formato: ${nuevoWhatsApp}`);
                
                // Actualizar en Sheets
                try {
                    await googleSheets.sheets.spreadsheets.values.update({
                        spreadsheetId: googleSheets.spreadsheetId,
                        range: `Clientes!B${i + 2}`, // +2 porque empieza en fila 2 (después del header)
                        valueInputOption: 'RAW',
                        requestBody: {
                            values: [[nuevoWhatsApp]]
                        }
                    });
                    
                    console.log(`  ✅ Actualizado exitosamente`);
                    actualizados++;
                } catch (error) {
                    console.error(`  ❌ Error actualizando: ${error.message}`);
                }
            } else if (whatsappActual.startsWith('whatsapp:')) {
                console.log(`  ✅ Ya tiene formato correcto`);
                yaActualizados++;
            } else {
                console.log(`  ⚠️ WhatsApp vacío o inválido`);
            }
        }
        
        console.log('\n========================================');
        console.log('RESUMEN DE MIGRACIÓN');
        console.log('========================================');
        console.log(`Total de clientes: ${clientes.length}`);
        console.log(`✅ Actualizados: ${actualizados}`);
        console.log(`✅ Ya tenían formato correcto: ${yaActualizados}`);
        console.log(`⚠️ Sin WhatsApp o inválidos: ${clientes.length - actualizados - yaActualizados}`);
        
        if (actualizados > 0) {
            console.log('\n🎉 Migración completada exitosamente!');
            console.log('Los clientes ahora tienen el formato whatsapp:+51...');
        } else {
            console.log('\n✅ No había clientes que migrar');
        }
        
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
    }
}

// Ejecutar migración
console.log('Iniciando migración de formato WhatsApp...\n');
migrarFormatoWhatsApp().catch(console.error);
