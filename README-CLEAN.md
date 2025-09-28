# ☕ Café Bot - WhatsApp/Telegram Bot

Bot de pedidos para cafetería con integración de Google Sheets y notificaciones automáticas.

## 📁 Estructura del Proyecto (Archivos Esenciales)

```
cafe-bot-local/
│
├── 🎯 ARCHIVO PRINCIPAL
│   └── bot-final.js              # Bot principal con todas las funcionalidades
│
├── 📦 CONFIGURACIÓN
│   ├── package.json              # Dependencias y scripts
│   ├── package-lock.json         # Versiones exactas de dependencias
│   ├── Procfile                  # Configuración para Heroku
│   ├── .env                      # Variables de entorno (no subir a git)
│   ├── .env.example              # Plantilla de variables de entorno
│   └── .gitignore               # Archivos ignorados por git
│
├── 🔌 INTEGRACIONES
│   ├── google-sheets.js          # Conexión con Google Sheets
│   ├── google-drive-service.js   # Servicio de Google Drive para imágenes
│   ├── sheets-funciones-corregidas.js  # Funciones para escribir en Sheets
│   ├── sheets-lectura-datos.js   # Funciones para leer de Sheets
│   └── notification-service.js   # Servicio de notificaciones
│
├── 📚 DOCUMENTACIÓN
│   ├── README.md                 # Este archivo
│   ├── CONFIGURAR_SHEETS.md      # Guía para configurar Google Sheets
│   ├── DEPLOY_HEROKU.md          # Guía de despliegue en Heroku
│   └── [otros archivos .md]      # Documentación adicional
│
└── 🛠️ SCRIPTS ÚTILES
    ├── deploy-heroku-fixed.sh    # Script para desplegar en Heroku
    └── clean-project.sh          # Script de limpieza (puede eliminarse después de usar)
```

## 🚀 Inicio Rápido

### 1. Instalación Local

```bash
# Clonar el repositorio
git clone [tu-repositorio]
cd cafe-bot-local

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
```

### 2. Variables de Entorno Necesarias

```env
# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_PHONE_NUMBER=whatsapp:+14155238886

# Google Sheets
GOOGLE_SPREADSHEET_ID=id_de_tu_spreadsheet
GOOGLE_SERVICE_ACCOUNT_KEY=tu_json_key_completo

# Google Drive (opcional)
DRIVE_ENABLED=TRUE
GOOGLE_DRIVE_FOLDER_ID=id_carpeta_drive

# Configuración
DEV_MODE=false
PORT=3000
```

### 3. Ejecutar Localmente

```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

### 4. Desplegar en Heroku

```bash
# Configurar Heroku
heroku create nombre-de-tu-app

# Configurar variables de entorno
heroku config:set TWILIO_ACCOUNT_SID=xxx
heroku config:set TWILIO_AUTH_TOKEN=xxx
heroku config:set GOOGLE_SPREADSHEET_ID=xxx
heroku config:set GOOGLE_SERVICE_ACCOUNT_KEY='{"json":"completo"}'

# Desplegar
git push heroku main
```

## 🔧 Funcionalidades Principales

- ✅ **Gestión de Pedidos**: Recepción y procesamiento de pedidos por WhatsApp
- ✅ **Catálogo Dinámico**: Productos cargados desde Google Sheets
- ✅ **Registro de Clientes**: Base de datos de clientes en Sheets
- ✅ **Historial de Pedidos**: Seguimiento completo de pedidos
- ✅ **Notificaciones Automáticas**: Alertas al administrador
- ✅ **Comprobantes de Pago**: Validación con imágenes en Drive
- ✅ **Reorden Rápido**: Los clientes pueden repetir pedidos anteriores

## 📊 Estructura de Google Sheets

El bot requiere un Google Spreadsheet con las siguientes hojas:

1. **Catálogo**: Productos disponibles
2. **Pedidos**: Registro de todos los pedidos
3. **Clientes**: Base de datos de clientes
4. **Config**: Configuración del sistema

## 🌐 Endpoints

- `GET /` - Página de inicio
- `POST /webhook` - Webhook de Twilio para mensajes
- `GET /test` - Página de prueba
- `GET /admin` - Panel de administración básico
- `GET /health` - Estado del servidor

## 🛠️ Mantenimiento

### Logs en Heroku
```bash
heroku logs --tail
```

### Reiniciar App
```bash
heroku restart
```

### Ver Estado
```bash
heroku ps
```

## 📝 Notas Importantes

1. **bot-final.js** es el único archivo del bot necesario
2. Todas las versiones antiguas han sido eliminadas
3. El proyecto está optimizado para producción
4. Mantén las credenciales seguras en `.env`
5. No subas `.env` a Git

## 🤝 Soporte

Para problemas o preguntas:
1. Revisa los logs: `heroku logs --tail`
2. Verifica las variables de entorno
3. Confirma la conexión con Google Sheets
4. Asegúrate de que el webhook de Twilio esté configurado

## 📄 Licencia

MIT

---

**Versión**: 5.0.0  
**Última actualización**: Septiembre 2025  
**Estado**: ✅ Producción
