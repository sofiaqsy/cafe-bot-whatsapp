# ☕ Cafe Bot WhatsApp

Bot de WhatsApp para gestión de pedidos de café usando Twilio. Sistema completo de recepción, seguimiento y administración de pedidos con integración a Google Sheets y panel web.

## 🚀 Características Principales

### 📱 Sistema de Pedidos
- **Interfaz Conversacional**: Flujo natural de conversación para pedidos
- **Catálogo Dinámico**: 5 tipos de café disponibles con precios actualizables
- **Descuentos Automáticos**: 10% para pedidos mayores a 50kg
- **Confirmación Instantánea**: ID único de pedido y resumen detallado

### 📊 Panel de Administración
- **Dashboard Web**: Vista en tiempo real de pedidos
- **Estadísticas**: Ventas del día, kilos vendidos, métricas
- **Gestión de Estados**: Actualización de estado de pedidos
- **Exportación de Datos**: CSV y Excel

### 🔄 Integraciones
- **Google Sheets**: Sincronización automática de pedidos
- **PostgreSQL**: Base de datos para respaldo local
- **API REST**: Endpoints para integración con otros sistemas
- **Bot de Telegram**: Compartir datos entre plataformas

## 🛠️ Instalación

### Pre-requisitos
- Node.js 16+
- Cuenta de Twilio con WhatsApp Sandbox configurado
- Heroku CLI (para despliegue)
- Google Cloud Platform (opcional, para Google Sheets)

### Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/sofiaqsy/cafe-bot-whatsapp.git
cd cafe-bot-whatsapp

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar en modo desarrollo
npm run dev
```

## 📦 Despliegue en Heroku

### Opción 1: Despliegue Básico

```bash
# Crear app en Heroku
heroku create tu-cafe-bot-whatsapp

# Agregar PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Configurar variables de entorno
heroku config:set TWILIO_ACCOUNT_SID="tu_sid"
heroku config:set TWILIO_AUTH_TOKEN="tu_token"
heroku config:set TWILIO_PHONE_NUMBER="whatsapp:+14155238886"
heroku config:set BUSINESS_NAME="Coffee Express"

# Desplegar
git push heroku main
```

### Opción 2: Con Google Drive

```bash
# Usar versión con Google Drive
mv Procfile.google Procfile

# Configurar Google Sheets
heroku config:set GOOGLE_SPREADSHEET_ID="tu_spreadsheet_id"
heroku config:set GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# Desplegar
git push heroku main
```

## 🔧 Configuración

### 1. Configurar Twilio

1. Crear cuenta en [Twilio](https://www.twilio.com)
2. Activar WhatsApp Sandbox
3. Obtener Account SID y Auth Token
4. Configurar webhook: `https://tu-app.herokuapp.com/webhook`

### 2. Configurar Google Drive (Opcional)

Ver guía completa en [GOOGLE-DRIVE-SETUP.md](GOOGLE-DRIVE-SETUP.md)

## 📋 Uso del Bot

### Flujo de Conversación

1. **Cliente saluda**: "Hola"
2. **Bot muestra menú**: Opciones disponibles
3. **Cliente selecciona**: "Quiero hacer un pedido"
4. **Bot solicita datos**: Cafetería, producto, cantidad, dirección
5. **Confirmación**: Resumen y ID de pedido
6. **Seguimiento**: Actualizaciones de estado

## 📊 Panel de Administración

Acceder en: `https://tu-app.herokuapp.com/admin`

## 📁 Estructura del Proyecto

```
cafe-bot-whatsapp/
├── bot-seguimiento.js          # Bot principal
├── bot-google-drive-heroku.js  # Versión con Google Drive
├── package.json                # Dependencias
├── Procfile                    # Configuración Heroku
├── admin.html                  # Panel de administración
├── integrations/               # Módulos de integración
│   ├── google-drive-integration.js
│   └── excel-integration.js
├── data/                       # Archivos de datos locales
└── docs/                       # Documentación adicional
```

## 📝 Licencia

MIT - Ver [LICENSE](LICENSE) para más detalles

## 📞 Soporte

- Issues: [GitHub Issues](https://github.com/sofiaqsy/cafe-bot-whatsapp/issues)
- Email: ventas@coffeeexpress.com

---

⭐ Si este proyecto te es útil, considera darle una estrella en GitHub
