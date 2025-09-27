# 🔗 Integración con Google Sheets - Bot WhatsApp + Bot Telegram

## 📊 Compartir el mismo Excel entre ambos bots

Esta guía te ayudará a configurar el bot de WhatsApp para que use el mismo Google Sheet que el bot de Telegram.

## 📋 Pre-requisitos

1. ✅ Bot de Telegram ya configurado con Google Sheets
2. ✅ El archivo Excel ya convertido a Google Sheets
3. ✅ Service Account del bot de Telegram funcionando

## 🔧 Paso 1: Obtener el ID del Google Sheet

1. Abre el Google Sheet que usa el bot de Telegram
2. La URL será algo como:
   ```
   https://docs.google.com/spreadsheets/d/1ABC123def456.../edit
   ```
3. El ID es la parte después de `/d/`: `1ABC123def456...`
4. Guarda este ID

## 🔑 Paso 2: Usar las mismas credenciales o crear nuevas

### Opción A: Usar las mismas credenciales del bot de Telegram (Recomendado)

Si tienes el archivo JSON del Service Account del bot de Telegram:

1. Usa el mismo archivo JSON
2. Ve al paso 3

### Opción B: Crear un nuevo Service Account

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona el mismo proyecto del bot de Telegram
3. Ve a **IAM & Admin** → **Service Accounts**
4. Click **"Create Service Account"**
5. Nombre: `cafe-bot-whatsapp`
6. Click **"Create and Continue"**
7. Rol: **Editor**
8. Click **"Done"**
9. Click en el Service Account creado
10. Ve a **Keys** → **Add Key** → **Create new key**
11. Selecciona **JSON**
12. Guarda el archivo descargado

## 📧 Paso 3: Compartir el Sheet con el Service Account

1. Abre el Google Sheet
2. Click en **"Compartir"** (botón arriba a la derecha)
3. Agrega el email del Service Account:
   - Si usas el mismo: `cafe-bot-telegram@tu-proyecto.iam.gserviceaccount.com`
   - Si creaste uno nuevo: `cafe-bot-whatsapp@tu-proyecto.iam.gserviceaccount.com`
4. Permisos: **Editor**
5. Click **"Enviar"**

## ⚙️ Paso 4: Configurar variables en Heroku

### En el dashboard de Heroku:

1. Ve a **Settings** → **Config Vars**
2. Agrega estas variables:

#### GOOGLE_SPREADSHEET_ID
```
1ABC123def456...
```
(El ID del paso 1)

#### GOOGLE_SERVICE_ACCOUNT_KEY
```json
{
  "type": "service_account",
  "project_id": "tu-proyecto",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "cafe-bot@tu-proyecto.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

**IMPORTANTE**: Copia TODO el contenido del archivo JSON como una sola línea.

### Desde la terminal (alternativa):

```bash
# Configurar Spreadsheet ID
heroku config:set GOOGLE_SPREADSHEET_ID="1ABC123def456..." --app tu-app

# Configurar Service Account (minifica el JSON primero)
heroku config:set GOOGLE_SERVICE_ACCOUNT_KEY="$(cat service-account-key.json | jq -c .)" --app tu-app
```

## 🔄 Paso 5: Actualizar el bot

```bash
# En Heroku Dashboard
1. Ve a "Deploy"
2. Click "Deploy Branch"

# O desde terminal
git pull origin main
git push heroku main
```

## ✅ Paso 6: Verificar la integración

1. Abre tu app: `https://tu-app.herokuapp.com`
2. En el panel principal deberías ver:
   - "✅ Google Sheets conectado"
   - El ID del Spreadsheet

3. Revisa los logs:
```bash
heroku logs --tail --app tu-app
```

Deberías ver:
```
✅ Google Sheets conectado correctamente
📊 Spreadsheet ID: 1ABC123def456...
✅ Hoja PedidosWhatsApp ya existe (o creada)
```

## 📊 Estructura del Google Sheet

El bot creará automáticamente una hoja llamada **"PedidosWhatsApp"** con estas columnas:

| Columna | Descripción |
|---------|------------|
| ID_Pedido | Identificador único (CAF-123456) |
| Fecha | Fecha del pedido |
| Hora | Hora del pedido |
| Cliente | Nombre del cliente |
| Cafetería | Nombre del negocio |
| Teléfono | WhatsApp del cliente |
| Producto | Tipo de café |
| Cantidad_kg | Cantidad en kilogramos |
| Precio_Unitario | Precio por kg |
| Subtotal | Precio sin descuento |
| Descuento | Descuento aplicado |
| Total | Total a pagar |
| Dirección | Dirección de entrega |
| Contacto | Teléfono de contacto |
| Observaciones | Notas adicionales |
| Estado | Estado del pedido |
| Fecha_Entrega | Fecha estimada de entrega |
| Método_Pago | Forma de pago |
| Origen | Siempre "WhatsApp" |

## 🧪 Probar la integración

1. Envía un mensaje de prueba al bot por WhatsApp
2. Completa un pedido
3. Verifica que aparezca en el Google Sheet
4. El pedido debería estar en la hoja "PedidosWhatsApp"

## 🔍 Troubleshooting

### Error: "Google Sheets no configurado"
- Verifica que configuraste `GOOGLE_SPREADSHEET_ID`
- Verifica que configuraste `GOOGLE_SERVICE_ACCOUNT_KEY`

### Error: "Error accediendo al spreadsheet"
- Verifica que compartiste el Sheet con el Service Account
- El Service Account necesita permisos de "Editor"

### Error: "Error parseando credenciales"
- El JSON debe estar en una sola línea
- Verifica que copiaste TODO el contenido del JSON

### Ver el estado de Google Sheets:
```bash
# En la app
https://tu-app.herokuapp.com/api/sheets-status

# En los logs
heroku logs --tail | grep "Google"
```

## 📈 Funcionalidades con Google Sheets

Una vez configurado, el bot:

1. **Guarda automáticamente** cada pedido en el Sheet
2. **Lee pedidos** para mostrar en el panel admin
3. **Actualiza estados** de los pedidos
4. **Genera estadísticas** desde el Sheet
5. **Comparte datos** con el bot de Telegram

## 🎯 Ventajas de la integración

- ✅ **Fuente única de verdad**: Un solo Excel para ambos bots
- ✅ **Sincronización en tiempo real**: Los cambios se reflejan inmediatamente
- ✅ **Backup automático**: Google guarda el historial de cambios
- ✅ **Acceso desde cualquier lugar**: Puedes ver/editar el Excel desde cualquier dispositivo
- ✅ **Reportes unificados**: Todos los pedidos en un solo lugar

## 🔗 API Endpoints disponibles

```javascript
GET /api/sheets-status     // Estado de la conexión
GET /api/sheets-pedidos    // Últimos pedidos del Sheet
GET /api/sheets-stats      // Estadísticas desde el Sheet
POST /api/sheets-sync      // Forzar sincronización
```

## 📝 Notas importantes

1. Los pedidos se guardan en hojas separadas:
   - **Bot Telegram**: Puede usar hojas como "Compras", "Ventas", etc.
   - **Bot WhatsApp**: Usa la hoja "PedidosWhatsApp"

2. Ambos bots pueden leer todas las hojas pero solo escriben en las suyas

3. Puedes crear dashboards y fórmulas que combinen datos de ambos bots

---

¡Con esto, ambos bots estarán sincronizados y compartiendo el mismo Google Sheet! 🎉
