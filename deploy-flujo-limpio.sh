#!/bin/bash

# ========================================
# DEPLOY - FLUJO MEJORADO SIN EMOJIS Y SIN RUC
# ========================================

echo "Desplegando flujo mejorado sin emojis..."
echo ""

# Git add y commit
git add cafe-gratis-handler.js
git commit -m "refactor: Simplificar flujo de muestras - 6 pasos sin RUC ni emojis

- Eliminar paso de RUC (de 7 a 6 pasos)
- Quitar todos los emojis del flujo
- Remover referencias a gratuito
- Mensajes más profesionales y limpios
- Mantener solo información esencial"

# Push a Heroku
echo "Enviando a Heroku..."
git push heroku main

echo ""
echo "Esperando 20 segundos..."
sleep 20

echo ""
echo "=========================================="
echo "DESPLIEGUE COMPLETADO"
echo "=========================================="
echo ""
echo "FLUJO ACTUALIZADO (6 PASOS):"
echo "1. Nombre de cafetería"
echo "2. Dirección"
echo "3. Distrito"
echo "4. Foto de fachada"
echo "5. Nombre de contacto"
echo "6. Horario de entrega"
echo ""
echo "Sin RUC, sin emojis, sin referencias gratuitas"
echo ""
echo "LINK:"
echo "https://wa.me/14155238886?text=SOLICITO%20MUESTRA"
echo ""
echo "Prueba el flujo actualizado!"
echo ""
