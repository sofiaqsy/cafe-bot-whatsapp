#!/bin/bash

echo "================================================"
echo "🛠️ IMPLEMENTACIÓN COMPLETA - COLUMNAS CORREGIDAS"
echo "================================================"
echo ""
echo "CAMBIOS NECESARIOS:"
echo "-------------------"
echo ""
echo "1. IMPORTAR LAS FUNCIONES CORREGIDAS EN BOT-FINAL.JS"
echo "   Al inicio del archivo, agregar:"
echo ""
cat << 'CODE'
// Importar funciones corregidas para Google Sheets
const { 
    agregarPedidoCorregido,
    guardarClienteEnSheets,
    actualizarEstadoPedidoEnSheets 
} = require('./sheets-funciones-corregidas');
CODE
echo ""
echo "2. BUSCAR EN BOT-FINAL.JS DONDE SE GUARDA EL PEDIDO"
echo "   Buscar: pedidosConfirmados.set"
echo "   Y agregar después:"
echo ""
cat << 'CODE'
// Guardar en Google Sheets si está configurado
if (sheetsConfigured && googleSheets && googleSheets.initialized) {
    try {
        await agregarPedidoCorregido(googleSheets, {
            id: pedidoId,
            fecha: pedidoCompleto.fecha,
            empresa: pedidoCompleto.empresa,
            contacto: pedidoCompleto.contacto,
            telefono: pedidoCompleto.telefono || from,
            direccion: pedidoCompleto.direccion,
            producto: pedidoCompleto.producto,
            cantidad: pedidoCompleto.cantidad,
            total: pedidoCompleto.total,
            metodoPago: pedidoCompleto.metodoPago,
            estado: pedidoCompleto.estado,
            urlComprobante: pedidoCompleto.urlComprobante || userState.data.urlComprobante,
            observaciones: pedidoCompleto.comprobanteRecibido ? 'Comprobante recibido' : '',
            esReorden: pedidoCompleto.esReorden,
            comprobanteRecibido: pedidoCompleto.comprobanteRecibido
        });
        console.log('✅ Pedido guardado en Google Sheets');
    } catch (error) {
        console.error('⚠️ Error guardando en Google Sheets:', error.message);
    }
}
CODE
echo ""
echo "3. CUANDO SE VALIDA UN PEDIDO DESDE EL GRUPO"
echo "   Buscar donde se actualiza el estado y agregar:"
echo ""
cat << 'CODE'
// Actualizar estado en Google Sheets
if (sheetsConfigured && googleSheets && googleSheets.initialized) {
    await actualizarEstadoPedidoEnSheets(googleSheets, pedidoId, 'Pago verificado ✅');
}
CODE
echo ""
echo "================================================"
echo ""
echo "ESTRUCTURA CORRECTA DE COLUMNAS:"
echo "---------------------------------"
echo ""
echo "PedidosWhatsApp (20 columnas A-T):"
echo "A: ID_Pedido"
echo "B: Fecha"
echo "C: Hora"
echo "D: Empresa"
echo "E: Contacto"
echo "F: Telefono"
echo "G: Direccion"
echo "H: Producto"
echo "I: Cantidad_kg"
echo "J: Precio_Unitario"
echo "K: Subtotal"
echo "L: Descuento"
echo "M: Total"
echo "N: Metodo_Pago"
echo "O: Estado ← COLUMNA CRÍTICA"
echo "P: URL_Comprobante"
echo "Q: Observaciones"
echo "R: Tipo_Pedido"
echo "S: ID_Cliente"
echo "T: Usuario_WhatsApp"
echo ""
echo "Clientes (15 columnas A-O):"
echo "A: ID_Cliente"
echo "B: WhatsApp"
echo "C: Empresa"
echo "D: Nombre_Contacto"
echo "E: Telefono_Contacto"
echo "F: Email"
echo "G: Direccion"
echo "H: Distrito"
echo "I: Ciudad"
echo "J: Fecha_Registro"
echo "K: Ultima_Compra"
echo "L: Total_Pedidos"
echo "M: Total_Comprado"
echo "N: Total_Kg"
echo "O: Notas"
echo ""
echo "================================================"
echo ""
echo "COMANDOS PARA HACER PUSH:"
echo "-------------------------"
echo ""
echo "git add sheets-funciones-corregidas.js bot-final.js"
echo "git commit -m 'Fix: Corregir orden de columnas en Google Sheets"
echo ""
echo "- Columnas en orden correcto (A-T)"
echo "- Estado en columna O"
echo "- WhatsApp en columna T"
echo "- Guardar clientes separadamente"
echo "- Actualización de estados funcional'"
echo ""
echo "git push heroku main"
echo ""
echo "================================================"
echo ""
echo "IMPORTANTE ANTES DE HACER PUSH:"
echo "--------------------------------"
echo ""
echo "1. EN GOOGLE SHEETS:"
echo "   - Asegúrate que PedidosWhatsApp tiene encabezados hasta columna T"
echo "   - La columna O debe ser 'Estado'"
echo "   - La columna T debe ser 'Usuario_WhatsApp'"
echo "   - Crear encabezados en hoja Clientes si no existen"
echo ""
echo "2. VERIFICAR:"
echo "   - Los pedidos existentes están en las columnas correctas"
echo "   - Mover datos si es necesario"
echo ""
echo "================================================"
