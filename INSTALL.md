# 📥 Instrucciones de Instalación Completa

Este repositorio contiene la estructura base del bot. Para obtener el código completo, sigue estas instrucciones:

## 🚀 Instalación Rápida

```bash
# Clonar el repositorio
git clone https://github.com/sofiaqsy/cafe-bot-whatsapp.git
cd cafe-bot-whatsapp

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Twilio

# Iniciar el bot
npm start
```

## 📁 Archivos Principales Necesarios

Los siguientes archivos principales deben estar en el proyecto:

### 1. `bot-seguimiento.js` (Bot Principal)
- Sistema conversacional completo
- Detección inteligente de intenciones
- Flujo de pedidos paso a paso
- Integración con Excel local

### 2. `bot-google-drive-heroku.js` (Bot con Google Drive)
- Versión para Heroku con PostgreSQL
- Sincronización con Google Sheets
- Panel de administración web

### 3. `integrations/google-drive-integration.js`
- Módulo de integración con Google Drive API
- CRUD de pedidos en Google Sheets
- Backup automático

### 4. `integrations/excel-integration.js`
- Lectura/escritura de archivos Excel
- Generación de reportes
- Exportación de datos

### 5. `admin.html`
- Panel de administración web
- Dashboard con estadísticas
- Gestión de pedidos

## 🔧 Configuración de Twilio

1. Crear cuenta en [Twilio](https://www.twilio.com)
2. Activar WhatsApp Sandbox
3. Configurar webhook:
   ```
   URL: https://tu-app.herokuapp.com/webhook
   Method: POST
   ```

## 🌐 Despliegue en Heroku

### Con el botón de Heroku:
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/sofiaqsy/cafe-bot-whatsapp)

### Manual:
```bash
heroku create tu-app-name
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set TWILIO_ACCOUNT_SID="tu_sid"
heroku config:set TWILIO_AUTH_TOKEN="tu_token"
git push heroku main
```

## 📊 Integración con Google Sheets (Opcional)

1. Crear proyecto en Google Cloud Platform
2. Habilitar APIs (Drive y Sheets)
3. Crear Service Account
4. Configurar credenciales:
   ```bash
   heroku config:set GOOGLE_SPREADSHEET_ID="tu_id"
   heroku config:set GOOGLE_SERVICE_ACCOUNT_KEY='{"json":"completo"}'
   ```

## 🆘 Soporte

Si necesitas ayuda con la instalación o configuración:
- Abre un [Issue](https://github.com/sofiaqsy/cafe-bot-whatsapp/issues)
- Contacta: ventas@coffeeexpress.com

## 📝 Estructura del Proyecto Completo

```
cafe-bot-whatsapp/
├── bot-seguimiento.js          # Bot principal
├── bot-google-drive-heroku.js  # Bot con Google Drive
├── package.json                # Dependencias
├── package-lock.json           # Lock de dependencias
├── Procfile                    # Config Heroku
├── Procfile.google            # Config Heroku con Google
├── app.json                   # Deploy button config
├── admin.html                 # Panel admin
├── integrations/
│   ├── google-drive-integration.js
│   └── excel-integration.js
├── data/                      # Datos locales
│   └── pedidos/
├── logs/                      # Archivos de log
├── docs/                      # Documentación
│   ├── GOOGLE-DRIVE-SETUP.md
│   ├── TWILIO-SETUP.md
│   └── HEROKU-DEPLOY.md
├── test/                      # Tests
│   ├── test-cantidad.js
│   └── test-deteccion.js
├── .env.example              # Template de variables
├── .gitignore                # Archivos ignorados
├── LICENSE                   # Licencia MIT
└── README.md                 # Este archivo
```

## ⚡ Características del Bot

- ✅ Recepción de pedidos 24/7
- ✅ Catálogo de 5 tipos de café
- ✅ Descuentos automáticos por volumen
- ✅ Seguimiento en tiempo real
- ✅ Notificaciones de estado
- ✅ Panel de administración web
- ✅ Exportación a Excel/CSV
- ✅ Integración con Google Sheets
- ✅ API REST para integraciones
- ✅ Compatible con Bot de Telegram

## 🔄 Actualizaciones

Para obtener las últimas actualizaciones:
```bash
git pull origin main
npm install
```

---

⭐ Si este proyecto te es útil, dale una estrella en GitHub
