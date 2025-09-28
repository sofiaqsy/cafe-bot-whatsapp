/**
 * Data Persistence Module
 * Guarda y recupera datos de pedidos en un archivo JSON
 */

const fs = require('fs').promises;
const path = require('path');

class DataPersistence {
    constructor() {
        this.dataFile = path.join(__dirname, 'data', 'orders.json');
        this.backupFile = path.join(__dirname, 'data', 'orders.backup.json');
        this.ensureDataDirectory();
    }

    /**
     * Asegurar que el directorio de datos existe
     */
    async ensureDataDirectory() {
        const dataDir = path.join(__dirname, 'data');
        try {
            await fs.access(dataDir);
        } catch {
            await fs.mkdir(dataDir, { recursive: true });
            console.log('📁 Directorio de datos creado');
        }
    }

    /**
     * Guardar pedidos en archivo
     */
    async saveOrders(ordersMap) {
        try {
            // Convertir Map a objeto
            const ordersObject = {};
            ordersMap.forEach((value, key) => {
                ordersObject[key] = value;
            });

            const data = JSON.stringify(ordersObject, null, 2);
            
            // Hacer backup del archivo existente
            try {
                await fs.copyFile(this.dataFile, this.backupFile);
            } catch {
                // No hay archivo para hacer backup
            }

            // Guardar nuevo archivo
            await fs.writeFile(this.dataFile, data);
            console.log(`💾 ${ordersMap.size} pedidos guardados en disco`);
            return true;
        } catch (error) {
            console.error('❌ Error guardando pedidos:', error);
            return false;
        }
    }

    /**
     * Cargar pedidos desde archivo
     */
    async loadOrders() {
        try {
            const data = await fs.readFile(this.dataFile, 'utf8');
            const ordersObject = JSON.parse(data);
            
            // Convertir objeto a Map
            const ordersMap = new Map();
            Object.entries(ordersObject).forEach(([key, value]) => {
                // Restaurar fechas
                if (value.timestamp) value.timestamp = new Date(value.timestamp);
                if (value.fecha) value.fecha = new Date(value.fecha);
                ordersMap.set(key, value);
            });

            console.log(`📂 ${ordersMap.size} pedidos cargados desde disco`);
            return ordersMap;
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('📄 No hay archivo de pedidos previos');
            } else {
                console.error('❌ Error cargando pedidos:', error);
            }
            return new Map();
        }
    }

    /**
     * Guardar clientes en archivo
     */
    async saveCustomers(customersMap) {
        try {
            const customersObject = {};
            customersMap.forEach((value, key) => {
                customersObject[key] = value;
            });

            const data = JSON.stringify(customersObject, null, 2);
            const customerFile = path.join(__dirname, 'data', 'customers.json');
            
            await fs.writeFile(customerFile, data);
            console.log(`💾 ${customersMap.size} clientes guardados en disco`);
            return true;
        } catch (error) {
            console.error('❌ Error guardando clientes:', error);
            return false;
        }
    }

    /**
     * Cargar clientes desde archivo
     */
    async loadCustomers() {
        try {
            const customerFile = path.join(__dirname, 'data', 'customers.json');
            const data = await fs.readFile(customerFile, 'utf8');
            const customersObject = JSON.parse(data);
            
            const customersMap = new Map();
            Object.entries(customersObject).forEach(([key, value]) => {
                if (value.lastUpdated) value.lastUpdated = new Date(value.lastUpdated);
                if (value.fechaRegistro) value.fechaRegistro = new Date(value.fechaRegistro);
                customersMap.set(key, value);
            });

            console.log(`📂 ${customersMap.size} clientes cargados desde disco`);
            return customersMap;
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('📄 No hay archivo de clientes previos');
            } else {
                console.error('❌ Error cargando clientes:', error);
            }
            return new Map();
        }
    }
}

// Export singleton instance
module.exports = new DataPersistence();
