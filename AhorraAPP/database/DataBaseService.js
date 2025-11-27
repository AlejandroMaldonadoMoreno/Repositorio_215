import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";

class DatabaseService {
    constructor() {
        this.db = null;
        this.storageKey = 'usuarios';
        this.useFallback = false;
        this._metaCache = {};
        this._fallbackStore = {}; // in-memory fallback for small test data when AsyncStorage/localStorage missing
    }

    async initialize() {
        if (Platform.OS === 'web') {
            console.log("Usando LocalStorage para web");
            this.useFallback = true;
        } else {
            console.log("Usando SQLite para móvil");
            try {
                    // Try to open DB; retry a few times if a transient native error occurs
                    const maxAttempts = 3;
                    let lastErr = null;
                    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                        try {
                            this.db = await SQLite.openDatabaseAsync('AhorraApp.db');
                            lastErr = null;
                            break;
                        } catch (openErr) {
                            lastErr = openErr;
                            console.warn(`[DataBaseService] openDatabaseAsync attempt ${attempt} failed`, openErr);
                            // short backoff
                            await new Promise(res => setTimeout(res, 200 * attempt));
                        }
                    }
                    if (!this.db) {
                        // persist the error for logging and move to fallback
                        console.warn('[DataBaseService] openDatabaseAsync failed after retries, will use fallback', lastErr);
                        this.useFallback = true;
                    }
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
                // Crear tablas para transacciones y presupuestos (si no existen)
                try {
                    await this.db.execAsync(`
                        CREATE TABLE IF NOT EXISTS transacciones (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            user_id INTEGER NOT NULL,
                            tipo TEXT,
                            concepto TEXT,
                            monto REAL,
                            moneda TEXT DEFAULT 'COP',
                            fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                            metadata TEXT
                        );
                    `);
                    await this.db.execAsync(`
                        CREATE INDEX IF NOT EXISTS idx_trans_user_date ON transacciones (user_id, fecha DESC);
                    `);
                    await this.db.execAsync(`
                        CREATE INDEX IF NOT EXISTS idx_trans_user_tipo ON transacciones (user_id, tipo);
                    `);

                    await this.db.execAsync(`
                        CREATE TABLE IF NOT EXISTS presupuestos (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            user_id INTEGER NOT NULL,
                            nombre TEXT,
                            mes INTEGER,
                            anio INTEGER,
                            limite REAL,
                            gastado REAL DEFAULT 0,
                            metadata TEXT,
                            fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP
                        );
                    `);
                    await this.db.execAsync(`
                        CREATE UNIQUE INDEX IF NOT EXISTS ux_presupuesto_user_name_month ON presupuestos (user_id, nombre, mes, anio);
                    `);
                    await this.db.execAsync(`
                        CREATE INDEX IF NOT EXISTS idx_budget_user_month ON presupuestos (user_id, anio, mes);
                    `);
                    // mails / notifications table
                    await this.db.execAsync(`
                        CREATE TABLE IF NOT EXISTS mails (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            user_id INTEGER NOT NULL,
                            subject TEXT,
                            body TEXT,
                            is_read INTEGER DEFAULT 0,
                            fecha DATETIME DEFAULT CURRENT_TIMESTAMP
                        );
                    `);
                    await this.db.execAsync(`
                        CREATE INDEX IF NOT EXISTS idx_mails_user_date ON mails (user_id, fecha DESC);
                    `);
                } catch (e) {
                    // ignore additional table creation errors
                }
            } catch (e) {
                console.warn('[DataBaseService] SQLite initialize failed, switching to fallback storage', e);
                this.useFallback = true;
                this.db = null;
            }
        }
    }

    // Internal helper: attempt a native runAsync with a single retry and reopen DB if needed.
    async _safeRun(sql, params = []) {
        // If DB is not available, switch to fallback and return a safe result for inserts
        if (!this.db) {
            this.useFallback = true;
            return { insertId: Date.now(), lastInsertRowId: Date.now() };
        }

        try {
            return await this.db.runAsync(sql, params);
        } catch (e) {
            console.warn('[DataBaseService] _safeRun native error, attempting reopen/retry', e);
            try {
                // attempt to re-open DB once
                this.db = await SQLite.openDatabaseAsync('AhorraApp.db');
                return await this.db.runAsync(sql, params);
            } catch (e2) {
                console.warn('[DataBaseService] _safeRun retry failed, switching to fallback', e2);
                this.useFallback = true;
                // Return synthetic insert-like result so callers can continue using fallback storage
                return { insertId: Date.now(), lastInsertRowId: Date.now() };
            }
        }
    }

    // Internal helper: attempt a native getAllAsync with a single retry and reopen DB if needed.
    async _safeGetAll(sql, params = []) {
        if (!this.db) {
            this.useFallback = true;
            return [];
        }

        try {
            return await this.db.getAllAsync(sql, params);
        } catch (e) {
            console.warn('[DataBaseService] _safeGetAll native error, attempting reopen/retry', e);
            try {
                this.db = await SQLite.openDatabaseAsync('AhorraApp.db');
                return await this.db.getAllAsync(sql, params);
            } catch (e2) {
                console.warn('[DataBaseService] _safeGetAll retry failed, switching to fallback', e2);
                this.useFallback = true;
                return [];
            }
        }
    }
    async getAll() {
        if (Platform.OS === 'web') {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        }
        // if fallback mode or DB not ready, use AsyncStorage/local fallback
        if (this.useFallback || !this.db) {
            try {
                const items = await this._readFallbackJSON(this.storageKey);
                return Array.isArray(items) ? items : [];
            } catch (e) {
                console.warn('[DataBaseService] getAll fallback read error', e);
                return [];
            }
        }
        try {
            return await this._safeGetAll('SELECT * FROM usuarios ORDER BY id DESC;');
        } catch (e) {
            console.warn('[DataBaseService] getAll native error, switching to fallback', e);
            this.useFallback = true;
            return await this.getAll();
        }
    }
    // Helper for fallback storage: read JSON array by key (AsyncStorage or localStorage)
    async _readFallbackJSON(key) {
        try {
            if (Platform.OS === 'web') {
                const raw = localStorage.getItem(key) || '[]';
                return JSON.parse(raw);
            }
            const mod = await import('@react-native-async-storage/async-storage').catch(() => null);
            const AsyncStorage = mod ? (mod.default || mod) : null;
            if (!AsyncStorage) return [];
            const raw = await AsyncStorage.getItem(key) || '[]';
            return JSON.parse(raw);
        } catch (e) {
            console.warn('_readFallbackJSON error', e);
            return [];
        }
    }

    async _writeFallbackJSON(key, arr) {
        try {
            const raw = JSON.stringify(arr || []);
            if (Platform.OS === 'web') {
                localStorage.setItem(key, raw);
                return true;
            }
            const mod = await import('@react-native-async-storage/async-storage').catch(() => null);
            const AsyncStorage = mod ? (mod.default || mod) : null;
            if (!AsyncStorage) {
                // persist to in-memory fallback store so operations within the same process work
                try {
                    this._fallbackStore[key] = arr || [];
                    return true;
                } catch (e2) {
                    return false;
                }
            }
            await AsyncStorage.setItem(key, raw);
            return true;
        } catch (e) {
            console.warn('_writeFallbackJSON error', e);
            return false;
        }
    }

    // Transactions API
    async addTransaction(userId, tx) {
        const t = {
            tipo: tx.tipo || null,
            concepto: tx.concepto || tx.title || null,
            monto: tx.monto != null ? Number(tx.monto) : 0,
            moneda: tx.moneda || 'COP',
            fecha: tx.fecha || new Date().toISOString(),
            metadata: tx.metadata ? JSON.stringify(tx.metadata) : null,
        };
        const key = `tx:user:${userId}`;
        if (Platform.OS === 'web' || this.useFallback) {
            const items = await this._readFallbackJSON(key);
            const nuevo = { id: `f-${Date.now()}`, user_id: userId, ...t };
            items.unshift(nuevo);
            await this._writeFallbackJSON(key, items);
            return nuevo;
        }
        try {
            const sql = `INSERT INTO transacciones (user_id, tipo, concepto, monto, moneda, fecha, metadata) VALUES (?, ?, ?, ?, ?, ?, ?);`;
            const params = [userId, t.tipo, t.concepto, t.monto, t.moneda, t.fecha, t.metadata];
            const res = await this._safeRun(sql, params);
            const id = (res && (res.lastInsertRowId || res.insertId)) || Date.now();
            return { id, user_id: userId, ...t };
        } catch (e) {
            console.warn('addTransaction native error, switching to fallback', e);
            this.useFallback = true;
            return await this.addTransaction(userId, tx);
        }
    }

    async getTransactions(userId, opts = {}) {
        const { limit = 100, offset = 0, desde, hasta, tipo } = opts;
        const key = `tx:user:${userId}`;
        if (Platform.OS === 'web' || this.useFallback) {
            let items = await this._readFallbackJSON(key);
            // filter by tipo
            if (tipo) items = items.filter(i => (i.tipo || '').toLowerCase() === (tipo || '').toLowerCase());
            // filter by date range if fecha stored
            if (desde || hasta) {
                const desdeT = desde ? new Date(desde) : null;
                const hastaT = hasta ? new Date(hasta) : null;
                items = items.filter(i => {
                    const f = new Date(i.fecha || 0);
                    if (desdeT && f < desdeT) return false;
                    if (hastaT && f > hastaT) return false;
                    return true;
                });
            }
            return items.slice(offset, offset + limit);
        }
        try {
            let sql = 'SELECT * FROM transacciones WHERE user_id = ?';
            const params = [userId];
            if (tipo) { sql += ' AND tipo = ?'; params.push(tipo); }
            if (desde) { sql += ' AND fecha >= ?'; params.push(desde); }
            if (hasta) { sql += ' AND fecha <= ?'; params.push(hasta); }
            sql += ' ORDER BY fecha DESC LIMIT ? OFFSET ?;'; params.push(limit, offset);
            const rows = await this._safeGetAll(sql, params);
            return rows;
        } catch (e) {
            console.warn('getTransactions native error, switching to fallback', e);
            this.useFallback = true;
            return await this.getTransactions(userId, opts);
        }
    }

    async updateTransaction(id, updates) {
        if (!id) throw new Error('id requerido');
        const keys = Object.keys(updates || {});
        if (keys.length === 0) return null;
        if (Platform.OS === 'web' || this.useFallback) {
            // naive fallback: find in user's keys by scanning all tx keys
            try {
                // Try to find the user-specific key by pattern; for simplicity, scan all known users in usuarios
                const users = await this.getAll();
                for (const u of users) {
                    const key = `tx:user:${u.id}`;
                    const items = await this._readFallbackJSON(key);
                    const idx = items.findIndex(x => x.id === id || x.id === Number(id));
                    if (idx !== -1) {
                        items[idx] = { ...items[idx], ...updates };
                        await this._writeFallbackJSON(key, items);
                        return items[idx];
                    }
                }
            } catch (e) { console.warn('updateTransaction fallback error', e); }
            return null;
        }
        try {
            const setClause = keys.map(k => `${k} = ?`).join(', ');
            const params = keys.map(k => updates[k]);
            params.push(id);
            const sql = `UPDATE transacciones SET ${setClause} WHERE id = ?;`;
            await this._safeRun(sql, params);
            const rows = await this._safeGetAll('SELECT * FROM transacciones WHERE id = ? LIMIT 1;', [id]);
            return (Array.isArray(rows) && rows.length) ? rows[0] : null;
        } catch (e) {
            console.warn('updateTransaction native error, switching to fallback', e);
            this.useFallback = true;
            return await this.updateTransaction(id, updates);
        }
    }

    async deleteTransaction(id) {
        if (!id) throw new Error('id requerido');
        if (Platform.OS === 'web' || this.useFallback) {
            try {
                const users = await this.getAll();
                for (const u of users) {
                    const key = `tx:user:${u.id}`;
                    const items = await this._readFallbackJSON(key);
                    const idx = items.findIndex(x => x.id === id || x.id === Number(id));
                    if (idx !== -1) {
                        items.splice(idx, 1);
                        await this._writeFallbackJSON(key, items);
                        return true;
                    }
                }
            } catch (e) { console.warn('deleteTransaction fallback error', e); }
            return false;
        }
        try {
            await this._safeRun('DELETE FROM transacciones WHERE id = ?;', [id]);
            return true;
        } catch (e) {
            console.warn('deleteTransaction native error, switching to fallback', e);
            this.useFallback = true;
            return await this.deleteTransaction(id);
        }
    }

    // Budgets API
    async addBudget(userId, b) {
        const bud = {
            nombre: b.nombre || b.concept || null,
            mes: b.mes || new Date().getMonth() + 1,
            anio: b.anio || new Date().getFullYear(),
            limite: b.limite != null ? Number(b.limite) : 0,
            gastado: b.gastado != null ? Number(b.gastado) : 0,
            metadata: b.metadata ? JSON.stringify(b.metadata) : null,
            fechaCreacion: b.fechaCreacion || new Date().toISOString(),
        };
        const key = `bud:user:${userId}`;
        if (Platform.OS === 'web' || this.useFallback) {
            const items = await this._readFallbackJSON(key);
            const nuevo = { id: `f-${Date.now()}`, user_id: userId, ...bud };
            items.unshift(nuevo);
            await this._writeFallbackJSON(key, items);
            return nuevo;
        }
        try {
            const sql = `INSERT INTO presupuestos (user_id, nombre, mes, anio, limite, gastado, metadata, fechaCreacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`;
            const params = [userId, bud.nombre, bud.mes, bud.anio, bud.limite, bud.gastado, bud.metadata, bud.fechaCreacion];
            const res = await this._safeRun(sql, params);
            const id = (res && (res.lastInsertRowId || res.insertId)) || Date.now();
            return { id, user_id: userId, ...bud };
        } catch (e) {
            console.warn('addBudget native error, switching to fallback', e);
            this.useFallback = true;
            return await this.addBudget(userId, b);
        }
    }

    async getBudgets(userId, opts = {}) {
        const { mes, anio } = opts;
        const key = `bud:user:${userId}`;
        if (Platform.OS === 'web' || this.useFallback) {
            let items = await this._readFallbackJSON(key);
            if (mes) items = items.filter(i => Number(i.mes) === Number(mes));
            if (anio) items = items.filter(i => Number(i.anio) === Number(anio));
            return items;
        }
        try {
            let sql = 'SELECT * FROM presupuestos WHERE user_id = ?';
            const params = [userId];
            if (mes) { sql += ' AND mes = ?'; params.push(mes); }
            if (anio) { sql += ' AND anio = ?'; params.push(anio); }
            sql += ' ORDER BY fechaCreacion DESC;';
            const rows = await this._safeGetAll(sql, params);
            return rows;
        } catch (e) {
            console.warn('getBudgets native error, switching to fallback', e);
            this.useFallback = true;
            return await this.getBudgets(userId, opts);
        }
    }

    // Mails / notifications API
    async addMail(userId, mail) {
        const m = {
            subject: mail.subject || '',
            body: mail.body || '',
            is_read: mail.is_read ? 1 : 0,
            fecha: mail.fecha || new Date().toISOString(),
        };
        const key = `mail:user:${userId}`;
        if (Platform.OS === 'web' || this.useFallback) {
            const items = await this._readFallbackJSON(key);
            const nuevo = { id: `f-${Date.now()}`, user_id: userId, ...m };
            items.unshift(nuevo);
            await this._writeFallbackJSON(key, items);
            return nuevo;
        }
        try {
            const sql = `INSERT INTO mails (user_id, subject, body, is_read, fecha) VALUES (?, ?, ?, ?, ?);`;
            const params = [userId, m.subject, m.body, m.is_read, m.fecha];
            const res = await this._safeRun(sql, params);
            const id = (res && (res.lastInsertRowId || res.insertId)) || Date.now();
            return { id, user_id: userId, ...m };
        } catch (e) {
            console.warn('addMail native error, switching to fallback', e);
            this.useFallback = true;
            return await this.addMail(userId, mail);
        }
    }

    async getMails(userId, opts = {}) {
        const { limit = 100, offset = 0, onlyUnread = false } = opts;
        const key = `mail:user:${userId}`;
        if (Platform.OS === 'web' || this.useFallback) {
            let items = await this._readFallbackJSON(key);
            if (onlyUnread) items = items.filter(i => !i.is_read);
            return items.slice(offset, offset + limit);
        }
        try {
            let sql = 'SELECT * FROM mails WHERE user_id = ?';
            const params = [userId];
            if (onlyUnread) { sql += ' AND is_read = 0'; }
            sql += ' ORDER BY fecha DESC LIMIT ? OFFSET ?;'; params.push(limit, offset);
            const rows = await this._safeGetAll(sql, params);
            return rows;
        } catch (e) {
            console.warn('getMails native error, switching to fallback', e);
            this.useFallback = true;
            return await this.getMails(userId, opts);
        }
    }

    async updateBudget(id, updates) {
        if (!id) throw new Error('id requerido');
        const keys = Object.keys(updates || {});
        if (keys.length === 0) return null;
        if (Platform.OS === 'web' || this.useFallback) {
            try {
                const users = await this.getAll();
                for (const u of users) {
                    const key = `bud:user:${u.id}`;
                    const items = await this._readFallbackJSON(key);
                    const idx = items.findIndex(x => x.id === id || x.id === Number(id));
                    if (idx !== -1) {
                        items[idx] = { ...items[idx], ...updates };
                        await this._writeFallbackJSON(key, items);
                        return items[idx];
                    }
                }
            } catch (e) { console.warn('updateBudget fallback error', e); }
            return null;
        }
        try {
            const setClause = keys.map(k => `${k} = ?`).join(', ');
            const params = keys.map(k => updates[k]);
            params.push(id);
            const sql = `UPDATE presupuestos SET ${setClause} WHERE id = ?;`;
            await this._safeRun(sql, params);
            const rows = await this._safeGetAll('SELECT * FROM presupuestos WHERE id = ? LIMIT 1;', [id]);
            return (Array.isArray(rows) && rows.length) ? rows[0] : null;
        } catch (e) {
            console.warn('updateBudget native error, switching to fallback', e);
            this.useFallback = true;
            return await this.updateBudget(id, updates);
        }
    }

    async deleteBudget(id) {
        if (!id) throw new Error('id requerido');
        if (Platform.OS === 'web' || this.useFallback) {
            try {
                const users = await this.getAll();
                for (const u of users) {
                    const key = `bud:user:${u.id}`;
                    const items = await this._readFallbackJSON(key);
                    const idx = items.findIndex(x => x.id === id || x.id === Number(id));
                    if (idx !== -1) {
                        items.splice(idx, 1);
                        await this._writeFallbackJSON(key, items);
                        return true;
                    }
                }
            } catch (e) { console.warn('deleteBudget fallback error', e); }
            return false;
        }
        try {
            await this._safeRun('DELETE FROM presupuestos WHERE id = ?;', [id]);
            return true;
        } catch (e) {
            console.warn('deleteBudget native error, switching to fallback', e);
            this.useFallback = true;
            return await this.deleteBudget(id);
        }
    }
    async add(userObj) {
        const u = userObj || {};
        if (Platform.OS === 'web' || this.useFallback) {
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
            await this._writeFallbackJSON(this.storageKey, usuarios);
            return nuevoUsuario;

        }
        // on native mobile when not in fallback, try SQLite but guard against errors
        if (this.useFallback || !this.db) {
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
            await this._writeFallbackJSON(this.storageKey, usuarios);
            return nuevoUsuario;
        }
        else {
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

            const result = await this._safeRun(sql, params);
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

        if (Platform.OS === 'web' || this.useFallback) {
            const usuarios = await this.getAll();
            const idx = usuarios.findIndex(u => u.id === id);
            if (idx === -1) throw new Error('Usuario no encontrado');
            usuarios[idx] = { ...usuarios[idx], ...updates };
            await this._writeFallbackJSON(this.storageKey, usuarios);
            return usuarios[idx];
        } else {
            // Construir SET dinámico y parámetros
            const setClause = keys.map(k => `${k} = ?`).join(', ');
            const params = keys.map(k => updates[k]);
            params.push(id);
            const sql = `UPDATE usuarios SET ${setClause} WHERE id = ?;`;
            await this._safeRun(sql, params);
            // Intentar devolver el objeto actualizado; si no es posible, devolver un objeto aproximado
            try {
                const rows = await this._safeGetAll('SELECT * FROM usuarios WHERE id = ? LIMIT 1;', [id]);
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
            const rows = await this._safeGetAll('SELECT * FROM usuarios WHERE id = ? LIMIT 1;', [id]);
            if (Array.isArray(rows) && rows.length) return rows[0];
            return null;
        } catch (e) {
            return null;
        }
    }

    // Metodos de key/value lightweight en SQLite
    async setMeta(key, value) {
        if (Platform.OS === 'web' || this.useFallback || !this.db) {
            try {
                // prefer AsyncStorage on native fallback
                const mod = await import('@react-native-async-storage/async-storage').catch(() => null);
                const AsyncStorage = mod ? (mod.default || mod) : null;
                if (AsyncStorage) {
                    const raw = await AsyncStorage.getItem('__meta__') || '{}';
                    const obj = JSON.parse(raw || '{}');
                    if (value === null) delete obj[key]; else obj[key] = value;
                    await AsyncStorage.setItem('__meta__', JSON.stringify(obj));
                    return true;
                }
                // Fallback to in-memory cache when no AsyncStorage/localStorage available
                if (value === null) delete this._metaCache[key]; else this._metaCache[key] = value;
                return true;
            } catch (e) {
                console.warn('setMeta fallback error', e);
                return false;
            }
        }
        try {
            // upsert via INSERT OR REPLACE
            await this._safeRun('INSERT OR REPLACE INTO meta (k, v) VALUES (?, ?);', [key, value]);
            return true;
        } catch (e) {
            console.warn('setMeta error', e);
            this.useFallback = true;
            return await this.setMeta(key, value);
        }
    }

    async getMeta(key) {
        if (Platform.OS === 'web' || this.useFallback || !this.db) {
            try {
                const mod = await import('@react-native-async-storage/async-storage').catch(() => null);
                const AsyncStorage = mod ? (mod.default || mod) : null;
                if (AsyncStorage) {
                    const raw = await AsyncStorage.getItem('__meta__') || '{}';
                    const obj = JSON.parse(raw || '{}');
                    return obj[key] || null;
                }
                // Fallback to in-memory cache
                return this._metaCache[key] || null;
            } catch (e) {
                console.warn('getMeta fallback error', e);
                return null;
            }
        }
        try {
            const rows = await this._safeGetAll('SELECT v FROM meta WHERE k = ? LIMIT 1;', [key]);
            if (Array.isArray(rows) && rows.length) return rows[0].v;
            return null;
        } catch (e) {
            console.warn('getMeta error', e);
            this.useFallback = true;
            return await this.getMeta(key);
        }
    }

    // Elimina un usuario por id
    async delete(id) {
        if (id === undefined || id === null) {
            throw new Error('ID requerido para eliminar usuario');
        }
        if (Platform.OS === 'web' || this.useFallback || !this.db) {
            const usuarios = await this.getAll();
            const idx = usuarios.findIndex(u => u.id === id);
            if (idx === -1) throw new Error('Usuario no encontrado');
            usuarios.splice(idx, 1);
            await this._writeFallbackJSON(this.storageKey, usuarios);
            return true;
        }
        try {
            await this._safeRun('DELETE FROM usuarios WHERE id = ?;', [id]);
            return true;
        } catch (e) {
            console.warn('delete native error, switching to fallback', e);
            this.useFallback = true;
            return await this.delete(id);
        }
    }
}

export default new DatabaseService();