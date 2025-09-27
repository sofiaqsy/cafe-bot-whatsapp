# 🚀 Despliegue en Heroku - Bot WhatsApp

## ✅ Código listo para desplegar

Este repositorio está configurado y listo para desplegarse en Heroku. Sigue estos pasos:

## 📋 Pre-requisitos

1. Cuenta de Heroku verificada
2. Heroku CLI instalado
3. Credenciales de Twilio (Account SID y Auth Token)
4. Git configurado

## 🔧 Pasos para desplegar

### 1. Clonar el repositorio

```bash
git clone https://github.com/sofiaqsy/cafe-bot-whatsapp.git
cd cafe-bot-whatsapp
```

### 2. Crear app en Heroku

```bash
# Login en Heroku
heroku login

# Crear nueva app (cambia el nombre si está ocupado)
heroku create cafe-bot-whatsapp-prod

# O usa un nombre único
heroku create tu-nombre-unico-whatsapp
```

### 3. Configurar variables de entorno

```bash
# IMPORTANTE: Reemplaza con tus credenciales reales de Twilio

heroku config:set TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
heroku config:set TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
heroku config:set TWILIO_PHONE_NUMBER="whatsapp:+14155238886"
heroku config:set BUSINESS_NAME="Coffee Express"
heroku config:set BUSINESS_PHONE="+51987654321"
heroku config:set BUSINESS_EMAIL="ventas@coffeeexpress.com"
heroku config:set NODE_ENV="production"
```

### 4. Desplegar el código

```bash
# Conectar con Heroku
heroku git:remote -a cafe-bot-whatsapp-prod

# Push a Heroku
git push heroku main
```

### 5. Verificar el despliegue

```bash
# Ver logs
heroku logs --tail

# Abrir la app
heroku open

# Ver estado
heroku ps
```

## 📱 Configurar Webhook en Twilio

1. Ve a [Twilio Console](https://console.twilio.com)
2. Navega a: **Messaging → Try it out → Send a WhatsApp message**
3. En **Sandbox Settings**:
   - **When a message comes in**: 
     ```
     https://[tu-app-name].herokuapp.com/webhook
     ```
   - **Method**: POST
4. Guarda los cambios

## 🧪 Probar el bot

1. Envía el mensaje de unión al sandbox de Twilio (ej: "join copper-cloud")
2. Una vez unido, envía "Hola" al número de WhatsApp
3. El bot debería responder con el menú principal

## 📊 Panel de Administración

Una vez desplegado, accede al panel en:
```
https://[tu-app-name].herokuapp.com/admin
```

## 🔍 Comandos útiles

```bash
# Ver configuración
heroku config

# Ver logs en tiempo real
heroku logs --tail

# Reiniciar la app
heroku restart

# Escalar dynos
heroku ps:scale web=1

# Ver información de la app
heroku info
```

## ❌ Solución de problemas

### Error: "Application error"
```bash
heroku logs --tail
# Busca el error específico en los logs
```

### Bot no responde
1. Verifica que el webhook esté configurado correctamente en Twilio
2. Revisa las credenciales con `heroku config`
3. Asegúrate de que la app esté activa: `heroku ps`

### Error de puerto
El bot ya está configurado para usar `process.env.PORT`

## 💰 Costos

- **Heroku Eco**: $5/mes (incluye 1000 horas de dyno)
- **Heroku Basic**: $7/mes (dyno siempre activo)
- **Twilio**: Pago por mensaje (~$0.005 por mensaje)

## 🎉 ¡Listo!

Tu bot de WhatsApp debería estar funcionando. Características incluidas:

- ✅ Sistema de pedidos completo
- ✅ Catálogo de 5 productos
- ✅ Descuentos automáticos (10% para >50kg)
- ✅ Seguimiento de pedidos con ID único
- ✅ Panel de administración web
- ✅ Flujo conversacional intuitivo

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs: `heroku logs --tail`
2. Abre un issue en GitHub
3. Contacta: ventas@coffeeexpress.com
