# 📊 CONFIGURACIÓN RÁPIDA DE GOOGLE SHEETS PARA EL BOT

## ⚡ Configuración en 5 minutos

### Paso 1: Crear un Google Sheet
1. Ve a [Google Sheets](https://sheets.google.com)
2. Crea un nuevo documento o usa uno existente
3. Copia el ID del documento desde la URL:
   ```
   https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit
   ```
   Tu ID es: `1nsV6uAHE-U4Tz-uLYoIroDYcP84GdQj7uhrflXP-irQ`

### Paso 2: Crear Service Account (Cuenta de Servicio)

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto nuevo o selecciona uno existente
3. Busca "Service Accounts" en el buscador
4. Click en "Create Service Account"
5. Nombre: `bot-cafe-whatsapp`
6. Click "Create and Continue"
7. Rol: "Editor"
8. Click "Done"

### Paso 3: Obtener las credenciales JSON

1. Click en el Service Account creado
2. Ve a la pestaña "Keys"
3. Click "Add Key" → "Create new key"
4. Selecciona "JSON"
5. Se descargará un archivo JSON

### Paso 4: Compartir el Sheet con el Service Account

1. Abre tu Google Sheet
2. Click en "Compartir" (arriba a la derecha)
3. En el archivo JSON descargado, busca el campo "client_email"
4. Copia ese email (algo como: bot-cafe@proyecto.iam.gserviceaccount.com)
5. Pega ese email en "Compartir" y dale permisos de "Editor"
6. Click "Enviar"

### Paso 5: Configurar el archivo .env

1. Abre el archivo JSON descargado
2. Copia TODO el contenido
3. Ve a un convertidor online: https://www.text-utils.com/json-formatter/
4. Pega el JSON y selecciona "Minify"
5. Copia el JSON minificado (todo en una línea)

En tu archivo `.env`:

```bash
# Google Sheets
GOOGLE_SPREADSHEET_ID=1nsV6uAHE-U4Tz-uLYoIroDYcP84GdQj7uhrflXP-irQ
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...todo el json en una linea..."}
```

### Paso 6: Verificar la conexión

1. Reinicia el bot:
   ```bash
   node bot-final.js
   ```

2. Deberías ver:
   ```
   ✅ Google Sheets conectado correctamente
   📊 Spreadsheet ID: 1nsV6uAHE-U4Tz-uLYoIroDYcP84GdQj7uhrflXP-irQ
   ```

3. Haz un pedido de prueba y verifica que aparezca en el Sheet

## 🎯 Estructura del Google Sheet

El bot creará automáticamente una hoja llamada "PedidosWhatsApp" con estas columnas:

| ID_Pedido | Fecha | Hora | Cliente | Producto | Cantidad_kg | Total | Dirección | Estado |
|-----------|-------|------|---------|----------|-------------|-------|-----------|--------|
| CAF-123456 | 27/09/2025 | 15:30 | Mi Café | Premium | 10 | 500 | Av. Principal 123 | Confirmado |

## ❌ Errores comunes

**"Google Sheets no se pudo inicializar"**
- Verifica que el JSON esté en una sola línea
- Verifica que compartiste el Sheet con el Service Account

**"Error guardando en Google Sheets"**
- Verifica que el Service Account tenga permisos de Editor
- Verifica que el ID del Sheet sea correcto

## 🆘 ¿Necesitas ayuda?

Si el bot de Telegram ya está funcionando con este Sheet, puedes:
1. Usar el mismo Service Account del bot de Telegram
2. O crear uno nuevo siguiendo los pasos anteriores

El bot guardará automáticamente todos los pedidos en el Sheet! 🎉
