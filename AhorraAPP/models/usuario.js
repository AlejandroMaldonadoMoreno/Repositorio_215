export class Usuario {
    constructor(id, nombre, apellidos, telefono, correo, passwordHash, cuenta, fechaCreacion) {
        this.id = id;
        this.nombre = nombre;
        this.apellidos = apellidos || null;
        this.telefono = telefono || null;
        this.correo = correo || null;
        this.passwordHash = passwordHash || null;
        this.cuenta = cuenta || null;
        this.fechaCreacion = fechaCreacion || new Date().toISOString();
    }

    static validar(nombre) {
        if (!nombre || nombre.trim().length === 0) {
            throw new Error("el nombre no puede estar vacío");
        }
        if (nombre.length > 50) {
            throw new Error("el nombre no puede tener más de 50 caracteres");
        }
        return true;
    }

    // Genera un número de cuenta aleatorio de 16 dígitos (string)
    static generarNumeroCuenta() {
        let res = '';
        for (let i = 0; i < 16; i++) {
            res += Math.floor(Math.random() * 10).toString();
        }
        return res;
    }
}