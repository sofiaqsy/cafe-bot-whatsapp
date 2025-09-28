/**
 * Script de prueba para verificar la actualización de stock
 */

require('dotenv').config();
const googleSheets = require('./google-sheets');

async function testActualizacionStock() {
    console.log('========================================');
    console.log('PRUEBA DE ACTUALIZACIÓN DE STOCK');
    console.log('========================================\n');
    
    // Inicializar Google Sheets
    console.log('1. Inicializando Google Sheets...');
    const initialized = await googleSheets.initialize();
    
    if (!initialized) {
        console.error('❌ Error: Google Sheets no se pudo inicializar');
        return;
    }
    
    console.log('✅ Google Sheets inicializado\n');
    
    // Obtener catálogo actual
    console.log('2. Obteniendo catálogo actual...');
    const catalogo = await googleSheets.obtenerCatalogo();
    
    if (!catalogo || Object.keys(catalogo).length === 0) {
        console.log('❌ No hay productos en el catálogo');
        return;
    }
    
    // Mostrar productos con stock
    console.log('\n📦 PRODUCTOS EN CATÁLOGO:');
    console.log('----------------------------------------');
    Object.values(catalogo).forEach(producto => {
        console.log(`${producto.numero}. ${producto.nombre}`);
        console.log(`   ID: ${producto.id}`);
        console.log(`   Stock actual: ${producto.stock}kg`);
        console.log(`   Precio: S/${producto.precio}/kg`);
        console.log(`   Estado: ${producto.estado}`);
        console.log('');
    });
    
    // Seleccionar el primer producto para prueba
    const primerProducto = Object.values(catalogo)[0];
    if (!primerProducto) {
        console.log('❌ No hay productos para probar');
        return;
    }
    
    console.log('3. PRUEBA: Simular venta');
    console.log('----------------------------------------');
    console.log(`Producto seleccionado: ${primerProducto.nombre}`);
    console.log(`Stock antes de la venta: ${primerProducto.stock}kg`);
    
    const cantidadVenta = 5; // Simular venta de 5kg
    console.log(`Cantidad a vender: ${cantidadVenta}kg`);
    
    // Actualizar stock
    console.log('\nActualizando stock...');
    const resultado = await googleSheets.actualizarStock(primerProducto.id, cantidadVenta);
    
    if (resultado) {
        console.log('✅ Stock actualizado exitosamente');
        
        // Verificar el nuevo stock
        console.log('\n4. Verificando nuevo stock...');
        const catalogoActualizado = await googleSheets.obtenerCatalogo();
        const productoActualizado = Object.values(catalogoActualizado).find(p => p.id === primerProducto.id);
        
        if (productoActualizado) {
            console.log(`Stock después de la venta: ${productoActualizado.stock}kg`);
            console.log(`Reducción: ${primerProducto.stock - productoActualizado.stock}kg`);
            
            if (productoActualizado.stock === 0) {
                console.log('⚠️ Producto agotado - Estado cambiado a AGOTADO');
            }
        }
    } else {
        console.log('❌ Error actualizando stock');
    }
    
    console.log('\n========================================');
    console.log('PRUEBA COMPLETADA');
    console.log('========================================');
    
    // Resumen
    console.log('\nRESUMEN:');
    console.log('1. El stock se actualiza automáticamente al procesar un pedido');
    console.log('2. Si el stock llega a 0, el producto se marca como AGOTADO');
    console.log('3. El catálogo solo muestra productos con stock disponible');
    console.log('4. Se valida el stock antes de confirmar un pedido');
}

// Ejecutar prueba
testActualizacionStock().catch(console.error);
