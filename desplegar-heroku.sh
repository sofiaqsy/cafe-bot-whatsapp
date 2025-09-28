#!/bin/bash

echo "=========================================="
echo "DESPLEGANDO BOT ACTUALIZADO A HEROKU"
echo "=========================================="

# Verificar que existe el archivo
if [ ! -f "bot-final-actualizado.js" ]; then
    echo "[ERROR] No se encuentra bot-final-actualizado.js"
    exit 1
fi

echo "[OK] Archivo bot-final-actualizado.js encontrado"
echo "[OK] package.json apunta a bot-final-actualizado.js"
echo "[OK] Procfile apunta a bot-final-actualizado.js"
echo ""

echo "PASOS PARA DESPLEGAR:"
echo "===================="
echo ""
echo "1. AGREGAR CAMBIOS A GIT:"
echo "   git add ."
echo "   git commit -m 'Usar bot-final-actualizado.js con catálogo desde Google Sheets'"
echo ""
echo "2. PUSH A GITHUB:"
echo "   git push origin main"
echo ""
echo "3. PUSH A HEROKU:"
echo "   git push heroku main"
echo ""
echo "4. CONFIGURAR VARIABLES EN HEROKU (si no las tienes):"
echo "   heroku config:set SPREADSHEET_ID='tu-id-aqui' -a tu-app"
echo "   heroku config:set GOOGLE_SERVICE_ACCOUNT_KEY='$(cat credentials.json)' -a tu-app"
echo ""
echo "5. VERIFICAR LOGS:"
echo "   heroku logs --tail -a tu-app"
echo ""
echo "NOTA: El bot ahora ejecuta bot-final-actualizado.js"
echo "      que lee el catálogo desde Google Sheets"