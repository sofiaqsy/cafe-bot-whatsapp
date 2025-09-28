// Función de debug para ver exactamente qué hay en Sheets
async function debugPedidosDetallado(googleSheets, telefono) {
    if (!googleSheets || !googleSheets.initialized) {
        return "Google Sheets no inicializado";
    }
    
    try {
        const telefonoNormalizado = telefono
            .replace('whatsapp:', '')
            .replace('+51', '')
            .replace(/[^0-9]/g, '');
        
        console.log(`\n===== DEBUG DETALLADO =====`);
        console.log(`Buscando: ${telefonoNormalizado}`);
        
        const response = await googleSheets.sheets.spreadsheets.values.get({
            spreadsheetId: googleSheets.spreadsheetId,
            range: 'PedidosWhatsApp!A:T'
        });
        
        if (!response.data.values || response.data.values.length <= 1) {
            return "No hay datos en PedidosWhatsApp";
        }
        
        let resultado = `🔍 DEBUG DETALLADO\n\n`;
        resultado += `Tu WhatsApp normalizado: ${telefonoNormalizado}\n\n`;
        resultado += `PEDIDOS EN SHEETS:\n`;
        
        // Revisar cada fila
        for (let i = 1; i < Math.min(5, response.data.values.length); i++) {
            const row = response.data.values[i];
            const whatsappEnSheets = row[19] || 'VACIO';
            const estado = row[14] || 'SIN ESTADO';
            const id = row[0] || 'SIN ID';
            
            resultado += `\nFila ${i}:\n`;
            resultado += `  ID: ${id}\n`;
            resultado += `  Col T original: "${whatsappEnSheets}"\n`;
            resultado += `  Col T tipo: ${typeof whatsappEnSheets}\n`;
            resultado += `  Col T longitud: ${String(whatsappEnSheets).length}\n`;
            
            // Mostrar carácter por carácter
            const chars = String(whatsappEnSheets).split('').map(c => c.charCodeAt(0));
            resultado += `  Códigos ASCII: [${chars.join(', ')}]\n`;
            
            // Normalizado
            const normalizado = String(whatsappEnSheets)
                .replace(/^'/, '')
                .replace('+51', '')
                .replace(/[^0-9]/g, '');
            
            resultado += `  Normalizado: "${normalizado}"\n`;
            resultado += `  Estado: ${estado}\n`;
            resultado += `  ¿Coincide?: ${normalizado === telefonoNormalizado ? 'SÍ ✅' : 'NO ❌'}\n`;
            
            if (normalizado !== telefonoNormalizado && normalizado.includes(telefonoNormalizado.slice(-4))) {
                resultado += `  ⚠️ Parece similar pero no coincide exactamente\n`;
            }
        }
        
        console.log(`===== FIN DEBUG =====\n`);
        
        return resultado;
        
    } catch (error) {
        return `Error en debug: ${error.message}`;
    }
}

module.exports = {
    debugPedidosDetallado
};
