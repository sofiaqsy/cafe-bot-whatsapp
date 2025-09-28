// Funciones corregidas para Google Sheets con el orden correcto de columnas
// Este archivo contiene las funciones actualizadas para guardar correctamente en Sheets

// Función para agregar pedido a Google Sheets con columnas corregidas
async function agregarPedidoCorregido(googleSheets, datosPedido) {
    if (!googleSheets || !googleSheets.initialized) {
        console.log('⚠️ Google Sheets no inicializado');
        return false;
    }

    try {
        // Formatear fecha y hora
        const fecha = new Date();
        const fechaStr = fecha.toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
        const horaStr = fecha.toLocaleTimeString('es-PE', { timeZone: 'America/Lima' });
        
        // Extraer nombre y teléfono del contacto si vienen combinados
        let nombreContacto = datosPedido.contacto || '';
        let telefonoContacto = datosPedido.telefonoContacto || '';
        
        if (datosPedido.contacto && datosPedido.contacto.includes(' - ')) {
            const partes = datosPedido.contacto.split(' - ');
            nombreContacto = partes[0] || '';
            telefonoContacto = partes[1] || datosPedido.telefonoContacto || '';
        }
        
        // IMPORTANTE: El Usuario WhatsApp es SIEMPRE el número de la sesión (from)
        // No importa qué teléfono ingrese el cliente en el chat
        const whatsappSesion = datosPedido.whatsappSesion || datosPedido.telefono || '';
        const whatsappNormalizado = whatsappSesion
            .replace('whatsapp:', '')
            .replace(/[^0-9+]/g, '');
        
        console.log('📱 WhatsApp de sesión (from):', whatsappNormalizado);
        console.log('📞 Teléfono de contacto ingresado:', telefonoContacto);
        
        // IMPORTANTE: Array de valores en el ORDEN CORRECTO de columnas
        const values = [[
            datosPedido.id || `CAF-${Date.now().toString().slice(-6)}`,      // A: ID_Pedido
            fechaStr,                                                          // B: Fecha
            horaStr,                                                           // C: Hora
            datosPedido.empresa || datosPedido.cafeteria || datosPedido.nombreNegocio || '', // D: Empresa
            nombreContacto,                                                    // E: Contacto
            telefonoContacto || '',                                           // F: Telefono (el que ingresa el cliente)
            datosPedido.direccion || '',                                      // G: Direccion
            datosPedido.producto?.nombre || '',                               // H: Producto
            datosPedido.cantidad || 0,                                        // I: Cantidad_kg
            datosPedido.producto?.precio || 0,                                // J: Precio_Unitario
            datosPedido.subtotal || (datosPedido.cantidad * datosPedido.producto?.precio) || datosPedido.total || 0, // K: Subtotal
            datosPedido.descuento || 0,                                       // L: Descuento
            datosPedido.total || 0,                                           // M: Total
            datosPedido.metodoPago || 'Transferencia',                       // N: Metodo_Pago
            datosPedido.estado || 'Pendiente verificación',                   // O: Estado ← COLUMNA CRÍTICA
            datosPedido.urlComprobante || '',                                 // P: URL_Comprobante
            datosPedido.observaciones || datosPedido.comprobanteRecibido ? 'Comprobante recibido' : '', // Q: Observaciones
            datosPedido.esReorden ? 'Reorden' : 'Nuevo',                     // R: Tipo_Pedido
            '',                                                                // S: ID_Cliente (se llenará después)
            whatsappNormalizado                                               // T: Usuario_WhatsApp (SIEMPRE el from)
        ]];

        console.log('📝 Guardando pedido en Sheets:');
        console.log('   ID:', values[0][0]);
        console.log('   Empresa:', values[0][3]);
        console.log('   Contacto:', values[0][4]);
        console.log('   Teléfono contacto:', values[0][5]);
        console.log('   Producto:', values[0][7]);
        console.log('   Total: S/', values[0][12]);
        console.log('   Estado:', values[0][14]);
        console.log('   Usuario WhatsApp (sesión):', values[0][19]);

        // Agregar a la hoja PedidosWhatsApp
        const response = await googleSheets.sheets.spreadsheets.values.append({
            spreadsheetId: googleSheets.spreadsheetId,
            range: 'PedidosWhatsApp!A:T', // Rango completo hasta columna T
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: values
            }
        });

        console.log(`✅ Pedido ${datosPedido.id} guardado correctamente en Google Sheets`);
        
        // Intentar guardar/actualizar cliente (sin bloquear si falla)
        try {
            await guardarClienteEnSheets(googleSheets, {
                whatsapp: whatsappSesion, // Usar el WhatsApp de la sesión
                empresa: datosPedido.empresa || datosPedido.cafeteria || datosPedido.nombreNegocio,
                contacto: nombreContacto,
                telefonoContacto: telefonoContacto || '',
                direccion: datosPedido.direccion,
                totalPedido: datosPedido.total,
                cantidadKg: datosPedido.cantidad
            });
        } catch (errorCliente) {
            console.log('⚠️ No se pudo actualizar cliente:', errorCliente.message);
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error agregando pedido a Sheets:', error);
        console.error('   Detalles:', error.message);
        if (error.response) {
            console.error('   Respuesta:', error.response.data);
        }
        return false;
    }
}

