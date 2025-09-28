#!/bin/bash

echo "==========================================="
echo "   DESPLIEGUE A HEROKU - CAFE BOT"
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

# Verificar archivos importantes
echo -e "${YELLOW}🔍 Verificando archivos necesarios...${NC}"
files_to_check=("bot-final.js" "package.json" "Procfile" ".gitignore")
missing_files=0

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file encontrado${NC}"
    else
        echo -e "${RED}❌ $file NO encontrado${NC}"
        missing_files=$((missing_files + 1))
    fi
done

if [ $missing_files -gt 0 ]; then
    echo -e "${RED}❌ Faltan archivos necesarios. Abortando.${NC}"
    exit 1
fi

echo ""

# Verificar que el Procfile apunta al archivo correcto
echo -e "${YELLOW}🔍 Verificando Procfile...${NC}"
if grep -q "bot-final.js" Procfile; then
    echo -e "${GREEN}✅ Procfile configurado correctamente${NC}"
    cat Procfile
else
    echo -e "${RED}❌ Procfile no está configurado correctamente${NC}"
    echo "Debe contener: web: node bot-final.js"
    exit 1
fi

echo ""

# Verificar si Heroku CLI está instalado
if ! command -v heroku &> /dev/null; then
    echo -e "${RED}❌ Heroku CLI no está instalado${NC}"
    echo "Instálalo desde: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

echo -e "${GREEN}✅ Heroku CLI detectado${NC}"
echo ""

# Verificar si hay una app de Heroku configurada
echo -e "${YELLOW}🔍 Verificando app de Heroku...${NC}"
heroku_app=$(heroku apps:info 2>/dev/null | grep "=== " | cut -d' ' -f2)

if [ -z "$heroku_app" ]; then
    echo -e "${YELLOW}⚠️ No hay una app de Heroku configurada en este repositorio${NC}"
    echo ""
    echo "¿Deseas crear una nueva app o conectarte a una existente?"
    echo "1) Crear nueva app"
    echo "2) Conectar a app existente"
    read -p "Selecciona (1 o 2): " option
    
    if [ "$option" = "1" ]; then
        read -p "Nombre de la nueva app (deja vacío para nombre automático): " app_name
        if [ -z "$app_name" ]; then
            heroku create
        else
            heroku create $app_name
        fi
    elif [ "$option" = "2" ]; then
        read -p "Nombre de la app existente: " app_name
        heroku git:remote -a $app_name
    else
        echo -e "${RED}Opción inválida${NC}"
        exit 1
    fi
    
    heroku_app=$(heroku apps:info 2>/dev/null | grep "=== " | cut -d' ' -f2)
fi

echo -e "${GREEN}✅ App de Heroku: $heroku_app${NC}"
echo ""

# Verificar variables de entorno necesarias
echo -e "${YELLOW}🔍 Verificando variables de entorno en Heroku...${NC}"
required_vars=("TWILIO_ACCOUNT_SID" "TWILIO_AUTH_TOKEN")
missing_vars=0

for var in "${required_vars[@]}"; do
    if heroku config:get $var &>/dev/null; then
        echo -e "${GREEN}✅ $var configurada${NC}"
    else
        echo -e "${RED}❌ $var NO configurada${NC}"
        missing_vars=$((missing_vars + 1))
    fi
done

if [ $missing_vars -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️ Faltan variables de entorno${NC}"
    echo "Configúralas con:"
    echo "heroku config:set TWILIO_ACCOUNT_SID=tu_sid"
    echo "heroku config:set TWILIO_AUTH_TOKEN=tu_token"
    echo ""
    read -p "¿Deseas continuar de todos modos? (s/n): " continue_deploy
    if [ "$continue_deploy" != "s" ]; then
        exit 1
    fi
fi

echo ""

# Inicializar git si no está inicializado
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}📦 Inicializando repositorio git...${NC}"
    git init
fi

# Agregar todos los archivos
echo -e "${YELLOW}📦 Preparando archivos para deploy...${NC}"
git add .

# Hacer commit
echo -e "${YELLOW}💾 Creando commit...${NC}"
commit_msg="Deploy bot-final.js - $(date '+%Y-%m-%d %H:%M')"
git commit -m "$commit_msg" || echo -e "${YELLOW}No hay cambios nuevos para commit${NC}"

echo ""

# Deploy a Heroku
echo -e "${BLUE}🚀 Iniciando deploy a Heroku...${NC}"
echo "App: $heroku_app"
echo ""

git push heroku main 2>/dev/null || git push heroku master

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}==========================================="
    echo -e "   ✅ DEPLOY EXITOSO!"
    echo -e "==========================================="
    echo ""
    echo -e "🔗 URL de tu app: ${BLUE}https://$heroku_app.herokuapp.com${NC}"
    echo ""
    echo -e "${YELLOW}📱 Configura el webhook en Twilio:${NC}"
    echo -e "   ${BLUE}https://$heroku_app.herokuapp.com/webhook${NC}"
    echo ""
    echo -e "${YELLOW}🧪 Prueba tu bot:${NC}"
    echo -e "   ${BLUE}https://$heroku_app.herokuapp.com/test${NC}"
    echo ""
    echo -e "${YELLOW}📊 Ver logs:${NC}"
    echo -e "   heroku logs --tail"
    echo ""
else
    echo ""
    echo -e "${RED}==========================================="
    echo -e "   ❌ ERROR EN EL DEPLOY"
    echo -e "==========================================="
    echo ""
    echo -e "${YELLOW}Intenta estos pasos:${NC}"
    echo "1. Verifica los logs: heroku logs --tail"
    echo "2. Reinicia la app: heroku restart"
    echo "3. Verifica el estado: heroku ps"
    echo ""
    echo -e "${YELLOW}Si el error persiste, revisa:${NC}"
    echo "- Que bot-final.js existe y no tiene errores"
    echo "- Que package.json está correcto"
    echo "- Que Procfile contiene: web: node bot-final.js"
    exit 1
fi
