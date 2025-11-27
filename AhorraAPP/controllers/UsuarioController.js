import { Usuario } from '../models/usuario';
import DatabaseService from '../database/DataBaseService';

export class UsuarioController {
    constructor() {
        this.listeners = [];
    }

    //Inicializar el controlador con el Service
    async initialize() {
        await DatabaseService.initialize();
    }

    async obtenerUsuarios() {
        try {
            const data = await DatabaseService.getAll();
            return data.map(
                u => new Usuario(
                    u.id,
                    u.nombre,
                    u.apellidos,
                    u.telefono,
                    u.correo,
                    u.passwordHash,
                    u.cuenta,
                    u.fechaCreacion
                ));
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            throw new Error('No se pudieron cargar los usuarios');
        }
    }

    async crearUsuario(userObj) {
        try {
            //1. Validar datos mínimos
            Usuario.validar(userObj.nombre);

            // Generar número de cuenta si no viene en el objeto
            if (!userObj.cuenta) {
                userObj.cuenta = Usuario.generarNumeroCuenta();
            }

            // 1.b Validar unicidad de campos (correo, telefono, cuenta)
            try {
                const usuarios = await DatabaseService.getAll();
                if (userObj.correo) {
                    const exists = usuarios.find(u => (u.correo || '').toLowerCase() === (userObj.correo || '').toLowerCase());
                    if (exists) {
                        const err = new Error('Validation error: correo en uso');
                        err.userMessage = 'El correo proporcionado ya está en uso';
                        throw err;
                    }
                }
                if (userObj.telefono) {
                    const existsTel = usuarios.find(u => (u.telefono || '') === (userObj.telefono || ''));
                    if (existsTel) {
                        const err = new Error('Validation error: telefono en uso');
                        err.userMessage = 'El número de teléfono ya está en uso';
                        throw err;
                    }
                }
                if (userObj.cuenta) {
                    const existsCuenta = usuarios.find(u => (u.cuenta || '') === (userObj.cuenta || ''));
                    if (existsCuenta) {
                        const err = new Error('Validation error: cuenta en uso');
                        err.userMessage = 'El número de cuenta ya está en uso';
                        throw err;
                    }
                }
            } catch (uniqErr) {
                // si uniqErr es nuestro Error, propagarlo; si es otro error al leer usuarios, continuar y dejar que DB maneje duplicados
                if (uniqErr && uniqErr.message && /ya está en uso/.test(uniqErr.message)) throw uniqErr;
                // otherwise log and continue
                console.warn('[UsuarioController] crearUsuario: unicidad no pudo validarse', uniqErr);
            }
            //2. Insertar en BD
            console.log('[UsuarioController] crearUsuario: creando usuario con correo=', userObj && userObj.correo);
            const nuevoUsuario = await DatabaseService.add(userObj);
            console.log('[UsuarioController] crearUsuario: usuario creado id=', nuevoUsuario && nuevoUsuario.id);

            //3. Notificar a los observadores
            this.notifyListeners();
            // 3.b Añadir mail de bienvenida al buzón del usuario
            try {
                if (DatabaseService && typeof DatabaseService.addMail === 'function') {
                    const subject = 'Bienvenido a AhorraAPP';
                    const body = `Hola ${nuevoUsuario.nombre || ''},\n\nBienvenido a AhorraAPP. Tu cuenta ha sido creada correctamente. Tu número de cuenta es: ${nuevoUsuario.cuenta || ''}.\n\nGracias por confiar en nosotros.`;
                    await DatabaseService.addMail(nuevoUsuario.id, { subject, body, is_read: 0 });
                    console.log('[UsuarioController] crearUsuario: mail de bienvenida añadido para user=', nuevoUsuario.id);
                }
            } catch (e) {
                console.warn('[UsuarioController] crearUsuario: error añadiendo mail de bienvenida', e);
            }
            // 3.c Añadir transacción inicial para pruebas (saldo inicial de 1000)
            try {
                if (DatabaseService && typeof DatabaseService.addTransaction === 'function') {
                    await DatabaseService.addTransaction(nuevoUsuario.id, { tipo: 'initial', concepto: 'Saldo inicial', monto: 1000, fecha: new Date().toISOString(), metadata: { reason: 'saldo_inicial' } });
                    // notificar al usuario que recibió el saldo inicial
                    const subjInit = 'Saldo inicial acreditado';
                    const bodyInit = `Se han acreditado $1000 en tu cuenta (${nuevoUsuario.cuenta || ''}) como saldo inicial para pruebas.`;
                    await DatabaseService.addMail(nuevoUsuario.id, { subject: subjInit, body: bodyInit, is_read: 0 });
                    console.log('[UsuarioController] crearUsuario: saldo inicial y mail añadidos para user=', nuevoUsuario.id);
                }
            } catch (e) {
                console.warn('[UsuarioController] crearUsuario: error añadiendo transacción inicial', e);
            }
            // Do NOT persist the created user as the active session automatically.
            // The user must explicitly log in to become the active user.
            this.currentUser = null;

            //4. Retornar usuario creado
            return new Usuario(
                nuevoUsuario.id,
                nuevoUsuario.nombre,
                nuevoUsuario.apellidos,
                nuevoUsuario.telefono,
                nuevoUsuario.correo,
                nuevoUsuario.passwordHash,
                nuevoUsuario.cuenta,
                nuevoUsuario.fechaCreacion
            );
        } catch (error) {
            // If this is a validation error intended for the user, don't print stacktrace to console
            if (error && error.userMessage) {
                // rethrow so UI can show friendly message
                throw error;
            }
            console.error('Error al crear usuario:', error);
            throw error;
        }
    }