// Función para guardar o actualizar cliente en la hoja Clientes
async function guardarClienteEnSheets(googleSheets, datosCliente) {
    if (!googleSheets || !googleSheets.initialized) {
        return null;
    }
    
    try {
        const telefonoNormalizado = datosCliente.whatsapp
            .replace('whatsapp:', '')
            .replace(/[^0-9+]/g, '');
        
        // Primero verificar si el cliente ya existe
        const responseClientes = await googleSheets.sheets.spreadsheets.values.get({
            spreadsheetId: googleSheets.spreadsheetId,
            range: 'Clientes!A:O'
        }).catch(() => ({ data: { values: [] } }));
        
        const clientesData = responseClientes.data.values || [];
        
        // Si no hay encabezados, crearlos
        if (clientesData.length === 0) {
            const encabezados = [[
                'ID_Cliente',
                'WhatsApp',
                'Empresa',
                'Nombre_Contacto',
                'Telefono_Contacto',
                'Email',
                'Direccion',
                'Distrito',
                'Ciudad',
                'Fecha_Registro',
                'Ultima_Compra',
                'Total_Pedidos',
                'Total_Comprado',
                'Total_Kg',
                'Notas'
            ]];
            
            await googleSheets.sheets.spreadsheets.values.update({
                spreadsheetId: googleSheets.spreadsheetId,
                range: 'Clientes!A1:O1',
                valueInputOption: 'RAW',
                requestBody: { values: encabezados }
            });
            
            console.log('✅ Encabezados creados en hoja Clientes');
        }
        
        // Buscar si el cliente ya existe
        let clienteExistente = null;
        let filaCliente = -1;
        
        if (clientesData.length > 1) {
            for (let i = 1; i < clientesData.length; i++) {
                const row = clientesData[i];
                const telCliente = row[1] ? row[1].replace(/[^0-9+]/g, '') : '';
                if (telCliente === telefonoNormalizado) {
                    clienteExistente = {
                        idCliente: row[0],
                        totalPedidos: parseInt(row[11] || '0'),
                        totalComprado: parseFloat(row[12] || '0'),
                        totalKg: parseFloat(row[13] || '0')
                    };
                    filaCliente = i + 1; // +1 porque los índices de Sheets empiezan en 1
                    break;
                }
            }
        }
        
        const fechaActual = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
        
        if (clienteExistente) {
            // Actualizar cliente existente
            const valoresActualizados = [[
                clienteExistente.idCliente,                                   // A: ID_Cliente (mantener)
                telefonoNormalizado,                                          // B: WhatsApp
                datosCliente.empresa || '',                                   // C: Empresa
                datosCliente.contacto || '',                                  // D: Nombre_Contacto
                datosCliente.telefonoContacto || telefonoNormalizado,        // E: Telefono_Contacto
                '',                                                            // F: Email
                datosCliente.direccion || '',                                 // G: Direccion
                '',                                                            // H: Distrito
                'Lima',                                                        // I: Ciudad
                clientesData[filaCliente - 1][9] || fechaActual,             // J: Fecha_Registro (mantener original)
                fechaActual,                                                  // K: Ultima_Compra
                (clienteExistente.totalPedidos + 1).toString(),              // L: Total_Pedidos
                (clienteExistente.totalComprado + (datosCliente.totalPedido || 0)).toFixed(2), // M: Total_Comprado
                (clienteExistente.totalKg + (datosCliente.cantidadKg || 0)).toString(), // N: Total_Kg
                ''                                                             // O: Notas
            ]];
            
            await googleSheets.sheets.spreadsheets.values.update({
                spreadsheetId: googleSheets.spreadsheetId,
                range: `Clientes!A${filaCliente}:O${filaCliente}`,
                valueInputOption: 'RAW',
                requestBody: { values: valoresActualizados }
            });
            
            console.log(`✅ Cliente actualizado: ${datosCliente.empresa} (${clienteExistente.idCliente})`);
            return clienteExistente.idCliente;
            
        } else {
            // Crear nuevo cliente
            const idCliente = 'CLI-' + Date.now().toString().slice(-8);
            
            const valoresNuevoCliente = [[
                idCliente,                                              // A: ID_Cliente
                telefonoNormalizado,                                   // B: WhatsApp
                datosCliente.empresa || '',                           // C: Empresa
                datosCliente.contacto || '',                          // D: Nombre_Contacto
                datosCliente.telefonoContacto || telefonoNormalizado, // E: Telefono_Contacto
                '',                                                     // F: Email
                datosCliente.direccion || '',                         // G: Direccion
                '',                                                     // H: Distrito
                'Lima',                                                // I: Ciudad
                fechaActual,                                           // J: Fecha_Registro
                fechaActual,                                           // K: Ultima_Compra
                '1',                                                   // L: Total_Pedidos
                (datosCliente.totalPedido || 0).toString(),          // M: Total_Comprado
                (datosCliente.cantidadKg || 0).toString(),           // N: Total_Kg
                'Cliente nuevo'                                       // O: Notas
            ]];
            
            await googleSheets.sheets.spreadsheets.values.append({
                spreadsheetId: googleSheets.spreadsheetId,
                range: 'Clientes!A:O',
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                requestBody: { values: valoresNuevoCliente }
            });
            
            console.log(`✅ Nuevo cliente creado: ${datosCliente.empresa} (${idCliente})`);
            return idCliente;
        }
    } catch (error) {
        console.error('Error guardando cliente:', error.message);
        return null;
    }
}

