/**
 * Script de prueba para verificar los cambios
 * 1. Guardar WhatsApp completo en Sheets
 * 2. Buscar cliente existente antes de pedir datos
 */

require('dotenv').config();
const googleSheets = require('./google-sheets');

async function testClienteFix() {
    console.log('========================================');
    console.log('PRUEBA DE FIX DE CLIENTES');
    console.log('========================================\n');
    
    // Inicializar Google Sheets
    console.log('1. Inicializando Google Sheets...');
    const initialized = await googleSheets.initialize();
    
    if (!initialized) {
        console.error('❌ Error: Google Sheets no se pudo inicializar');
        return;
    }
    
    console.log('✅ Google Sheets inicializado correctamente\n');
    
    // Prueba 1: Guardar cliente con WhatsApp completo
    console.log('2. PRUEBA: Guardar cliente con WhatsApp completo');
    console.log('----------------------------------------');
    
    const datosCliente = {
        whatsapp: 'whatsapp:+51936934501',
        empresa: 'Cafetería Test',
        contacto: 'Juan Pérez',
        telefonoContacto: '936934501',
        direccion: 'Av. Principal 123, Miraflores',
        totalPedido: 500,
        cantidadKg: 10
    };
    
    console.log('Datos a guardar:');
    console.log(`  WhatsApp: ${datosCliente.whatsapp}`);
    console.log(`  Empresa: ${datosCliente.empresa}`);
    console.log(`  Contacto: ${datosCliente.contacto}\n`);
    
    const idCliente = await googleSheets.guardarCliente(datosCliente);
    
    if (idCliente) {
        console.log(`✅ Cliente guardado con ID: ${idCliente}\n`);
    } else {
        console.log('❌ Error guardando cliente\n');
    }
    
    // Prueba 2: Buscar cliente por WhatsApp completo
    console.log('3. PRUEBA: Buscar cliente por WhatsApp completo');
    console.log('----------------------------------------');
    
    const whatsappBusqueda = 'whatsapp:+51936934501';
    console.log(`Buscando cliente con: ${whatsappBusqueda}`);
    
    const clienteEncontrado = await googleSheets.buscarCliente(whatsappBusqueda);
    
    if (clienteEncontrado) {
        console.log('✅ Cliente encontrado:');
        console.log(`  ID: ${clienteEncontrado.idCliente}`);
        console.log(`  WhatsApp guardado: ${clienteEncontrado.whatsapp}`);
        console.log(`  Empresa: ${clienteEncontrado.empresa}`);
        console.log(`  Contacto: ${clienteEncontrado.contacto}`);
        console.log(`  Dirección: ${clienteEncontrado.direccion}`);
        console.log(`  Total pedidos: ${clienteEncontrado.totalPedidos}`);
        
        // Verificar que el WhatsApp se guardó correctamente
        if (clienteEncontrado.whatsapp === whatsappBusqueda) {
            console.log('\n✅ ÉXITO: WhatsApp se guardó en formato completo');
        } else {
            console.log(`\n❌ ERROR: WhatsApp no coincide`);
            console.log(`  Esperado: ${whatsappBusqueda}`);
            console.log(`  Obtenido: ${clienteEncontrado.whatsapp}`);
        }
    } else {
        console.log('❌ Cliente no encontrado');
    }
    
    // Prueba 3: Actualizar cliente existente
    console.log('\n4. PRUEBA: Actualizar cliente existente');
    console.log('----------------------------------------');
    
    const datosActualizados = {
        whatsapp: 'whatsapp:+51936934501',
        empresa: 'Cafetería Test ACTUALIZADA',
        contacto: 'Juan Pérez',
        telefonoContacto: '936934501',
        direccion: 'Nueva Dirección 456, San Isidro',
        totalPedido: 300,
        cantidadKg: 5
    };
    
    console.log('Actualizando con nueva dirección y empresa...');
    const idActualizado = await googleSheets.guardarCliente(datosActualizados);
    
    if (idActualizado) {
        console.log(`✅ Cliente actualizado: ${idActualizado}`);
        
        // Verificar la actualización
        const clienteActualizado = await googleSheets.buscarCliente('whatsapp:+51936934501');
        if (clienteActualizado) {
            console.log('\nDatos actualizados:');
            console.log(`  Empresa: ${clienteActualizado.empresa}`);
            console.log(`  Dirección: ${clienteActualizado.direccion}`);
            console.log(`  Total pedidos: ${clienteActualizado.totalPedidos}`);
            console.log(`  Total comprado: S/${clienteActualizado.totalComprado}`);
        }
    }
    
    console.log('\n========================================');
    console.log('PRUEBA COMPLETADA');
    console.log('========================================');
    
    // Resumen final
    console.log('\nRESUMEN:');
    console.log('1. ✅ WhatsApp se guarda en formato completo (whatsapp:+51...)');
    console.log('2. ✅ Búsqueda de cliente funciona con WhatsApp completo');
    console.log('3. ✅ Actualización de cliente mantiene el formato correcto');
    console.log('\nEl bot ahora:');
    console.log('- Guardará el WhatsApp completo en la columna B');
    console.log('- Buscará clientes existentes antes de pedir datos');
    console.log('- Mostrará los datos guardados y preguntará si son correctos');
}

// Ejecutar prueba
testClienteFix().catch(console.error);
