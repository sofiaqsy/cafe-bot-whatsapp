#!/bin/bash

echo "🔧 Script para corregir acceso a Google Drive"
echo "============================================"
echo ""

# El ID correcto de tu carpeta PEDIDOSWTSP
FOLDER_ID_CORRECTO="1hb49MeGdfHkPfWXhqxj9Z463IpQFsYM5"

echo "📁 ID de carpeta detectado: $FOLDER_ID_CORRECTO"
echo ""

echo "📋 PASOS PARA SOLUCIONAR:"
echo ""
echo "1️⃣ VERIFICAR PERMISOS EN GOOGLE DRIVE:"
echo "   - La carpeta debe estar compartida con: cafe-bot@maximal-journey-459103-k4.iam.gserviceaccount.com"
echo "   - El permiso debe ser: Editor"
echo "   ✅ Según la imagen, esto ya está configurado correctamente"
echo ""

echo "2️⃣ ACTUALIZAR VARIABLE EN HEROKU:"
echo "   heroku config:set DRIVE_FOLDER_ID=$FOLDER_ID_CORRECTO -a cafe-bot-whatsapp"
echo ""

echo "3️⃣ VERIFICAR QUE DRIVE ESTÉ HABILITADO:"
echo "   heroku config:set DRIVE_ENABLED=TRUE -a cafe-bot-whatsapp"
echo ""

echo "4️⃣ REINICIAR LA APLICACIÓN:"
echo "   heroku restart -a cafe-bot-whatsapp"
echo ""

echo "5️⃣ VERIFICAR LOGS:"
echo "   heroku logs --tail -a cafe-bot-whatsapp"
echo ""

echo "📝 COMANDO RÁPIDO (copia y pega todo):"
echo "---------------------------------------"
cat << 'EOF'
heroku config:set DRIVE_FOLDER_ID=1hb49MeGdfHkPfWXhqxj9Z463IpQFsYM5 DRIVE_ENABLED=TRUE -a cafe-bot-whatsapp && heroku restart -a cafe-bot-whatsapp && heroku logs --tail -a cafe-bot-whatsapp
EOF
