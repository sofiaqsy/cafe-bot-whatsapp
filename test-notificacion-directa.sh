#!/bin/bash

echo "🧪 PRUEBA DIRECTA DE NOTIFICACIÓN"
echo "=================================="
echo ""
echo "Este script enviará una notificación de prueba directamente"
echo ""

# Ejecutar en Heroku
heroku run node -a cafe-bot-whatsapp << 'EOF'
const twilio = require('twilio');

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const numero = process.env.WHATSAPP_ADMIN_NUMBER || 'whatsapp:+51962763381';

console.log('Enviando a:', numero);

client.messages.create({
    body: '🧪 *PRUEBA DE NOTIFICACIÓN*\n\n✅ Si ves este mensaje, las notificaciones funcionan.\n\n🕐 ' + new Date().toLocaleTimeString('es-PE'),
    from: process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886',
    to: numero
})
.then(message => {
    console.log('✅ Mensaje enviado:', message.sid);
    console.log('Estado:', message.status);
    
    // Verificar estado después de 3 segundos
    setTimeout(() => {
        client.messages(message.sid).fetch()
            .then(msg => {
                console.log('\nESTADO FINAL:');
                console.log('Status:', msg.status);
                console.log('Error:', msg.errorMessage || 'Ninguno');
                if (msg.status === 'failed' || msg.status === 'undelivered') {
                    console.log('\n❌ SOLUCIÓN:');
                    console.log('1. Envía "join <código>" desde +51962763381 a +14155238886');
                    console.log('2. El código está en: https://console.twilio.com');
                }
            })
            .catch(console.error);
    }, 3000);
})
.catch(error => {
    console.error('❌ Error:', error.message);
    if (error.code === 21408) {
        console.log('\n⚠️ SOLUCIÓN REQUERIDA:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('El número NO está registrado en el sandbox.');
        console.log('');
        console.log('1. Desde WhatsApp (+51962763381), envía a +14155238886:');
        console.log('   "join <tu-código>"');
        console.log('');
        console.log('2. Obtén el código en:');
        console.log('   https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn');
    }
});
EOF

echo ""
echo "Si el mensaje no llega, el problema es el sandbox."
echo "La solución está arriba ☝️"
