# Configuración de Google Forms para Comprobantes

## Paso 1: Crear el Formulario

1. Ve a [Google Forms](https://forms.google.com)
2. Crea un nuevo formulario con título "Comprobantes de Pago - Coffee Express"
3. Agrega los siguientes campos:

### Campos del Formulario:

1. **Código de Pedido** (Obligatorio)
   - Tipo: Respuesta corta
   - Validación: Expresión regular `CAF-\d{6}`
   - Mensaje de error: "Formato inválido. Ejemplo: CAF-123456"

2. **Número de WhatsApp** (Obligatorio)
   - Tipo: Respuesta corta
   - Validación: Número de teléfono

3. **Comprobante de Pago** (Obligatorio)
   - Tipo: Subir archivo
   - Permitir solo imágenes
   - Tamaño máximo: 10MB

4. **Observaciones** (Opcional)
   - Tipo: Párrafo

## Paso 2: Configurar Respuestas

1. En el formulario, ve a "Respuestas"
2. Click en los 3 puntos → "Seleccionar destino de las respuestas"
3. Crear nueva hoja de cálculo: "Comprobantes_Pagos"
4. Esto creará automáticamente un Google Sheet con las respuestas

## Paso 3: Configurar Notificaciones

1. En "Respuestas" → 3 puntos → "Recibir notificaciones por correo electrónico"
2. Activar "Notificación por cada respuesta"
3. Las imágenes se guardarán automáticamente en Drive en:
   - `Mi unidad/Comprobantes de Pago - Coffee Express (File responses)/`

## Paso 4: Obtener el Link Corto

1. Click en "Enviar" (botón morado arriba a la derecha)
2. Click en el ícono de link 🔗
3. Activar "Acortar URL"
4. Copiar el link (ejemplo: `https://forms.gle/AbCdEf123456`)

## Paso 5: Script Automático (Opcional)

Para automatizar la verificación, puedes agregar un script:

```javascript
function onFormSubmit(e) {
  // Obtener datos del formulario
  var codigoPedido = e.values[1]; // CAF-123456
  var whatsapp = e.values[2];
  var linkComprobante = e.values[3];
  var timestamp = e.values[0];
  
  // Aquí puedes:
  // 1. Enviar notificación a Telegram
  // 2. Actualizar estado en otra hoja
  // 3. Enviar email de confirmación
  
  // Ejemplo: Marcar como recibido en hoja de pedidos
  var sheetPedidos = SpreadsheetApp.openById('ID_HOJA_PEDIDOS');
  var pedidos = sheetPedidos.getSheetByName('Pedidos');
  var data = pedidos.getDataRange().getValues();
  
  for(var i = 1; i < data.length; i++) {
    if(data[i][0] == codigoPedido) { // Columna A = ID Pedido
      pedidos.getRange(i + 1, 10).setValue('Comprobante Recibido');
      pedidos.getRange(i + 1, 11).setValue(timestamp);
      pedidos.getRange(i + 1, 12).setValue(linkComprobante);
      break;
    }
  }
}
```

## Paso 6: Configurar Variables en Heroku

```bash
heroku config:set GOOGLE_FORM_URL="https://forms.gle/TU_LINK_AQUI"
```

## Ventajas de este método:

✅ No requiere programación adicional
✅ Archivos se guardan automáticamente en Drive
✅ Notificaciones por email instantáneas
✅ Hoja de cálculo con todos los comprobantes
✅ Fácil de administrar y revisar
✅ El cliente puede subir desde cualquier dispositivo
✅ Funciona con imágenes y PDFs

## Link de Ejemplo para el Bot:

El bot enviará algo como:
```
📸 ENVÍO DE COMPROBANTE:

Sube tu comprobante aquí:
https://forms.gle/AbCdEf123456

Ingresa tu código: CAF-XXXXXX
```

## Panel de Control:

Puedes ver todos los comprobantes en:
1. Google Drive: Carpeta de respuestas del formulario
2. Google Sheets: Hoja con todos los datos
3. Gmail: Notificaciones instantáneas
