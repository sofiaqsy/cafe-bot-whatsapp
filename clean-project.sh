#!/bin/bash

# Script de limpieza de archivos innecesarios
# Ejecuta este script en el directorio cafe-bot-local

echo "==========================================="
echo "   LIMPIEZA DE PROYECTO CAFE BOT"
echo "==========================================="
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "bot-final.js" ]; then
    echo "❌ Error: No se encontró bot-final.js"
    echo "Por favor, ejecuta este script en el directorio cafe-bot-local"
    exit 1
fi

echo "📁 Limpiando archivos innecesarios..."
echo ""

# Crear directorio de respaldo por si acaso
mkdir -p .backup_deleted
echo "💾 Creando respaldo en .backup_deleted/"
echo ""

# Función para mover archivo a backup y luego eliminarlo
delete_file() {
    if [ -f "$1" ]; then
        cp "$1" .backup_deleted/ 2>/dev/null
        rm "$1"
        echo "  ✅ Eliminado: $1"
        return 0
    fi
    return 1
}

count=0

# Eliminar versiones antiguas del bot
echo "🗑️ Eliminando versiones antiguas del bot..."
delete_file "bot.js" && ((count++))
delete_file "bot-simple.js" && ((count++))
delete_file "bot-dev.js" && ((count++))
delete_file "bot-pro.js" && ((count++))
delete_file "bot-mejorado.js" && ((count++))
delete_file "bot-images.js" && ((count++))
delete_file "bot-con-catalogo-sheets.js" && ((count++))
delete_file "bot-con-pago-simple.js" && ((count++))
delete_file "bot-final-actualizado-corrupto.js" && ((count++))
delete_file "bot-final-actualizado-corrupto.bak" && ((count++))
delete_file "bot-final-backup.js" && ((count++))
delete_file "bot-final-part2.js" && ((count++))

# Eliminar archivos de debug
echo ""
echo "🗑️ Eliminando archivos de debug..."
delete_file "codigo-debug-temporal.js" && ((count++))
delete_file "debug-detallado.js" && ((count++))
delete_file "debug-pedidos.js" && ((count++))
delete_file "test-bot-mejorado.sh" && ((count++))
delete_file "test-drive-access.js" && ((count++))
delete_file "test-notificacion-directa.sh" && ((count++))
delete_file "test-notificaciones.js" && ((count++))
delete_file "test.html" && ((count++))

# Eliminar scripts de fix
echo ""
echo "🗑️ Eliminando scripts de reparación antiguos..."
delete_file "fix-columnas-urgente.sh" && ((count++))
delete_file "fix-google-drive.sh" && ((count++))
delete_file "fix-heroku-now.sh" && ((count++))
delete_file "fix-normalizacion-numeros.sh" && ((count++))
delete_file "fix-obtener-pedidos.js" && ((count++))
delete_file "fix-tiempo-final.js" && ((count++))
delete_file "fix-tiempo-nan.js" && ((count++))
delete_file "fix-usuario-whatsapp.sh" && ((count++))
delete_file "reparar-bot-actualizado.sh" && ((count++))
delete_file "reparar-bot.sh" && ((count++))
delete_file "fix-deploy.sh" && ((count++))

# Eliminar scripts de configuración antiguos
echo ""
echo "🗑️ Eliminando scripts de configuración obsoletos..."
delete_file "activar-catalogo.sh" && ((count++))
delete_file "actualizar-bot-heroku.sh" && ((count++))
delete_file "actualizar-bot.sh" && ((count++))
delete_file "arquitectura-sheets.sh" && ((count++))
delete_file "configurar-notificaciones.sh" && ((count++))
delete_file "configurar-sheets.sh" && ((count++))
delete_file "configurar-validacion-pagos.sh" && ((count++))
delete_file "copiar-y-modificar.sh" && ((count++))
delete_file "crear-nueva-carpeta-drive.sh" && ((count++))
delete_file "implementar-clientes.sh" && ((count++))
delete_file "implementar-columnas-fix.sh" && ((count++))
delete_file "implementar-confirmacion.sh" && ((count++))
delete_file "instalar-catalogo-sheets.sh" && ((count++))
delete_file "instrucciones-notificaciones.sh" && ((count++))
delete_file "update-bot-images.sh" && ((count++))
delete_file "diagnostico-pedidos.sh" && ((count++))

# Eliminar scripts de deploy redundantes
echo ""
echo "🗑️ Eliminando scripts de deploy redundantes..."
delete_file "deploy-final.sh" && ((count++))
delete_file "deploy-fix.sh" && ((count++))
delete_file "deploy-heroku-fix.sh" && ((count++))
delete_file "deploy-images.sh" && ((count++))
delete_file "deploy-sistema-completo.sh" && ((count++))
delete_file "deploy-validacion.sh" && ((count++))
delete_file "desplegar-heroku.sh" && ((count++))

# Eliminar archivos de integración antiguos
echo ""
echo "🗑️ Eliminando archivos de integración obsoletos..."
delete_file "flujo-confirmacion-datos.js" && ((count++))
delete_file "google-apps-script.js" && ((count++))
delete_file "google-forms-config.js" && ((count++))
delete_file "google-sheets-old.js" && ((count++))
delete_file "image-handler-local.js" && ((count++))
delete_file "image-handler.js" && ((count++))
delete_file "integracion-sheets-correcta.js" && ((count++))
delete_file "integracion-validacion.js" && ((count++))
delete_file "menu-con-pedidos-activos.js" && ((count++))
delete_file "payment-handler.js" && ((count++))
delete_file "sheets-lectura-datos-old.js" && ((count++))
delete_file "webhook-estado.js" && ((count++))

# Eliminar otros archivos
echo ""
echo "🗑️ Eliminando otros archivos innecesarios..."
delete_file "payment-section.txt" && ((count++))
delete_file "catalogo_manager.py" && ((count++))
delete_file ".DS_Store" && ((count++))

# Eliminar también los scripts auxiliares que ya no necesitamos
delete_file "heroku-config.sh" && ((count++))
delete_file "run.sh" && ((count++))
delete_file "start.sh" && ((count++))
delete_file "setup-local.sh" && ((count++))

echo ""
echo "==========================================="
echo "   ✅ LIMPIEZA COMPLETADA"
echo "==========================================="
echo ""
echo "📊 Resumen:"
echo "  • Archivos eliminados: $count"
echo "  • Respaldo creado en: .backup_deleted/"
echo ""
echo "📁 Archivos importantes mantenidos:"
echo "  ✅ bot-final.js (archivo principal)"
echo "  ✅ package.json y package-lock.json"
echo "  ✅ Procfile"
echo "  ✅ .env y .env.example"
echo "  ✅ .gitignore"
echo "  ✅ google-sheets.js"
echo "  ✅ google-drive-service.js"
echo "  ✅ sheets-funciones-corregidas.js"
echo "  ✅ sheets-lectura-datos.js"
echo "  ✅ notification-service.js"
echo "  ✅ Archivos README y documentación"
echo ""
echo "💡 Siguiente paso:"
echo "  git add -A"
echo "  git commit -m 'Limpieza: Eliminar archivos obsoletos y versiones antiguas'"
echo "  git push heroku main"
echo ""
echo "⚠️ Si necesitas recuperar algún archivo, están en .backup_deleted/"
echo ""
echo "✨ Proyecto limpio y optimizado!"
