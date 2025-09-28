// CÓDIGO DE DEBUG TEMPORAL
// Agregar en bot-final.js después del case 'menu_principal':

// Agregar este caso temporal para debug
case 'debug':
    if (sheetsConfigured && googleSheets) {
        const { debugPedidosDetallado } = require('./debug-detallado');
        respuesta = await debugPedidosDetallado(googleSheets, from);
    } else {
        respuesta = 'Google Sheets no configurado';
    }
    break;

// Después de probar, puedes eliminarlo
