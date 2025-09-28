/**
 * Configuration Module
 * Central configuration for the entire application
 */

module.exports = {
    // App configuration
    app: {
        name: process.env.APP_NAME || 'Café Bot',
        version: '5.0.0',
        port: process.env.PORT || 3000,
        isDevelopment: process.env.DEV_MODE === 'true',
        environment: process.env.NODE_ENV || 'development'
    },
    
    // Business configuration
    business: {
        name: process.env.BUSINESS_NAME || "Coffee Express",
        phone: process.env.BUSINESS_PHONE || "+51987654321",
        email: process.env.BUSINESS_EMAIL || "ventas@coffeeexpress.com",
        horario: "Lun-Sab 8:00-18:00",
        deliveryMin: 5,
        // Banking details
        banking: {
            bcpCuenta: "1917137473085",
            cciCuenta: "00219100713747308552"
        },
        // Forms
        forms: {
            comprobantes: process.env.GOOGLE_FORM_URL || "https://forms.gle/CONFIGURAR_AQUI"
        }
    },
    
    // Twilio configuration
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886',
        enabled: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
    },
    
    // Google Sheets configuration
    sheets: {
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
        serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
        enabled: !!(process.env.GOOGLE_SPREADSHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
    },
    
    // Google Drive configuration
    drive: {
        enabled: process.env.DRIVE_ENABLED === 'TRUE',
        folderId: process.env.GOOGLE_DRIVE_FOLDER_ID
    },
    
    // Notification settings
    notifications: {
        adminPhone: process.env.ADMIN_WHATSAPP || '+51987654321',
        enabled: process.env.NOTIFICATIONS_ENABLED !== 'false'
    },
    
    // Menu configuration
    menu: {
        welcomeDelay: 1000,
        typingDelay: 2000,
        maxRetries: 3
    },
    
    // Order settings
    orders: {
        minQuantity: 1,
        maxQuantity: 1000,
        defaultCurrency: 'S/',
        timeZone: 'America/Lima'
    }
};
