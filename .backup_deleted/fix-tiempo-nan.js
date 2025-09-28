// Fix para el cálculo de tiempo en generarMenuConPedidos
// Reemplazar esta parte en sheets-lectura-datos.js

pedidosActivos.forEach(p => {
    // Calcular tiempo transcurrido con validación
    const ahora = new Date();
    let tiempoTexto = 'Reciente';
    
    // Validar que p.fecha sea una fecha válida
    if (p.fecha && !isNaN(p.fecha.getTime())) {
        const tiempoMs = ahora - p.fecha;
        const minutos = Math.floor(tiempoMs / (1000 * 60));
        
        if (minutos < 0) {
            tiempoTexto = 'Reciente';
        } else if (minutos < 60) {
            tiempoTexto = `${minutos} min`;
        } else if (minutos < 1440) {
            const horas = Math.floor(minutos / 60);
            tiempoTexto = `${horas} ${horas === 1 ? 'hora' : 'horas'}`;
        } else {
            const dias = Math.floor(minutos / 1440);
            tiempoTexto = `${dias} ${dias === 1 ? 'día' : 'días'}`;
        }
    } else {
        // Si no hay fecha válida, intentar parsearla de nuevo
        try {
            // La fecha viene como "27/9/2025" en tu caso
            const fechaStr = p.fechaStr || '';
            if (fechaStr) {
                const [dia, mes, año] = fechaStr.split('/');
                const fechaParseada = new Date(año, mes - 1, dia);
                if (!isNaN(fechaParseada.getTime())) {
                    const tiempoMs = ahora - fechaParseada;
                    const minutos = Math.floor(tiempoMs / (1000 * 60));
                    
                    if (minutos < 60) {
                        tiempoTexto = `${minutos} min`;
                    } else if (minutos < 1440) {
                        const horas = Math.floor(minutos / 60);
                        tiempoTexto = `${horas} ${horas === 1 ? 'hora' : 'horas'}`;
                    } else {
                        const dias = Math.floor(minutos / 1440);
                        tiempoTexto = `${dias} ${dias === 1 ? 'día' : 'días'}`;
                    }
                }
            }
        } catch (e) {
            tiempoTexto = 'Hoy';
        }
    }
    
    // Resto del código para mostrar el pedido...
});
