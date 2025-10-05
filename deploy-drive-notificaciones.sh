#!/bin/bash

# ========================================
# DEPLOY - GOOGLE DRIVE + NOTIFICACIONES
# ========================================

echo "🚀 Desplegando integración con Google Drive y Notificaciones..."
echo ""

# Git add y commit
git add .
git commit -m "feat(muestras): Integrar Google Drive y notificaciones para validación

Funcionalidades agregadas:
- Subir foto de cafetería a Google Drive (mismo folder de comprobantes)
- Nombre de archivo: muestra_CLI-XXXXX_nombre_cafeteria.jpg
- Notificación a administradores cuando llega solicitud
- Mensaje enfocado en VALIDACIÓN REQUERIDA
- Link directo a la foto en Drive en la notificación

Flujo mejorado:
1. Usuario completa registro de 6 pasos
2. Foto se sube automáticamente a Drive
3. Datos se guardan en Google Sheets
4. Notificación se envía a admins con link de foto
5. Admin puede validar directamente desde la notificación

Variables de entorno usadas:
- DRIVE_FOLDER_ID: Para subir fotos
- WHATSAPP_ADMIN_GROUP: Para notificar al grupo
- WHATSAPP_ADMIN_NUMBER: Para notificar al admin
- GOOGLE_SERVICE_ACCOUNT_KEY: Autenticación
- GOOGLE_SPREADSHEET_ID: Base de datos"

# Push a Heroku
echo "📤 Enviando a Heroku..."
git push heroku main

echo ""
echo "⏳ Esperando 30 segundos para que se reinicie..."
sleep 30

echo ""
echo "=========================================="
echo "✅ SISTEMA COMPLETO DESPLEGADO"
echo "=========================================="
echo ""
echo "INTEGRACIÓN CON GOOGLE DRIVE:"
echo "✅ Fotos se suben al folder: ${DRIVE_FOLDER_ID}"
echo "✅ Formato: muestra_CLI-XXXXX_cafeteria.jpg"
echo "✅ Link de Drive incluido en notificación"
echo ""
echo "NOTIFICACIONES AUTOMÁTICAS:"
echo "✅ Se envían a grupos/números configurados"
echo "✅ Incluyen todos los datos del registro"
echo "✅ Link directo a la foto en Drive"
echo "✅ Instrucciones de validación"
echo ""
echo "MENSAJE DE NOTIFICACIÓN:"
echo "-----------------------------------"
echo "⚠️ NUEVA SOLICITUD DE MUESTRA"
echo ""
echo "VALIDACIÓN REQUERIDA"
echo ""
echo "Cafetería: [nombre]"
echo "Contacto: [nombre]"
echo "Teléfono: [número]"
echo "Distrito: [distrito]"
echo "Foto: Subida a Drive"
echo ""
echo "ACCIONES REQUERIDAS:"
echo "1. Verificar foto de fachada"
echo "2. Validar datos del negocio"
echo "3. Confirmar distrito"
echo "4. Aprobar o rechazar"
echo ""
echo "Ver foto: [link de Drive]"
echo "-----------------------------------"
echo ""
echo "Para probar:"
echo "1. Envía SOLICITO MUESTRA"
echo "2. Completa los 6 pasos"
echo "3. Revisa que llegue la notificación"
echo "4. Verifica que la foto esté en Drive"
echo ""
