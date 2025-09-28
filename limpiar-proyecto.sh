#!/bin/bash

echo "==========================================="
echo "   LIMPIEZA DE ARCHIVOS INNECESARIOS"
echo "   CAFE BOT - TELEGRAM/WHATSAPP"
echo "==========================================="

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "bot-final.js" ]; then
    echo -e "${RED}❌ Error: No se encontró bot-final.js${NC}"
    echo "Asegúrate de estar en el directorio cafe-bot-local"
    exit 1
fi

echo -e "${BLUE}📁 Directorio actual:${NC} $(pwd)"
echo ""

# Lista de archivos NECESARIOS que NO se deben eliminar
echo -e "${GREEN}📋 Archivos NECESARIOS (se mantendrán):${NC}"
echo "  ✅ bot-final.js (archivo principal)"
echo "  ✅ package.json y package-lock.json"
echo "  ✅ Procfile (configuración Heroku)"
echo "  ✅ .env y .env.example (variables de entorno)"
echo "  ✅ .gitignore (configuración git)"
echo "  ✅ google-sheets.js (integración Sheets)"
echo "  ✅ google-drive-service.js (servicio Drive)"
echo "  ✅ sheets-funciones-corregidas.js"
echo "  ✅ sheets-lectura-datos.js"
echo "  ✅ notification-service.js"
echo "  ✅ README.md (documentación principal)"
echo ""

# Lista de archivos a ELIMINAR
echo -e "${YELLOW}🗑️  Archivos a ELIMINAR:${NC}"
echo ""

# Archivos de versiones antiguas del bot
echo -e "${RED}Versiones antiguas del bot:${NC}"
files_old_bots=(
    "bot.js"
    "bot-simple.js"
    "bot-dev.js"
    "bot-pro.js"
    "bot-mejorado.js"
    "bot-images.js"
    "bot-con-catalogo-sheets.js"
    "bot-con-pago-simple.js"
    "bot-final-actualizado-corrupto.js"
    "bot-final-actualizado-corrupto.bak"
    "bot-final-backup.js"
    "bot-final-part2.js"
)

for file in "${files_old_bots[@]}"; do
    if [ -f "$file" ]; then
        echo "  • $file"
    fi
done

echo ""

# Archivos de debug y temporales
echo -e "${RED}Archivos de debug y temporales:${NC}"
files_debug=(
    "codigo-debug-temporal.js"
    "debug-detallado.js"
    "debug-pedidos.js"
    "test-bot-mejorado.sh"
    "test-drive-access.js"
    "test-notificacion-directa.sh"
    "test-notificaciones.js"
    "test.html"
)

for file in "${files_debug[@]}"; do
    if [ -f "$file" ]; then
        echo "  • $file"
    fi
done

echo ""

# Scripts de fix y reparación antiguos
echo -e "${RED}Scripts de reparación antiguos:${NC}"
files_fix=(
    "fix-columnas-urgente.sh"
    "fix-google-drive.sh"
    "fix-heroku-now.sh"
    "fix-normalizacion-numeros.sh"
    "fix-obtener-pedidos.js"
    "fix-tiempo-final.js"
    "fix-tiempo-nan.js"
    "fix-usuario-whatsapp.sh"
    "reparar-bot-actualizado.sh"
    "reparar-bot.sh"
)

for file in "${files_fix[@]}"; do
    if [ -f "$file" ]; then
        echo "  • $file"
    fi
done

echo ""

# Scripts de configuración antiguos
echo -e "${RED}Scripts de configuración antiguos:${NC}"
files_config=(
    "activar-catalogo.sh"
    "actualizar-bot-heroku.sh"
    "actualizar-bot.sh"
    "arquitectura-sheets.sh"
    "configurar-notificaciones.sh"
    "configurar-sheets.sh"
    "configurar-validacion-pagos.sh"
    "copiar-y-modificar.sh"
    "crear-nueva-carpeta-drive.sh"
    "implementar-clientes.sh"
    "implementar-columnas-fix.sh"
    "implementar-confirmacion.sh"
    "instalar-catalogo-sheets.sh"
    "instrucciones-notificaciones.sh"
    "update-bot-images.sh"
    "diagnostico-pedidos.sh"
)

for file in "${files_config[@]}"; do
    if [ -f "$file" ]; then
        echo "  • $file"
    fi
done

echo ""

# Scripts de deploy redundantes
echo -e "${RED}Scripts de deploy redundantes:${NC}"
files_deploy=(
    "deploy-final.sh"
    "deploy-fix.sh"
    "deploy-heroku-fix.sh"
    "deploy-images.sh"
    "deploy-sistema-completo.sh"
    "deploy-validacion.sh"
    "desplegar-heroku.sh"
)

for file in "${files_deploy[@]}"; do
    if [ -f "$file" ]; then
        echo "  • $file"
    fi
done

echo ""

# Archivos de integración antiguos
echo -e "${RED}Archivos de integración antiguos:${NC}"
files_integration=(
    "flujo-confirmacion-datos.js"
    "google-apps-script.js"
    "google-forms-config.js"
    "google-sheets-old.js"
    "image-handler-local.js"
    "image-handler.js"
    "integracion-sheets-correcta.js"
    "integracion-validacion.js"
    "menu-con-pedidos-activos.js"
    "payment-handler.js"
    "sheets-lectura-datos-old.js"
    "webhook-estado.js"
)

for file in "${files_integration[@]}"; do
    if [ -f "$file" ]; then
        echo "  • $file"
    fi
done

echo ""

# Otros archivos innecesarios
echo -e "${RED}Otros archivos:${NC}"
files_others=(
    "payment-section.txt"
    "catalogo_manager.py"
    ".DS_Store"
)

for file in "${files_others[@]}"; do
    if [ -f "$file" ]; then
        echo "  • $file"
    fi
done

echo ""
echo -e "${YELLOW}==========================================${NC}"
read -p "¿Deseas eliminar todos estos archivos? (s/n): " confirm

if [ "$confirm" != "s" ]; then
    echo -e "${YELLOW}Operación cancelada${NC}"
    exit 0
fi

# Eliminar archivos
echo ""
echo -e "${RED}🗑️  Eliminando archivos...${NC}"

# Combinar todas las listas
all_files=(
    "${files_old_bots[@]}"
    "${files_debug[@]}"
    "${files_fix[@]}"
    "${files_config[@]}"
    "${files_deploy[@]}"
    "${files_integration[@]}"
    "${files_others[@]}"
)

count=0
for file in "${all_files[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        echo -e "${GREEN}✓${NC} Eliminado: $file"
        count=$((count + 1))
    fi
done

echo ""
echo -e "${GREEN}==========================================="
echo -e "   ✅ LIMPIEZA COMPLETADA"
echo -e "==========================================="
echo -e "${GREEN}Se eliminaron $count archivos innecesarios${NC}"
echo ""

# Mostrar archivos restantes
echo -e "${BLUE}📁 Archivos restantes en el directorio:${NC}"
ls -la | grep -E "\.js$|\.json$|\.md$|\.sh$|Procfile|\.env" | awk '{print "  • " $9}'

echo ""
echo -e "${YELLOW}💡 Recomendaciones:${NC}"
echo "1. Haz un commit de estos cambios:"
echo "   git add -A"
echo "   git commit -m 'Limpieza: Eliminar archivos innecesarios y versiones antiguas'"
echo ""
echo "2. Si necesitas documentación adicional, manténla en la carpeta /docs"
echo ""
echo "3. El proyecto ahora está limpio y listo para producción"
echo ""
echo -e "${GREEN}✨ El proyecto está optimizado y listo!${NC}"