    // Autenticar usuario (simple: comparar correo + password tal cual)
    async authenticate(correo, password) {
        const res = await this.checkCredentials(correo, password);
        if (res.status !== 'ok') return null;
        return res.user;
    }

    // Verifica credenciales y devuelve estado explícito:
    // { status: 'not_found' | 'wrong_password' | 'ok', user? }
    async checkCredentials(correo, password) {
        if (!correo) return { status: 'not_found' };
        try {
            const usuarios = await DatabaseService.getAll();
            const found = usuarios.find(u => (u.correo || '').toLowerCase() === (correo || '').toLowerCase());
            if (!found) return { status: 'not_found' };
            const stored = found.passwordHash || found.password || '';
            if (stored === password) {
                const user = new Usuario(
                    found.id,
                    found.nombre,
                    found.apellidos,
                    found.telefono,
                    found.correo,
                    found.passwordHash || found.password,
                    found.cuenta,
                    found.fechaCreacion
                );
                // persistir correo del usuario logueado para otras pantallas (both AsyncStorage and DB meta)
                console.log('[UsuarioController] checkCredentials: autenticado=', found.correo);
                try {
                    const mod = await import('@react-native-async-storage/async-storage').catch(() => null);
                    const AsyncStorage = mod ? (mod.default || mod) : null;
                    if (AsyncStorage && found.correo) {
                        await AsyncStorage.setItem('currentUserCorreo', found.correo);
                        console.log('[UsuarioController] checkCredentials: AsyncStorage.setItem currentUserCorreo=', found.correo);
                    }
                } catch (e) {
                    console.warn('[UsuarioController] checkCredentials: AsyncStorage set error', e);
                }
                try {
                    if (DatabaseService && DatabaseService.setMeta && found.correo) {
                        await DatabaseService.setMeta('currentUserCorreo', found.correo);
                        console.log('[UsuarioController] checkCredentials: DB meta set currentUserCorreo=', found.correo);
                    }
                } catch (e) {
                    console.warn('[UsuarioController] checkCredentials: DB meta set error', e);
                }
                this.currentUser = found;
                return { status: 'ok', user };
            }
            return { status: 'wrong_password' };
        } catch (e) {
            console.error('Error checking credentials:', e);
            throw e;
        }
    }
    

