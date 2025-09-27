#!/bin/bash

echo "🚀 Desplegando bot con soporte de imágenes a Heroku..."
echo ""

# Verificar archivos necesarios
echo "✅ Verificando archivos..."
required_files=("image-handler.js" "payment-handler.js" "bot-images.js")

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Error: No se encuentra $file"
        exit 1
    fi
done

echo "✅ Todos los archivos necesarios están presentes"
echo ""

# Opciones de deployment
echo "📋 OPCIONES DE DEPLOYMENT:"
echo "=========================="
echo ""
echo "1. PROBAR LOCALMENTE:"
echo "   node bot-images.js"
echo ""
echo "2. REEMPLAZAR bot-pro.js Y SUBIR A HEROKU:"
echo "   cp bot-images.js bot-pro.js"
echo "   git add ."
echo "   git commit -m 'Agregar soporte completo de imágenes para comprobantes'"
echo "   git push heroku main"
echo ""
echo "3. USAR COMO ARCHIVO PRINCIPAL EN package.json:"
echo "   Edita package.json y cambia:"
echo "   \"main\": \"bot-images.js\""
echo "   \"start\": \"node bot-images.js\""
echo ""
echo "   Luego:"
echo "   git add ."
echo "   git commit -m 'Actualizar a bot con soporte de imágenes'"
echo "   git push heroku main"
echo ""
echo "📌 IMPORTANTE:"
echo "   - El bot ahora puede recibir imágenes de WhatsApp"
echo "   - Los comprobantes se guardan en la carpeta 'uploads'"
echo "   - Panel admin mejorado en /admin"
echo "   - Ver comprobantes en /comprobantes"
echo ""
echo "✅ Script completado. Elige tu opción de deployment."