// Función para actualizar estado de pedido en Sheets
async function actualizarEstadoPedidoEnSheets(googleSheets, idPedido, nuevoEstado) {
    if (!googleSheets || !googleSheets.initialized) {
        return false;
    }
    
    try {
        // Buscar el pedido en la hoja
        const response = await googleSheets.sheets.spreadsheets.values.get({
            spreadsheetId: googleSheets.spreadsheetId,
            range: 'PedidosWhatsApp!A:A'
        });
        
        if (!response.data.values) {
            return false;
        }
        
        // Encontrar la fila del pedido
        const filaIndex = response.data.values.findIndex(row => row[0] === idPedido);
        
        if (filaIndex > 0) { // > 0 porque la fila 0 son los encabezados
            // Actualizar el estado (columna O = columna 15)
            await googleSheets.sheets.spreadsheets.values.update({
                spreadsheetId: googleSheets.spreadsheetId,
                range: `PedidosWhatsApp!O${filaIndex + 1}`, // Columna O = Estado
                valueInputOption: 'RAW',
                requestBody: {
                    values: [[nuevoEstado]]
                }
            });
            
            console.log(`✅ Estado actualizado en Sheets: ${idPedido} -> ${nuevoEstado}`);
            return true;
        }
        
        console.log(`⚠️ No se encontró el pedido ${idPedido} en Sheets`);
        return false;
    } catch (error) {
        console.error('Error actualizando estado en Sheets:', error.message);
        return false;
    }
}

module.exports = {
    agregarPedidoCorregido,
    guardarClienteEnSheets,
    actualizarEstadoPedidoEnSheets
};
