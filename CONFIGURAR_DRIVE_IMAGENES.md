# Configuración de Google Drive para Comprobantes de WhatsApp

## 📋 Variables de Entorno Necesarias en Heroku

Agrega estas variables en Heroku basándote en tu configuración de Telegram:

```bash
# Habilitar Google Drive
DRIVE_ENABLED=TRUE

# ID de la carpeta donde se guardarán los comprobantes de WhatsApp
DRIVE_COMPROBANTES_ID=TU_ID_CARPETA_AQUI

# Credenciales de servicio (ya deberías tenerla si usas Google Sheets)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
```

## 🚀 Comandos para Configurar en Heroku

### 1. Crear la carpeta en Google Drive

1. Ve a [Google Drive](https://drive.google.com)
2. Crea una nueva carpeta llamada "Comprobantes_WhatsApp"
3. Copia el ID de la carpeta desde la URL:
   - URL: `https://drive.google.com/drive/folders/ABC123XYZ`
   - ID: `ABC123XYZ`

### 2. Dar permisos a la cuenta de servicio

1. Click derecho en la carpeta → "Compartir"
2. Agrega el email de tu cuenta de servicio (termina en @...iam.gserviceaccount.com)
3. Dale permisos de "Editor"

### 3. Configurar las variables en Heroku

```bash
# Habilitar Drive
heroku config:set DRIVE_ENABLED=TRUE

# Configurar el ID de la carpeta de comprobantes
heroku config:set DRIVE_COMPROBANTES_ID="TU_ID_CARPETA_AQUI"

# Si aún no tienes la cuenta de servicio configurada:
heroku config:set GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

### 4. Instalar dependencias y hacer deploy

```bash
# Instalar nueva dependencia localmente
npm install axios

# Commit de los cambios
git add .
git commit -m "v4.1: Soporte para recibir imágenes de WhatsApp en Google Drive"

# Push a GitHub
git push origin main

# Deploy a Heroku
git push heroku main

# Ver logs para confirmar
heroku logs --tail
```

## ✅ Verificación

Cuando el bot inicie correctamente, deberías ver en los logs:

```
✅ Google Drive conectado para comprobantes
📁 Folder de comprobantes: TU_ID_CARPETA
```

## 🎯 Cómo Funciona

1. **Cliente envía imagen por WhatsApp**
   - El bot detecta que es una imagen
   - Verifica que esté en el paso "esperando_comprobante"

2. **Proceso automático:**
   - Descarga la imagen de Twilio (con autenticación)
   - La sube a Google Drive
   - Nombra el archivo: `CAF-123456_timestamp.jpg`
   - Guarda metadata (cliente, total, fecha)

3. **Respuesta al cliente:**
   - Confirma recepción del comprobante
   - Envía el link de Google Drive
   - Continúa con el proceso normal

## 📊 Estructura en Drive

```
Comprobantes_WhatsApp/
├── CAF-123456_1701234567890.jpg
├── CAF-123457_1701234567891.jpg
└── CAF-123458_1701234567892.jpg
```

## 🔍 Metadata Guardada

Cada imagen incluye en su descripción:
- ID del pedido
- Cliente (empresa)
- Teléfono
- Fecha y hora
- Monto total

## 💡 Ventajas

✅ **Automático:** No requiere intervención manual
✅ **Organizado:** Todos los comprobantes en un solo lugar
✅ **Trazable:** Cada imagen con su código de pedido
✅ **Integrado:** Funciona con el flujo existente
✅ **Seguro:** Solo accesible con permisos

## ⚠️ Importante

- Las imágenes de Twilio son temporales (se borran después de un tiempo)
- Por eso es importante subirlas a Drive inmediatamente
- El bot guarda el link de Drive para referencia futura

## 🆘 Solución de Problemas

### Si no se suben las imágenes:

1. Verifica que `DRIVE_ENABLED=TRUE`
2. Confirma el ID de la carpeta
3. Verifica permisos de la cuenta de servicio
4. Revisa los logs: `heroku logs --tail`

### Error de autenticación:

```bash
# Verificar que las credenciales estén bien configuradas
heroku config:get GOOGLE_SERVICE_ACCOUNT_KEY
```

### La carpeta no existe o no tiene permisos:

1. Verifica el ID de la carpeta
2. Asegúrate de compartirla con la cuenta de servicio
3. Dale permisos de "Editor"