    // Devuelve el usuario actualmente logueado (si hay alguno).
    // Intenta primero this.currentUser en memoria, si no intenta leer AsyncStorage
    async getCurrentUser() {
        // Always prefer persistent stores (DB meta, AsyncStorage) so different controller
        // instances remain consistent. Fall back to in-memory this.currentUser only
        // if no persisted identifier is present.
        try {
            // 1) Try DB meta first (canonical on mobile)
            try {
                if (DatabaseService && DatabaseService.getMeta) {
                    const metaCorreo = await DatabaseService.getMeta('currentUserCorreo');
                    console.log('[UsuarioController] getCurrentUser: metaCorreo=', metaCorreo);
                    if (metaCorreo) {
                        const usuarios = await DatabaseService.getAll();
                        const foundMeta = usuarios.find(u => (u.correo || '').toLowerCase() === (metaCorreo || '').toLowerCase());
                        if (foundMeta) {
                            console.log('[UsuarioController] getCurrentUser: found user by meta correo=', foundMeta.correo);
                            this.currentUser = foundMeta;
                            return new Usuario(
                                foundMeta.id,
                                foundMeta.nombre,
                                foundMeta.apellidos,
                                foundMeta.telefono,
                                foundMeta.correo,
                                foundMeta.passwordHash || foundMeta.password,
                                foundMeta.cuenta,
                                foundMeta.fechaCreacion
                            );
                        } else {
                            console.log('[UsuarioController] getCurrentUser: no user matches metaCorreo');
                        }
                    }
                }
            } catch (e) {
                console.warn('[UsuarioController] getCurrentUser: DB meta read error', e);
            }

            // 2) Fallback to AsyncStorage
            const mod = await import('@react-native-async-storage/async-storage').catch(() => null);
            const AsyncStorage = mod ? (mod.default || mod) : null;
            if (AsyncStorage) {
                const correo = await AsyncStorage.getItem('currentUserCorreo');
                console.log('[UsuarioController] getCurrentUser: AsyncStorage correo=', correo);
                if (correo) {
                    const usuarios = await DatabaseService.getAll();
                    const found = usuarios.find(u => (u.correo || '').toLowerCase() === (correo || '').toLowerCase());
                    if (found) {
                        console.log('[UsuarioController] getCurrentUser: found user by AsyncStorage correo=', found.correo);
                        this.currentUser = found;
                        return new Usuario(
                            found.id,
                            found.nombre,
                            found.apellidos,
                            found.telefono,
                            found.correo,
                            found.passwordHash || found.password,
                            found.cuenta,
                            found.fechaCreacion
                        );
                    }
                }
            }

            // 3) Try to auto-detect a likely user when no persisted meta is available.
            try {
                const usuarios = await DatabaseService.getAll().catch(() => []);
                // If only one user exists, assume it's the active one and persist it
                if (Array.isArray(usuarios) && usuarios.length === 1) {
                    const only = usuarios[0];
                    console.log('[UsuarioController] getCurrentUser: single user fallback ->', only && only.correo);
                    this.currentUser = only;
                    // persist recovered correo to AsyncStorage / DB meta if possible
                    try {
                        const mod = await import('@react-native-async-storage/async-storage').catch(() => null);
                        const AsyncStorage = mod ? (mod.default || mod) : null;
                        if (AsyncStorage && only && only.correo) {
                            await AsyncStorage.setItem('currentUserCorreo', only.correo);
                            console.log('[UsuarioController] getCurrentUser: persisted currentUserCorreo to AsyncStorage=', only.correo);
                        }
                    } catch (e) { /* ignore */ }
                    try { if (DatabaseService && DatabaseService.setMeta && only && only.correo) await DatabaseService.setMeta('currentUserCorreo', only.correo); } catch (e) { /* ignore */ }
                    return new Usuario(only.id, only.nombre, only.apellidos, only.telefono, only.correo, only.passwordHash || only.password, only.cuenta, only.fechaCreacion);
                }

                // If there are several users, attempt to find the one with recent activity (transactions or mails)
                if (Array.isArray(usuarios) && usuarios.length > 1) {
                    for (const u of usuarios) {
                        try {
                            const txs = await DatabaseService.getTransactions(u.id, { limit: 1 }).catch(() => []);
                            if (Array.isArray(txs) && txs.length > 0) {
                                console.log('[UsuarioController] getCurrentUser: recovered user by recent transactions ->', u.correo);
                                this.currentUser = u;
                                try { if (DatabaseService && DatabaseService.setMeta && u && u.correo) await DatabaseService.setMeta('currentUserCorreo', u.correo); } catch (e) {}
                                try {
                                    const mod = await import('@react-native-async-storage/async-storage').catch(() => null);
                                    const AsyncStorage = mod ? (mod.default || mod) : null;
                                    if (AsyncStorage && u && u.correo) await AsyncStorage.setItem('currentUserCorreo', u.correo);
                                } catch (e) {}
                                return new Usuario(u.id, u.nombre, u.apellidos, u.telefono, u.correo, u.passwordHash || u.password, u.cuenta, u.fechaCreacion);
                            }
                        } catch (e) { /* ignore per-user errors */ }
                    }
                    // if not found by txs, try mails
                    for (const u of usuarios) {
                        try {
                            const mails = await DatabaseService.getMails(u.id, { limit: 1 }).catch(() => []);
                            if (Array.isArray(mails) && mails.length > 0) {
                                console.log('[UsuarioController] getCurrentUser: recovered user by mails ->', u.correo);
                                this.currentUser = u;
                                try { if (DatabaseService && DatabaseService.setMeta && u && u.correo) await DatabaseService.setMeta('currentUserCorreo', u.correo); } catch (e) {}
                                try {
                                    const mod = await import('@react-native-async-storage/async-storage').catch(() => null);
                                    const AsyncStorage = mod ? (mod.default || mod) : null;
                                    if (AsyncStorage && u && u.correo) await AsyncStorage.setItem('currentUserCorreo', u.correo);
                                } catch (e) {}
                                return new Usuario(u.id, u.nombre, u.apellidos, u.telefono, u.correo, u.passwordHash || u.password, u.cuenta, u.fechaCreacion);
                            }
                        } catch (e) { /* ignore */ }
                    }
                }

            } catch (e) {
                console.warn('[UsuarioController] getCurrentUser: auto-detect fallback failed', e);
            }

            // 4) Finally, if nothing persisted, return in-memory currentUser (if any) and attempt to re-persist it so future loads succeed
            if (this.currentUser) {
                const f = this.currentUser;
                console.log('[UsuarioController] getCurrentUser: returning in-memory user=', f && f.correo, 'and attempting to persist it');
                try {
                    const mod = await import('@react-native-async-storage/async-storage').catch(() => null);
                    const AsyncStorage = mod ? (mod.default || mod) : null;
                    if (AsyncStorage && f && f.correo) await AsyncStorage.setItem('currentUserCorreo', f.correo);
                } catch (e) { console.warn('[UsuarioController] getCurrentUser: AsyncStorage re-persist failed', e); }
                try { if (DatabaseService && DatabaseService.setMeta && f && f.correo) await DatabaseService.setMeta('currentUserCorreo', f.correo); } catch (e) { console.warn('[UsuarioController] getCurrentUser: DB meta re-persist failed', e); }
                return new Usuario(
                    f.id,
                    f.nombre,
                    f.apellidos,
                    f.telefono,
                    f.correo,
                    f.passwordHash || f.password,
                    f.cuenta,
                    f.fechaCreacion
                );
            }

            return null;
        } catch (e) {
            console.warn('getCurrentUser error', e);
            return null;
        }
    }
    // Actualiza un usuario existente

