const dotenv = require('dotenv');
dotenv.config();

console.log('🔍 DIAGNÓSTICO DE NOTIFICACIONES');
console.log('==================================\n');

// 1. Verificar variables de entorno
console.log('1️⃣ VARIABLES DE ENTORNO:');
console.log('-------------------------');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Configurado' : '❌ No configurado');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ Configurado' : '❌ No configurado');
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886');
console.log('WHATSAPP_ADMIN_NUMBER:', process.env.WHATSAPP_ADMIN_NUMBER || '❌ No configurado');
console.log('WHATSAPP_ADMIN_GROUP:', process.env.WHATSAPP_ADMIN_GROUP || '❌ No configurado');

// 2. Verificar formato del número
console.log('\n2️⃣ FORMATO DEL NÚMERO:');
console.log('----------------------');
const adminNumber = process.env.WHATSAPP_ADMIN_NUMBER;
if (adminNumber) {
    console.log('Número configurado:', adminNumber);
    console.log('¿Empieza con whatsapp:?', adminNumber.startsWith('whatsapp:') ? '✅ Sí' : '❌ No');
    console.log('¿Tiene formato correcto?', /^whatsapp:\+\d{10,15}$/.test(adminNumber) ? '✅ Sí' : '⚠️ Verificar');
}

// 3. Probar envío directo
async function probarEnvio() {
    console.log('\n3️⃣ PRUEBA DE ENVÍO:');
    console.log('-------------------');
    
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        console.log('❌ No se puede probar sin credenciales de Twilio');
        return;
    }
    
    try {
        const twilio = require('twilio');
        const client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
        
        // Mensaje de prueba
        const mensaje = `🧪 *MENSAJE DE PRUEBA*\n\n` +
                       `✅ Las notificaciones funcionan correctamente\n` +
                       `🕐 ${new Date().toLocaleTimeString('es-PE')}\n\n` +
                       `Si recibes este mensaje, el sistema está OK.`;
        
        const destinatario = process.env.WHATSAPP_ADMIN_NUMBER || 'whatsapp:+51962763381';
        
        console.log('Enviando a:', destinatario);
        console.log('Desde:', process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886');
        
        const response = await client.messages.create({
            body: mensaje,
            from: process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886',
            to: destinatario
        });
        
        console.log('✅ Mensaje enviado exitosamente!');
        console.log('ID del mensaje:', response.sid);
        console.log('Estado:', response.status);
        console.log('Fecha creación:', response.dateCreated);
        
        // Esperar un momento y verificar el estado
        setTimeout(async () => {
            try {
                const updatedMessage = await client.messages(response.sid).fetch();
                console.log('\n📊 ESTADO ACTUALIZADO:');
                console.log('Status:', updatedMessage.status);
                console.log('Error code:', updatedMessage.errorCode || 'Ninguno');
                console.log('Error message:', updatedMessage.errorMessage || 'Ninguno');
                
                if (updatedMessage.status === 'delivered') {
                    console.log('✅ Mensaje entregado correctamente!');
                } else if (updatedMessage.status === 'failed') {
                    console.log('❌ El mensaje falló');
                } else if (updatedMessage.status === 'undelivered') {
                    console.log('❌ No se pudo entregar el mensaje');
                } else {
                    console.log(`Estado: ${updatedMessage.status}`);
                }
            } catch (error) {
                console.log('Error verificando estado:', error.message);
            }
        }, 5000);
        
    } catch (error) {
        console.error('❌ Error enviando mensaje de prueba:');
        console.error('Código:', error.code);
        console.error('Mensaje:', error.message);
        
        if (error.code === 21408) {
            console.log('\n⚠️ SOLUCIÓN:');
            console.log('El número no está registrado en el sandbox de Twilio.');
            console.log('1. Ve a: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn');
            console.log('2. Envía el código de activación desde tu WhatsApp al +14155238886');
            console.log('3. El código es algo como: "join words-words"');
        } else if (error.code === 63003) {
            console.log('\n⚠️ SOLUCIÓN:');
            console.log('El formato del número es incorrecto.');
            console.log('Debe ser: whatsapp:+51999999999');
        }
    }
}

// 4. Verificar webhook
console.log('\n4️⃣ VERIFICACIÓN ADICIONAL:');
console.log('--------------------------');
console.log('URL de tu app:', `https://cafe-bot-whatsapp.herokuapp.com/webhook`);
console.log('Webhook configurado en Twilio:', '❓ Verificar en https://console.twilio.com');

// Ejecutar prueba
probarEnvio().then(() => {
    console.log('\n✅ Diagnóstico completado');
    console.log('\n💡 PASOS PARA SOLUCIONAR:');
    console.log('1. Asegúrate de que el número +51962763381 esté registrado en el sandbox');
    console.log('2. Envía "join <código>" desde ese número al +14155238886');
    console.log('3. Verifica que el formato sea: whatsapp:+51962763381');
    console.log('4. Revisa los logs de Twilio: https://console.twilio.com/us1/monitor/logs/messages');
}).catch(console.error);
