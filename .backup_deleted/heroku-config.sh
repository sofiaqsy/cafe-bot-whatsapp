# Variables de entorno necesarias para Heroku
# ============================================
# Ejecutar estos comandos en la terminal para configurar Heroku

# 1. CONFIGURACIÓN DE GOOGLE SHEETS
heroku config:set SPREADSHEET_ID="tu-spreadsheet-id-aqui" -a tu-app-heroku
heroku config:set GOOGLE_CREDENTIALS_PATH="credentials.json" -a tu-app-heroku

# 2. CONFIGURACIÓN DE TWILIO (OPCIONAL PARA MODO DEMO)
heroku config:set TWILIO_ACCOUNT_SID="tu-account-sid" -a tu-app-heroku
heroku config:set TWILIO_AUTH_TOKEN="tu-auth-token" -a tu-app-heroku
heroku config:set TWILIO_PHONE_NUMBER="whatsapp:+14155238886" -a tu-app-heroku

# 3. CONFIGURACIÓN DEL NEGOCIO
heroku config:set BUSINESS_NAME="Coffee Express" -a tu-app-heroku
heroku config:set BUSINESS_PHONE="+51987654321" -a tu-app-heroku
heroku config:set BUSINESS_EMAIL="ventas@coffeeexpress.com" -a tu-app-heroku

# 4. CREDENCIALES DE GOOGLE (COMO JSON STRING)
# Nota: Debes convertir tu archivo credentials.json a una línea
# Usa este comando para convertir:
# cat credentials.json | jq -c . | pbcopy
# Luego pega el resultado en:
heroku config:set GOOGLE_CREDENTIALS='{"type":"service_account","project_id":"..."}' -a tu-app-heroku

# 5. VERIFICAR CONFIGURACIÓN
heroku config -a tu-app-heroku

# 6. REINICIAR LA APLICACIÓN
heroku restart -a tu-app-heroku

# 7. VER LOGS
heroku logs --tail -a tu-app-heroku
