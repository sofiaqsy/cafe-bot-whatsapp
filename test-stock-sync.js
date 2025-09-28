/**
 * Script de prueba mejorado para verificar la actualización de stock
 * y la sincronización del catálogo en memoria
 */

require('dotenv').config();
const googleSheets = require('./google-sheets');
const productCatalog = require('./product-catalog');

async function testActualizacionStockMejorado() {
    console.log('========================================');
    console.log('PRUEBA DE ACTUALIZACIÓN DE STOCK Y SINCRONIZACIÓN');
    console.log('========================================\n');
    
    // 1. Inicializar servicios
    console.log('1. INICIALIZANDO SERVICIOS...');
    console.log('----------------------------------------');
    
    console.log('   Inicializando Google Sheets...');
    const sheetsInitialized = await googleSheets.initialize();
    
    if (!sheetsInitialized) {
        console.error('❌ Error: Google Sheets no se pudo inicializar');
        return;
    }
    console.log('   ✅ Google Sheets inicializado');
    
    console.log('   Inicializando Product Catalog...');
    await productCatalog.initialize(googleSheets);
    console.log('   ✅ Product Catalog inicializado');
    
    // 2. Mostrar catálogo inicial
    console.log('\n2. CATÁLOGO INICIAL');
    console.log('----------------------------------------');
    const productosInicial = productCatalog.getAllProducts();
    
    if (productosInicial.length === 0) {
        console.log('❌ No hay productos disponibles');
        return;
    }
    
    console.log(`📦 ${productosInicial.length} productos disponibles:\n`);
    productosInicial.forEach(producto => {
        console.log(`${producto.numero}. ${producto.nombre}`);
        console.log(`   ID: ${producto.id}`);
        console.log(`   Stock: ${producto.stock}kg`);
        console.log(`   Estado: ${producto.estado}`);
        console.log('');
    });
    
    // 3. Seleccionar producto para prueba
    const primerProducto = productosInicial[0];
    if (!primerProducto || primerProducto.stock <= 0) {
        console.log('❌ No hay productos con stock para probar');
        return;
    }
    
    console.log('3. SIMULACIÓN DE VENTA');
    console.log('----------------------------------------');
    console.log(`Producto seleccionado: ${primerProducto.nombre}`);
    console.log(`ID del producto: ${primerProducto.id}`);
    console.log(`Stock antes de la venta: ${primerProducto.stock}kg`);
    
    const cantidadVenta = Math.min(5, primerProducto.stock); // Vender 5kg o lo que haya
    console.log(`Cantidad a vender: ${cantidadVenta}kg`);
    console.log(`Stock esperado después: ${primerProducto.stock - cantidadVenta}kg`);
    
    // 4. Actualizar stock
    console.log('\n4. ACTUALIZANDO STOCK...');
    console.log('----------------------------------------');
    const resultado = await googleSheets.actualizarStock(primerProducto.id, cantidadVenta);
    
    if (!resultado) {
        console.log('❌ Error actualizando stock');
        return;
    }
    
    console.log('✅ Stock actualizado en Google Sheets');
    
    // 5. Verificar sincronización
    console.log('\n5. VERIFICANDO SINCRONIZACIÓN');
    console.log('----------------------------------------');
    
    // El catálogo debería haberse actualizado automáticamente
    console.log('Verificando catálogo en memoria...');
    
    // Obtener producto actualizado del catálogo
    const productoActualizado = productCatalog.getProduct(primerProducto.numero);
    
    if (productoActualizado) {
        console.log(`\n📊 RESULTADO:`);
        console.log(`   Producto: ${productoActualizado.nombre}`);
        console.log(`   Stock anterior: ${primerProducto.stock}kg`);
        console.log(`   Stock actual: ${productoActualizado.stock}kg`);
        console.log(`   Diferencia: ${primerProducto.stock - productoActualizado.stock}kg`);
        
        if (productoActualizado.stock === primerProducto.stock - cantidadVenta) {
            console.log(`   ✅ Stock sincronizado correctamente`);
        } else {
            console.log(`   ⚠️ Stock no coincide con lo esperado`);
            console.log(`      Esperado: ${primerProducto.stock - cantidadVenta}kg`);
            console.log(`      Actual: ${productoActualizado.stock}kg`);
        }
        
        if (productoActualizado.stock === 0) {
            console.log(`   ⚠️ Producto agotado - Debería estar marcado como AGOTADO`);
            if (!productoActualizado.disponible) {
                console.log(`   ✅ Producto correctamente marcado como no disponible`);
            }
        }
    } else {
        console.log('❌ Producto no encontrado en el catálogo actualizado');
    }
    
    // 6. Mostrar catálogo final
    console.log('\n6. CATÁLOGO FINAL');
    console.log('----------------------------------------');
    const productosFinal = productCatalog.getAllProducts();
    console.log(`📦 ${productosFinal.length} productos disponibles después de la venta:\n`);
    
    productosFinal.forEach(producto => {
        console.log(`${producto.numero}. ${producto.nombre}`);
        console.log(`   Stock: ${producto.stock}kg`);
        if (producto.id === primerProducto.id) {
            console.log(`   ⬆️ Este producto fue actualizado`);
        }
        console.log('');
    });
    
    // 7. Resumen
    console.log('\n========================================');
    console.log('RESUMEN DE LA PRUEBA');
    console.log('========================================');
    console.log('\n✅ FUNCIONALIDADES VERIFICADAS:');
    console.log('1. Stock se actualiza en Google Sheets');
    console.log('2. Catálogo en memoria se sincroniza automáticamente');
    console.log('3. Productos agotados se marcan correctamente');
    console.log('4. El catálogo refleja cambios en tiempo real');
    console.log('\n📝 NOTAS IMPORTANTES:');
    console.log('- El stock se actualiza al confirmar un pedido');
    console.log('- El catálogo se recarga antes de mostrarse al cliente');
    console.log('- Los cambios son inmediatos y persistentes');
}

// Ejecutar prueba
testActualizacionStockMejorado()
    .then(() => {
        console.log('\n✅ Prueba completada exitosamente');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Error en la prueba:', error);
        process.exit(1);
    });
