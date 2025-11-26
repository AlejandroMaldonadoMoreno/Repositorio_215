import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";

class DatabaseService {
    constructor() {
        this.db = null;
        this.storageKey = 'usuarios';
    }

    async initialize() {
        if (Platform.OS === 'web') {
            console.log("Usando LocalStorage para web");
        } else {
            console.log("Usando SQLite para móvil");
            this.db = await SQLite.openDatabaseAsync('AhorraApp.db');
            await this.db.execAsync(`
                CREATE TABLE IF NOT EXISTS usuarios (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        nombre TEXT NOT NULL,
                        apellidos TEXT,
                        telefono TEXT,
                        correo TEXT UNIQUE,
                        passwordHash TEXT,
                        cuenta TEXT,
                        fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
            `);
                // tabla de metadatos para cosas como usuario actual
                try {
                    await this.db.execAsync(`
                        CREATE TABLE IF NOT EXISTS meta (
                            k TEXT PRIMARY KEY,
                            v TEXT
                        );
                    `);
                } catch (e) {
                    // ignore meta table creation errors
                }
        }
    }
    async getAll() {
        if (Platform.OS === 'web') {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } else {
            return await this.db.getAllAsync('SELECT * FROM usuarios ORDER BY id DESC;');
        }
    }
    async add(userObj) {
        const u = userObj || {};
        if (Platform.OS === 'web') {
            const usuarios = await this.getAll();

            const nuevoUsuario = {
                id: Date.now(),
                nombre: u.nombre || null,
                apellidos: u.apellidos || null,
                telefono: u.telefono || null,
                correo: u.correo || null,
                passwordHash: u.passwordHash || u.password || null,
                cuenta: u.cuenta || null,
                fechaCreacion: new Date().toISOString(),
            };

            usuarios.unshift(nuevoUsuario);
            localStorage.setItem(this.storageKey, JSON.stringify(usuarios));
            return nuevoUsuario;

        } else {
            // Insertar con todos los campos disponibles
            const sql = `INSERT INTO usuarios (nombre, apellidos, telefono, correo, passwordHash, cuenta, fechaCreacion) VALUES (?, ?, ?, ?, ?, ?, ?);`;
            const params = [
                u.nombre || null,
                u.apellidos || null,
                u.telefono || null,
                u.correo || null,
                u.passwordHash || u.password || null,
                u.cuenta || null,
                u.fechaCreacion || new Date().toISOString(),
            ];

            const result = await this.db.runAsync(sql, params);
            const id = (result && (result.lastInsertRowId || result.insertId)) || Date.now();
            return {
                id,
                nombre: u.nombre || null,
                apellidos: u.apellidos || null,
                telefono: u.telefono || null,
                correo: u.correo || null,
                passwordHash: u.passwordHash || u.password || null,
                cuenta: u.cuenta || null,
                fechaCreacion: u.fechaCreacion || new Date().toISOString(),
            };
        }
    }

    // Actualiza campos de un usuario por id. `updates` es un objeto con columnas a actualizar.
    async update(id, updates) {
        if (!id) throw new Error('id requerido');
        const keys = Object.keys(updates || {});
        if (keys.length === 0) return await this.getById(id);

        if (Platform.OS === 'web') {
            const usuarios = await this.getAll();
            const idx = usuarios.findIndex(u => u.id === id);
            if (idx === -1) throw new Error('Usuario no encontrado');
            usuarios[idx] = { ...usuarios[idx], ...updates };
            localStorage.setItem(this.storageKey, JSON.stringify(usuarios));
            return usuarios[idx];
        } else {
            // Construir SET dinámico y parámetros
            const setClause = keys.map(k => `${k} = ?`).join(', ');
            const params = keys.map(k => updates[k]);
            params.push(id);
            const sql = `UPDATE usuarios SET ${setClause} WHERE id = ?;`;
            await this.db.runAsync(sql, params);
            // Intentar devolver el objeto actualizado; si no es posible, devolver un objeto aproximado
            try {
                const rows = await this.db.getAllAsync('SELECT * FROM usuarios WHERE id = ? LIMIT 1;', [id]);
                if (Array.isArray(rows) && rows.length) return rows[0];
            } catch (e) {
                // ignore
            }
            return { id, ...updates, fechaCreacion: new Date().toISOString() };
        }
    }

    // Obtener por id (conveniencia)
    async getById(id) {
        if (!id) return null;
        if (Platform.OS === 'web') {
            const usuarios = await this.getAll();
            return usuarios.find(u => u.id === id) || null;
        }
        try {
            const rows = await this.db.getAllAsync('SELECT * FROM usuarios WHERE id = ? LIMIT 1;', [id]);
            if (Array.isArray(rows) && rows.length) return rows[0];
            return null;
        } catch (e) {
            return null;
        }
    }

    // Metodos de key/value lightweight en SQLite
    async setMeta(key, value) {
        if (Platform.OS === 'web') {
            const raw = localStorage.getItem('__meta__') || '{}';
            const obj = JSON.parse(raw);
            obj[key] = value;
            localStorage.setItem('__meta__', JSON.stringify(obj));
            return true;
        }
        try {
            // upsert via INSERT OR REPLACE
            await this.db.runAsync('INSERT OR REPLACE INTO meta (k, v) VALUES (?, ?);', [key, value]);
            return true;
        } catch (e) {
            console.warn('setMeta error', e);
            return false;
        }
    }

    async getMeta(key) {
        if (Platform.OS === 'web') {
            const raw = localStorage.getItem('__meta__') || '{}';
            const obj = JSON.parse(raw);
            return obj[key] || null;
        }
        try {
            const rows = await this.db.getAllAsync('SELECT v FROM meta WHERE k = ? LIMIT 1;', [key]);
            if (Array.isArray(rows) && rows.length) return rows[0].v;
            return null;
        } catch (e) {
            console.warn('getMeta error', e);
            return null;
        }
    }

    // Elimina un usuario por id
    async delete(id) {
        if (id === undefined || id === null) {
            throw new Error('ID requerido para eliminar usuario');
        }
        if (Platform.OS === 'web') {
            const usuarios = await this.getAll();
            const idx = usuarios.findIndex(u => u.id === id);
            if (idx === -1) throw new Error('Usuario no encontrado');
            usuarios.splice(idx, 1);
            localStorage.setItem(this.storageKey, JSON.stringify(usuarios));
            return true;
        } else {
            if (!this.db) throw new Error('Base de datos no inicializada');
            await this.db.runAsync('DELETE FROM usuarios WHERE id = ?;', [id]);
            return true;
        }
    }
}

export default new DatabaseService();