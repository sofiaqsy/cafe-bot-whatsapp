#!/bin/bash

echo "=========================================="
echo "ACTUALIZANDO BOT PARA HEROKU"
echo "=========================================="

# Hacer backup del bot-final.js actual
echo "[INFO] Creando backup de bot-final.js..."
cp bot-final.js bot-final-backup-$(date +%Y%m%d-%H%M%S).js

# Copiar el nuevo bot actualizado
echo "[INFO] Actualizando bot-final.js con catálogo de Google Sheets..."
cp bot-final-actualizado.js bot-final.js

echo "[OK] Bot actualizado correctamente"
echo ""
echo "CAMBIOS APLICADOS:"
echo "=================="
echo "1. Catálogo lee desde hoja CatalogoWhatsApp"
echo "2. Eliminados todos los emoticonos"  
echo "3. Interfaz profesional"
echo "4. Mantiene todas las funcionalidades existentes"
echo ""
echo "PARA DESPLEGAR EN HEROKU:"
echo "=========================="
echo "git add bot-final.js"
echo "git commit -m 'Actualizar catálogo desde Google Sheets y eliminar emoticonos'"
echo "git push heroku main"
echo ""
echo "CONFIGURACIÓN EN HEROKU:"
echo "========================"
echo "Asegúrate de tener configuradas estas variables:"
echo "- SPREADSHEET_ID (ID de tu Google Sheet)"
echo "- GOOGLE_CREDENTIALS_PATH o credenciales JSON"
echo ""