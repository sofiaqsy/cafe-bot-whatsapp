// Función corregida para calcular tiempo transcurrido
function calcularTiempoTranscurrido(fecha) {
    // Validar que sea una fecha válida
    if (!fecha || isNaN(fecha.getTime())) {
        return 'Hoy';
    }
    
    const ahora = new Date();
    const tiempoMs = ahora - fecha;
    const minutos = Math.floor(tiempoMs / (1000 * 60));
    
    // Si es negativo (fecha futura), mostrar "Reciente"
    if (minutos < 0) {
        return 'Reciente';
    }
    
    // Menos de 1 minuto
    if (minutos === 0) {
        return 'Ahora mismo';
    }
    
    // Menos de 60 minutos - mostrar minutos
    if (minutos < 60) {
        return `${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
    }
    
    // Menos de 24 horas - mostrar horas
    if (minutos < 1440) {
        const horas = Math.floor(minutos / 60);
        return `${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    }
    
    // Más de 24 horas - mostrar días
    const dias = Math.floor(minutos / 1440);
    return `${dias} ${dias === 1 ? 'día' : 'días'}`;
}

// Usar en generarMenuConPedidos:
pedidosActivos.forEach(p => {
    // Calcular tiempo transcurrido
    const tiempoTexto = calcularTiempoTranscurrido(p.fecha);
    
    // Determinar ícono según estado
    let iconoEstado = '⏳';
    let textoEstado = p.estado;
    
    if (p.estado && (p.estado.includes('verificado') || p.estado.includes('✅'))) {
        iconoEstado = '✅';
        textoEstado = 'Pago verificado';
    } else if (p.estado && p.estado.includes('preparación')) {
        iconoEstado = '👨‍🍳';
        textoEstado = 'En preparación';
    } else if (p.estado && p.estado.includes('camino')) {
        iconoEstado = '🚚';
        textoEstado = 'En camino';
    } else if (p.estado && p.estado.includes('Pendiente')) {
        iconoEstado = '⏳';
        textoEstado = 'Pendiente verificación';
    }
    
    headerPedidos += `${iconoEstado} *${p.id}*\n`;
    headerPedidos += `   ${p.producto}\n`;
    headerPedidos += `   ${p.cantidad}kg - S/${p.total.toFixed(2)}\n`;
    headerPedidos += `   Estado: *${textoEstado}*\n`;
    headerPedidos += `   ⏱️ Hace ${tiempoTexto}\n\n`;
});