    async actualizarUsuario(id, updates) {
        try {
            if (!id) throw new Error('id requerido');
            // Si viene nombre, validarlo
            if (updates && updates.nombre) Usuario.validar(updates.nombre);

            // Preparar payload: si password fue enviado como 'password', mapear a passwordHash
            const payload = { ...updates };
            if (payload.password) {
                payload.passwordHash = payload.password;
                delete payload.password;
            }

            // Actualizar en BD
            const actualizado = await DatabaseService.update(id, payload);

            // Notificar a los observadores
            this.notifyListeners();

            return new Usuario(
                actualizado.id,
                actualizado.nombre,
                actualizado.apellidos,
                actualizado.telefono,
                actualizado.correo,
                actualizado.passwordHash || actualizado.password,
                actualizado.cuenta,
                actualizado.fechaCreacion
            );
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            throw error;
        }
    }

    async eliminarUsuario(id) {
        try {
            if (id === undefined || id === null) {
                throw new Error('ID inválido para eliminación');
            }
            // Eliminar en BD
            await DatabaseService.delete(id);

            // Notificar a los observadores
            this.notifyListeners();

            return true;
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            throw error;
        }
    }

    //Sistema de observadores para actualizar la vista automáticamente
    addListener(callback) {
        this.listeners.push(callback);
    }
    removeListener(callback) {
        this.listeners = this.listeners.filter( l => l !== callback);
    }
    notifyListeners() {
        this.listeners.forEach( callback => callback());
    }

    // Cerrar sesión: limpiar user en memoria, AsyncStorage y DB meta
    async logout() {
        try {
            console.log('[UsuarioController] logout: clearing current user');
            try {
                const mod = await import('@react-native-async-storage/async-storage').catch(() => null);
                const AsyncStorage = mod ? (mod.default || mod) : null;
                if (AsyncStorage) {
                    await AsyncStorage.removeItem('currentUserCorreo');
                    console.log('[UsuarioController] logout: AsyncStorage removed currentUserCorreo');
                }
            } catch (e) {
                console.warn('[UsuarioController] logout: AsyncStorage remove error', e);
            }
            try {
                if (DatabaseService && DatabaseService.setMeta) {
                    await DatabaseService.setMeta('currentUserCorreo', null);
                    console.log('[UsuarioController] logout: DB meta cleared');
                }
            } catch (e) {
                console.warn('[UsuarioController] logout: DB meta clear error', e);
            }
            this.currentUser = null;
            this.notifyListeners();
            return true;
        } catch (e) {
            console.error('[UsuarioController] logout error', e);
            return false;
        }
    }

}