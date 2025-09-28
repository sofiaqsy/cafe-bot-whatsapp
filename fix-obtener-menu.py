#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

# Leer el archivo
with open('order-handler.js', 'r', encoding='utf-8') as f:
    content = f.read()

# El nuevo método obtenerMenu corregido
new_method = '''    /**
     * Obtener menú con pedidos activos
     */
    obtenerMenu(userState, pedidosActivos, tieneHistorial) {
        let headerPedidos = '';
        
        // Mostrar pedidos activos si existen
        if (pedidosActivos && pedidosActivos.length > 0) {
            headerPedidos = `*TUS PEDIDOS ACTIVOS:*\\n`;
            headerPedidos += `━━━━━━━━━━━━━━━━━\\n`;
            
            pedidosActivos.forEach(p => {
                // Calcular tiempo transcurrido de forma segura
                let tiempoTexto = 'Hoy';
                
                try {
                    const fechaPedido = p.timestamp || p.fecha;
                    if (fechaPedido) {
                        const fecha = new Date(fechaPedido);
                        const ahora = new Date();
                        
                        if (!isNaN(fecha.getTime())) {
                            const tiempoMs = ahora - fecha;
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
                        }
                    }
                } catch (e) {
                    tiempoTexto = 'Hoy';
                }
                
                // Obtener el nombre del producto correctamente
                let nombreProducto = 'Producto';
                if (typeof p.producto === 'string') {
                    nombreProducto = p.producto;
                } else if (p.producto && p.producto.nombre) {
                    nombreProducto = p.producto.nombre;
                }
                
                // Formatear el pedido sin emojis excesivos
                headerPedidos += `\\n*${p.id}*\\n`;
                headerPedidos += `${nombreProducto}\\n`;
                headerPedidos += `${p.cantidad}kg - S/${(p.total || 0).toFixed(2)}\\n`;
                headerPedidos += `Estado: *${p.estado}*\\n`;
                headerPedidos += `Hace ${tiempoTexto}\\n`;
            });
            
            headerPedidos += `\\n_Usa el código para consultar detalles_\\n`;
            headerPedidos += `━━━━━━━━━━━━━━━━━\\n\\n`;
        }
        
        // Si hay un pedido en proceso (aún no confirmado), mostrarlo
        if (userState.data && userState.data.producto) {
            const cantidadStr = userState.data.cantidad ? `${userState.data.cantidad}kg` : 'cantidad por definir';
            const totalStr = userState.data.total ? `S/${userState.data.total.toFixed(2)}` : 'por calcular';
            
            headerPedidos += `*PEDIDO ACTUAL (sin confirmar)*\\n`;
            headerPedidos += `━━━━━━━━━━━━━━━━━\\n`;
            headerPedidos += `${userState.data.producto.nombre}\\n`;
            headerPedidos += `Cantidad: ${cantidadStr}\\n`;
            headerPedidos += `Total: ${totalStr}\\n`;
            headerPedidos += `━━━━━━━━━━━━━━━━━\\n\\n`;
            headerPedidos += `_Escribe *cancelar* para eliminar_\\n\\n`;
        }
        
        // Agregar opción de reordenar si tiene historial
        const opcionReordenar = tieneHistorial ? 
            `*4* - Volver a pedir\\n` : '';
        
        return `${headerPedidos}*MENÚ PRINCIPAL*

*1* - Ver catálogo y pedir
*2* - Consultar pedido
*3* - Información del negocio
${opcionReordenar}
Envía el número de tu elección`;
    }'''

# Buscar y reemplazar el método obtenerMenu
pattern = r'    /\*\*\s*\n\s*\*\s*Obtener menú con pedidos activos\s*\n\s*\*/\s*\n\s*obtenerMenu\(userState, pedidosActivos, tieneHistorial\) \{[^}]*?\n    \}'
match = re.search(pattern, content, re.DOTALL)

if match:
    # Reemplazar el método
    content = content[:match.start()] + new_method + content[match.end():]
    
    # Guardar el archivo actualizado
    with open('order-handler.js', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Método obtenerMenu actualizado correctamente")
    print("   - Corregido [object Object] -> ahora muestra el nombre del producto")
    print("   - Corregido NaN días -> ahora calcula el tiempo correctamente")
    print("   - Eliminados emojis excesivos del menú")
else:
    print("❌ No se pudo encontrar el método obtenerMenu")
    print("   Aplicando método alternativo...")
    
    # Buscar de forma más simple
    start_index = content.find("obtenerMenu(userState, pedidosActivos, tieneHistorial) {")
    if start_index != -1:
        # Encontrar el final del método
        brace_count = 0
        found_start = False
        end_index = start_index
        
        for i in range(start_index, len(content)):
            if content[i] == '{':
                brace_count += 1
                found_start = True
            elif content[i] == '}':
                brace_count -= 1
                if found_start and brace_count == 0:
                    end_index = i + 1
                    break
        
        # Encontrar el inicio del comentario
        comment_start = content.rfind("/**", 0, start_index)
        
        # Reemplazar
        content = content[:comment_start] + new_method + content[end_index:]
        
        # Guardar
        with open('order-handler.js', 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ Método actualizado usando método alternativo")
