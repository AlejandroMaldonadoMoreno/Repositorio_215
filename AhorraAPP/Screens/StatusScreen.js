import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, FlatList } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import Pantalla_Movimientos from './MovimientoScreen';
import DatabaseService from '../database/DataBaseService';
import { UsuarioController } from '../controllers/UsuarioController';

const usuarioController = new UsuarioController();

export default function StatusScreen({ navigation }) {

    const [movimientos, setMovimientos] = useState([]);
    const [monthlyBudgets, setMonthlyBudgets] = useState([]);
    const [saldo, setSaldo] = useState(0);
    const [user, setUser] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Presupuestos Mensuales

    const [monthlyModalVisible, setMonthlyModalVisible] = useState(false);
    const [editingMonthlyId, setEditingMonthlyId] = useState(null);
    const [newMonthlyCategory, setNewMonthlyCategory] = useState('');
    const [newMonthlyLimit, setNewMonthlyLimit] = useState('');
    const [newMonthlySpent, setNewMonthlySpent] = useState('0.00');
    // Monthly budgets filters/sorting/search
    const [monthlyFilterModalVisible, setMonthlyFilterModalVisible] = useState(false);
    const [monthlySortType, setMonthlySortType] = useState('riesgoMayor'); // riesgoMayor/riesgoMenor
    const [monthlyRiskFilters, setMonthlyRiskFilters] = useState({ bajo: false, alto: false });
    const [monthlySearchTerm, setMonthlySearchTerm] = useState('');
    const [movimientoModalVisible, setMovimientoModalVisible] = useState(false);
    const [editingMovimiento, setEditingMovimiento] = useState(null);
    const [orderModalVisible, setOrderModalVisible] = useState(false);
    // filters can be combined (transferencias, gastos, ingresos)
    const [filters, setFilters] = useState({ transferencias: false, gastos: false, ingresos: false });
    // sortType controls ordering (only one at a time)
    const [sortType, setSortType] = useState('fechaReciente');
    
    // Estados para modal de selección y transacciones
    const [tipoMovimientoModalVisible, setTipoMovimientoModalVisible] = useState(false);
    const [transaccionModalVisible, setTransaccionModalVisible] = useState(false);
    const [transaccionTipo, setTransaccionTipo] = useState('ingreso'); // ingreso o gasto
    const [transaccionMonto, setTransaccionMonto] = useState('');
    const [transaccionDescripcion, setTransaccionDescripcion] = useState('');
    const [transaccionPresupuesto, setTransaccionPresupuesto] = useState(null);
    const [transaccionPresupuestoModalVisible, setTransaccionPresupuestoModalVisible] = useState(false);
    const [editingTransaccionId, setEditingTransaccionId] = useState(null);
    // Internal confirmation modal state (works across platforms)

    // Función para ordenar/filtrar movimientos con filtros combinables
    const getOrderedMovimientos = () => {
        // Robust ordering/filtering that understands DB transaction shape
        const parseDateFromTx = (tx) => {
            try {
                if (!tx) return new Date(0);
                // prefer ISO `fecha` from DB
                if (tx.fecha) {
                    const d = new Date(tx.fecha);
                    if (!isNaN(d)) return d;
                }
                // fallback to `date` + `time` friendly parsing (spanish format)
                if (tx.date) {
                    const monthMap = { enero:0,febrero:1,marzo:2,abril:3,mayo:4,junio:5,julio:6,agosto:7,septiembre:8,octubre:9,noviembre:10,diciembre:11 };
                    try {
                        const m = tx.date.toString().toLowerCase().match(/(\d{1,2})\s+de\s+([a-zñ]+)\s+de\s+(\d{4})/i);
                        if (m) {
                            const day = parseInt(m[1],10);
                            const month = monthMap[m[2]] !== undefined ? monthMap[m[2]] : 0;
                            const year = parseInt(m[3],10);
                            let hours = 0, minutes = 0;
                            if (tx.time) {
                                const t = tx.time.toString().match(/(\d{1,2}):(\d{2})/);
                                if (t) { hours = parseInt(t[1],10); minutes = parseInt(t[2],10); }
                            }
                            return new Date(year, month, day, hours, minutes);
                        }
                    } catch (e) { /* fallthrough */ }
                }
            } catch (e) {}
            return new Date(0);
        };

        const getAmountFromTx = (tx) => {
            if (!tx) return 0;
            if (tx.monto != null) return Number(tx.monto) || 0;
            if (tx.amount != null) return Number(tx.amount) || 0;
            if (tx.amountLabel) {
                const n = (''+tx.amountLabel).replace(/[^0-9.-]/g,'');
                return Number(n) || 0;
            }
            return 0;
        };

        const getTipoMovimiento = (tx) => {
            if (!tx) return '';
            // Primero revisar si tiene tipo en metadata (gasto/ingreso)
            try {
                let meta = tx.metadata;
                if (meta && typeof meta === 'string') {
                    try { meta = JSON.parse(meta); } catch (e) { }
                }
                if (meta && meta.tipo) {
                    const tipo = String(meta.tipo).toLowerCase();
                    if (tipo === 'gasto') return 'gasto';
                    if (tipo === 'ingreso') return 'ingreso';
                }
            } catch (e) {}
            
            // Si tiene tipo directamente en el objeto
            if (tx.tipo) {
                const tipo = String(tx.tipo).toLowerCase();
                if (tipo === 'gasto') return 'gasto';
                if (tipo === 'ingreso') return 'ingreso';
            }
            
            // Si no es gasto ni ingreso, es transferencia
            return 'transferencia';
        };

        const deriveTag = (tx) => {
            if (!tx) return '';
            if (tx.tag) return String(tx.tag).toLowerCase();
            // if metadata indicates direction, use it
            try {
                let meta = tx.metadata;
                if (meta && typeof meta === 'string') {
                    try { meta = JSON.parse(meta); } catch (e) { }
                }
                if (meta && meta.direction) return String(meta.direction).toLowerCase();
                if (meta && (meta.fromUserId || meta.toUserId || meta.fromUser || meta.toUser)) {
                    // amount sign determines direction
                    const amt = getAmountFromTx(tx);
                    return amt < 0 ? 'paga' : 'recibi';
                }
            } catch (e) {}
            // fallback to amount sign
            const amt = getAmountFromTx(tx);
            if (amt < 0) return 'paga';
            if (amt > 0) return 'recibi';
            return '';
        };

        let arr = (movimientos || []).slice().map(m => ({
            __orig: m,
            __dateObj: parseDateFromTx(m),
            __amount: getAmountFromTx(m),
            __tag: deriveTag(m),
            __tipo: getTipoMovimiento(m),
        }));

        // Apply type filters first (if any selected)
        if (filters.transferencias || filters.gastos || filters.ingresos) {
            arr = arr.filter(item => {
                const isTransferencia = item.__tipo === 'transferencia';
                const isGasto = item.__tipo === 'gasto';
                const isIngreso = item.__tipo === 'ingreso';
                return (filters.transferencias && isTransferencia) || 
                       (filters.gastos && isGasto) || 
                       (filters.ingresos && isIngreso);
            });
        }

        // Apply sorting
        if (sortType === 'fechaReciente') {
            arr.sort((a,b) => b.__dateObj - a.__dateObj);
        } else if (sortType === 'fechaAntigua') {
            arr.sort((a,b) => a.__dateObj - b.__dateObj);
        } else if (sortType === 'montoMenor') {
            arr.sort((a,b) => a.__amount - b.__amount);
        } else if (sortType === 'montoMayor') {
            arr.sort((a,b) => b.__amount - a.__amount);
        }

        // Return original-shaped transactions in the requested order
        return arr.map(i => i.__orig);

    };

    // CRUD Operations for Monthly Budgets (persist to DatabaseService when possible)
    const handleSaveBudget = async () => {
        // Basic presence checks
        if (!newMonthlyCategory || !newMonthlyCategory.trim()) {
            Alert.alert('Datos incompletos', 'Ingresa el concepto del presupuesto');
            return;
        }
        const parsedLimit = Number(newMonthlyLimit);
        const parsedSpent = Number(newMonthlySpent);
        if (isNaN(parsedLimit) || parsedLimit <= 0) {
            Alert.alert('Límite inválido', 'Ingresa un límite numérico mayor que 0');
            return;
        }
        if (isNaN(parsedSpent) || parsedSpent < 0) {
            Alert.alert('Gastado inválido', 'Ingresa un valor numérico válido para "Gastado hasta ahora" (>= 0)');
            return;
        }
        // Gastado no puede ser igual o mayor que el límite
        if (parsedSpent >= parsedLimit) {
            Alert.alert('Valor inválido', 'El valor "Gastado hasta ahora" no puede ser igual o mayor que el límite');
            return;
        }
        // Si hay usuario con saldo, no permitir límite mayor al saldo disponible
        if (user && typeof saldo === 'number' && parsedLimit > saldo) {
            Alert.alert('Límite mayor que saldo', 'El límite del presupuesto no puede ser mayor que tu saldo disponible');
            return;
        }

        // Confirmación para actualizar presupuesto existente
        if (editingMonthlyId) {
            Alert.alert(
                '¿Actualizar presupuesto?',
                `¿Deseas actualizar el presupuesto "${newMonthlyCategory.trim()}"?`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Actualizar', onPress: () => performSaveBudget() }
                ]
            );
        } else {
            performSaveBudget();
        }
    };

    const performSaveBudget = async () => {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const payload = {
            nombre: newMonthlyCategory.trim(),
            limite: parsedLimit,
            gastado: parsedSpent,
            mes: currentMonth,
            anio: currentYear,
            fechaCreacion: new Date().toISOString(),
        };
        try {
            if (!user) {
                // operate on local state if no logged user
                const id = editingMonthlyId || `mb${Date.now()}`;
                setMonthlyBudgets(prev => {
                    if (editingMonthlyId) return prev.map(mb => mb.id === editingMonthlyId ? { ...mb, concept: payload.nombre, limit: String(payload.limite), spent: String(payload.gastado) } : mb);
                    return [{ id, concept: payload.nombre, limit: String(payload.limite), spent: String(payload.gastado), month: payload.mes, year: payload.anio }, ...prev];
                });
            } else {
                if (editingMonthlyId) {
                    try {
                        const updated = await DatabaseService.updateBudget(editingMonthlyId, { nombre: payload.nombre, limite: payload.limite, gastado: payload.gastado });
                        if (!updated) throw new Error('No se pudo actualizar el presupuesto');
                        // si excede, enviar notificación
                        try {
                            const lim = Number((updated && (updated.limite != null ? updated.limite : payload.limite)) || payload.limite || 0);
                            const spent = Number((updated && (updated.gastado != null ? updated.gastado : payload.gastado)) || payload.gastado || 0);
                            if (spent > lim) {
                                const excede = spent - lim;
                                const subj = 'Presupuesto excedido';
                                const body = `El presupuesto "${updated.nombre || payload.nombre}" ha sido excedido por $${excede.toFixed(2)}. Límite: $${lim.toFixed(2)}, Gastado: $${spent.toFixed(2)}.`;
                                await DatabaseService.addMail(user.id, { subject: subj, body, is_read: 0 }).catch(() => {});
                            }
                        } catch (e) { console.warn('[StatusScreen] notificar presupuesto excedido error', e); }
                    } catch (e) {
                        console.warn('[StatusScreen] updateBudget error', e);
                        const msg = (e && e.message) ? e.message : 'No fue posible actualizar el presupuesto';
                        Alert.alert('Error', msg);
                    }
                } else {
                    try {
                        const created = await DatabaseService.addBudget(user.id, payload);
                        // si el presupuesto inicial ya excede (posible si gastado enviado > limite), notificar
                        try {
                            const lim = Number(created && created.limite || payload.limite || 0);
                            const spent = Number(created && created.gastado || payload.gastado || 0);
                            if (spent > lim) {
                                const excede = spent - lim;
                                const subj = 'Presupuesto excedido';
                                const body = `El presupuesto "${created.nombre || payload.nombre}" ha sido creado y excede el límite por $${excede.toFixed(2)}. Límite: $${lim.toFixed(2)}, Gastado: $${spent.toFixed(2)}.`;
                                await DatabaseService.addMail(user.id, { subject: subj, body, is_read: 0 }).catch(() => {});
                            }
                        } catch (e) { console.warn('[StatusScreen] notificar presupuesto excedido error', e); }
                    } catch (e) { console.warn('[StatusScreen] addBudget error', e); }
                }
                await loadData();
            }
            setNewMonthlyCategory('');
            setNewMonthlyLimit('');
            setNewMonthlySpent('0.00');
            setEditingMonthlyId(null);
            setMonthlyModalVisible(false);
        } catch (e) {
            console.warn('[StatusScreen] save budget error', e);
            Alert.alert('Error', 'No fue posible guardar el presupuesto');
        }
    };

    const handleDeleteBudget = async () => {
        if (!editingMonthlyId) {
            setMonthlyModalVisible(false);
            return;
        }

        Alert.alert(
            '¿Eliminar presupuesto?',
            `¿Estás seguro de que deseas eliminar este presupuesto? Esta acción no se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => performDeleteBudget() }
            ]
        );
    };

    const performDeleteBudget = async () => {
        try {
            if (!user) {
                setMonthlyBudgets(prev => prev.filter(mb => mb.id !== editingMonthlyId));
            } else {
                await DatabaseService.deleteBudget(editingMonthlyId);
                await loadData();
            }
            setEditingMonthlyId(null);
            setMonthlyModalVisible(false);
        } catch (e) {
            console.warn('[StatusScreen] delete budget error', e);
            Alert.alert('Error', 'No fue posible eliminar el presupuesto');
        }
    };


    const getPercentageSpent = (spent, limit) => {
        return Math.min(Math.round((parseFloat(spent) / parseFloat(limit)) * 100), 100);
    };

    const getProgressColor = (percentage) => {
        if (percentage <= 50) return '#36d36c';
        if (percentage <= 80) return '#ffbe54';
        return '#d9534f';
    };

    const normalizeBudget = (b) => {
        if (!b) return null;
        const id = b.id || b._id || b.rowid || b.ID || null;
        const concept = b.concept || b.nombre || b.name || b.category || '';
        const limitRaw = (b.limit != null ? b.limit : (b.limite != null ? b.limite : (b.limit == 0 ? 0 : '0')));
        const spentRaw = (b.spent != null ? b.spent : (b.gastado != null ? b.gastado : 0));
        const limit = Number(limitRaw) || parseFloat(limitRaw) || 0;
        const spent = Number(spentRaw) || parseFloat(spentRaw) || 0;
        const month = b.month || b.mes || (new Date().getMonth() + 1);
        const year = b.year || b.anio || new Date().getFullYear();
        if (!id) return {
            id: `${concept}-${year}-${month}`,
            concept,
            limit,
            spent,
            month,
            year,
        };
        return {
            id,
            concept,
            limit,
            spent,
            month,
            year,
        };
    };

    // Get filtered + sorted monthly budgets according to search, risk filters and sort type
    const getFilteredMonthlyBudgets = () => {
        let arr = [...monthlyBudgets];

        // Search by concept (live)
        if (monthlySearchTerm && monthlySearchTerm.trim() !== '') {
            const term = monthlySearchTerm.trim().toLowerCase();
            arr = arr.filter(mb => (mb.concept || '').toLowerCase().includes(term));
        }

        // Apply risk filters if any
        if (monthlyRiskFilters.bajo || monthlyRiskFilters.alto) {
            arr = arr.filter(mb => {
                const pct = getPercentageSpent(mb.spent, mb.limit);
                const isBajo = pct <= 50;
                const isAlto = pct >= 80;
                return (monthlyRiskFilters.bajo && isBajo) || (monthlyRiskFilters.alto && isAlto);
            });
        }

        // Apply sorting by riesgo (only these two now)
        if (monthlySortType === 'riesgoMayor') {
            arr.sort((a, b) => getPercentageSpent(b.spent, b.limit) - getPercentageSpent(a.spent, a.limit));
        } else if (monthlySortType === 'riesgoMenor') {
            arr.sort((a, b) => getPercentageSpent(a.spent, a.limit) - getPercentageSpent(b.spent, b.limit));
        }

        return arr;
    };

    const loadData = async () => {
        setLoading(true);
        try {
            await usuarioController.initialize();
            const u = await usuarioController.getCurrentUser();
            setUser(u);
            if (!u) {
                setMovimientos([]);
                setMonthlyBudgets([]);
                setSaldo(0);
                setUsersList([]);
                setLoading(false);
                return;
            }
            // load transactions
            const txs = await DatabaseService.getTransactions(u.id, { limit: 1000 }).catch(() => []);
            const tlist = Array.isArray(txs) ? txs : [];
            setMovimientos(tlist);
            // compute saldo
            const sum = (tlist || []).reduce((s, t) => s + (Number(t.monto) || 0), 0);
            setSaldo(sum);
            // load budgets
            const buds = await DatabaseService.getBudgets(u.id).catch(() => []);
            const mapped = (Array.isArray(buds) ? buds : []).map(b => normalizeBudget(b)).filter(x => x);
            setMonthlyBudgets(mapped);
            // load users for counterparty resolution
            const allUsers = await DatabaseService.getAll().catch(() => []);
            setUsersList(Array.isArray(allUsers) ? allUsers : []);
        } catch (e) {
            console.warn('[StatusScreen] loadData error', e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            loadData();
        }, [])
    );

    // Funciones para manejar transacciones
    const handleSaveTransaccion = async () => {
        if (!user) {
            Alert.alert('Error', 'Debes iniciar sesión para registrar transacciones');
            return;
        }
        if (!transaccionPresupuesto) {
            Alert.alert('Datos incompletos', 'Debes seleccionar un presupuesto');
            return;
        }
        if (!transaccionMonto || isNaN(Number(transaccionMonto)) || Number(transaccionMonto) <= 0) {
            Alert.alert('Datos incompletos', 'Ingresa un monto válido mayor a 0');
            return;
        }
        
        const monto = Number(transaccionMonto);
        const limite = Number(transaccionPresupuesto.limit || 0);
        const gastadoActual = Number(transaccionPresupuesto.spent || 0);
        
        // Validación de SALDO para GASTO
        if (transaccionTipo === 'gasto') {
            if (monto > saldo) {
                Alert.alert(
                    'Saldo insuficiente',
                    `No tienes suficiente saldo para realizar este gasto.\n\nSaldo disponible: $${saldo.toFixed(2)}\nGasto que intentas registrar: $${monto.toFixed(2)}\nFaltante: $${(monto - saldo).toFixed(2)}`
                );
                return;
            }
        }
        
        // Validación para INGRESO
        if (transaccionTipo === 'ingreso') {
            // El ingreso no puede ser mayor al gastado actual (no puedes "recuperar" más de lo que has gastado)
            if (monto > gastadoActual) {
                Alert.alert(
                    'Ingreso no válido',
                    `No puedes registrar un ingreso mayor al monto gastado actual.\n\nGastado actual: $${gastadoActual.toFixed(2)}\nIngreso que intentas registrar: $${monto.toFixed(2)}\n\nSolo puedes recuperar hasta $${gastadoActual.toFixed(2)} del presupuesto.`
                );
                return;
            }
            
            // Calcular el nuevo gastado después del ingreso
            const nuevoGastado = gastadoActual - monto;
            if (nuevoGastado < 0) {
                Alert.alert(
                    'Ingreso no válido',
                    `Este ingreso resultaría en un valor negativo en el presupuesto.\n\nGastado actual: $${gastadoActual.toFixed(2)}\nIngreso: $${monto.toFixed(2)}\nResultado: $${nuevoGastado.toFixed(2)} (negativo)\n\nEl ingreso máximo permitido es $${gastadoActual.toFixed(2)}.`
                );
                return;
            }
        }
        
        // Validación para GASTO
        if (transaccionTipo === 'gasto') {
            const nuevoGastado = gastadoActual + monto;
            if (nuevoGastado > limite) {
                const excede = nuevoGastado - limite;
                Alert.alert(
                    'Presupuesto Excedido',
                    `Este gasto hará que superes el límite del presupuesto "${transaccionPresupuesto.concept}" por $${excede.toFixed(2)}.\n\nLímite: $${limite.toFixed(2)}\nGastado actual: $${gastadoActual.toFixed(2)}\nNuevo gasto: $${monto.toFixed(2)}\nTotal: $${nuevoGastado.toFixed(2)}\n\n¿Deseas continuar?`,
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Continuar', onPress: () => guardarTransaccion() }
                    ]
                );
                return;
            }
        }
        
        await guardarTransaccion();
    };
    
    const guardarTransaccion = async () => {
        try {
            const monto = Number(transaccionMonto);
            const montoFinal = transaccionTipo === 'gasto' ? -Math.abs(monto) : Math.abs(monto);
            const categoria = transaccionPresupuesto.concept; // Usar el nombre del presupuesto como categoría
            
            const payload = {
                tipo: transaccionTipo,
                concepto: categoria,
                monto: montoFinal,
                fecha: new Date().toISOString(),
                metadata: JSON.stringify({
                    descripcion: transaccionDescripcion.trim(),
                    categoria: categoria,
                    tipo: transaccionTipo,
                    presupuestoId: transaccionPresupuesto.id,
                    presupuestoNombre: transaccionPresupuesto.concept
                })
            };
            
            if (editingTransaccionId) {
                // Editar transacción existente
                await DatabaseService.updateTransaction(editingTransaccionId, payload);
            } else {
                // Crear nueva transacción
                await DatabaseService.addTransaction(user.id, payload);
                
                // Actualizar el gastado del presupuesto
                try {
                    let nuevoGastado;
                    if (transaccionTipo === 'gasto') {
                        // Si es gasto, SUMAR al gastado
                        nuevoGastado = Number(transaccionPresupuesto.spent || 0) + Math.abs(monto);
                    } else {
                        // Si es ingreso, RESTAR del gastado
                        nuevoGastado = Number(transaccionPresupuesto.spent || 0) - Math.abs(monto);
                        // No permitir que el gastado sea negativo
                        nuevoGastado = Math.max(0, nuevoGastado);
                    }
                    
                    await DatabaseService.updateBudget(transaccionPresupuesto.id, { gastado: nuevoGastado });
                    
                    // Verificar si excede el límite (solo para gastos)
                    if (transaccionTipo === 'gasto') {
                        const limite = Number(transaccionPresupuesto.limit || 0);
                        if (nuevoGastado > limite) {
                            const excede = nuevoGastado - limite;
                            const subj = 'Presupuesto excedido';
                            const body = `El presupuesto "${transaccionPresupuesto.concept}" ha sido excedido por $${excede.toFixed(2)}. Límite: $${limite.toFixed(2)}, Gastado: $${nuevoGastado.toFixed(2)}.`;
                            await DatabaseService.addMail(user.id, { subject: subj, body, is_read: 0 }).catch(() => {});
                        }
                    }
                } catch (e) {
                    console.warn('[StatusScreen] update budget after transaction error', e);
                }
                
                // Enviar notificación
                const subject = transaccionTipo === 'ingreso' ? 'Ingreso registrado' : 'Gasto registrado';
                const body = `Se ha registrado un ${transaccionTipo} de $${Math.abs(montoFinal).toFixed(2)} en el presupuesto "${transaccionPresupuesto.concept}". ${transaccionDescripcion ? 'Descripción: ' + transaccionDescripcion : ''}`;
                await DatabaseService.addMail(user.id, { subject, body, is_read: 0 }).catch(() => {});
            }
            
            // Recargar datos
            await loadData();
            
            // Limpiar y cerrar modal
            setTransaccionMonto('');
            setTransaccionDescripcion('');
            setTransaccionPresupuesto(null);
            setEditingTransaccionId(null);
            setTransaccionModalVisible(false);
            
            Alert.alert('Éxito', `${transaccionTipo === 'ingreso' ? 'Ingreso' : 'Gasto'} registrado correctamente`);
        } catch (e) {
            console.warn('[StatusScreen] save transaccion error', e);
            Alert.alert('Error', 'No fue posible guardar la transacción');
        }
    };

    const handleDeleteTransaccion = async () => {
        if (!editingMovimiento || !user) {
            console.warn('[StatusScreen] No hay movimiento o usuario para eliminar');
            return;
        }

        console.log('[StatusScreen] === INICIANDO ELIMINACIÓN ===');
        console.log('[StatusScreen] Movimiento completo:', JSON.stringify(editingMovimiento, null, 2));
        console.log('[StatusScreen] Concepto:', editingMovimiento.concepto);
        console.log('[StatusScreen] Tipo directo:', editingMovimiento.tipo);

        // Extraer información del movimiento
        const montoNum = Math.abs(Number(editingMovimiento.monto) || 0);
        let tipoMovimiento = 'transferencia';
        let presupuestoId = null;

        // Detectar tipo y presupuesto
        try {
            let meta = editingMovimiento.metadata;
            console.log('[StatusScreen] Metadata original:', meta);
            console.log('[StatusScreen] Tipo de metadata:', typeof meta);
            console.log('[StatusScreen] Metadata es null?', meta === null);
            console.log('[StatusScreen] Metadata es undefined?', meta === undefined);
            
            if (meta && typeof meta === 'string') {
                try { 
                    meta = JSON.parse(meta);
                    console.log('[StatusScreen] Metadata parseada exitosamente:', JSON.stringify(meta, null, 2));
                } catch (e) { 
                    console.warn('[StatusScreen] Error parseando metadata:', e);
                    console.log('[StatusScreen] Metadata sin parsear:', meta);
                }
            }
            
            if (meta && typeof meta === 'object') {
                console.log('[StatusScreen] Claves en metadata:', Object.keys(meta));
                
                // Detectar tipo
                if (meta.tipo) {
                    tipoMovimiento = meta.tipo;
                    console.log('[StatusScreen] ✓ Tipo detectado desde metadata.tipo:', tipoMovimiento);
                }
                
                // Detectar presupuestoId con múltiples fallbacks
                if (meta.presupuestoId) {
                    presupuestoId = meta.presupuestoId;
                    console.log('[StatusScreen] ✓ PresupuestoId detectado desde metadata.presupuestoId:', presupuestoId);
                } else if (meta.presupuesto_id) {
                    presupuestoId = meta.presupuesto_id;
                    console.log('[StatusScreen] ✓ PresupuestoId detectado desde metadata.presupuesto_id:', presupuestoId);
                } else if (meta.budgetId) {
                    presupuestoId = meta.budgetId;
                    console.log('[StatusScreen] ✓ PresupuestoId detectado desde metadata.budgetId:', presupuestoId);
                } else {
                    console.warn('[StatusScreen] ⚠️ No se encontró presupuestoId en metadata. Contenido completo:', JSON.stringify(meta));
                }
            } else {
                console.warn('[StatusScreen] ⚠️ Metadata no es un objeto después del parseo');
            }
        } catch (e) {
            console.error('[StatusScreen] ❌ Error en detección de metadata:', e);
        }

        // Si tiene tipo directamente
        if (editingMovimiento.tipo && (editingMovimiento.tipo === 'gasto' || editingMovimiento.tipo === 'ingreso')) {
            tipoMovimiento = editingMovimiento.tipo;
            console.log('[StatusScreen] Tipo detectado desde editingMovimiento.tipo:', tipoMovimiento);
        }

        // FALLBACK: Si no hay presupuestoId en metadata, intentar buscarlo por concepto
        if (!presupuestoId && editingMovimiento.concepto && (tipoMovimiento === 'gasto' || tipoMovimiento === 'ingreso')) {
            console.log('[StatusScreen] Intentando buscar presupuesto por concepto:', editingMovimiento.concepto);
            try {
                const budgets = await DatabaseService.getBudgets(user.id);
                const presupuestoEncontrado = budgets.find(b => {
                    const conceptoBudget = b.concept || b.nombre || b.name || b.category || '';
                    return conceptoBudget.toLowerCase() === editingMovimiento.concepto.toLowerCase();
                });
                
                if (presupuestoEncontrado) {
                    presupuestoId = presupuestoEncontrado.id || presupuestoEncontrado._id || presupuestoEncontrado.rowid;
                    console.log('[StatusScreen] ✓ Presupuesto encontrado por concepto! ID:', presupuestoId);
                } else {
                    console.warn('[StatusScreen] No se encontró presupuesto con concepto:', editingMovimiento.concepto);
                    console.log('[StatusScreen] Presupuestos disponibles:', budgets.map(b => ({
                        id: b.id,
                        nombre: b.concept || b.nombre
                    })));
                }
            } catch (e) {
                console.error('[StatusScreen] Error buscando presupuesto por concepto:', e);
            }
        }

        console.log('[StatusScreen] VALORES FINALES:');
        console.log('[StatusScreen] - Tipo:', tipoMovimiento);
        console.log('[StatusScreen] - Monto:', montoNum);
        console.log('[StatusScreen] - PresupuestoId:', presupuestoId);

        // Solo permitir eliminar gastos e ingresos
        if (tipoMovimiento === 'transferencia') {
            Alert.alert('No permitido', 'Las transferencias no pueden ser eliminadas. Son perpetuas por seguridad.');
            return;
        }

        const esGasto = tipoMovimiento === 'gasto';
        const esIngreso = tipoMovimiento === 'ingreso';
        console.log('[StatusScreen] Es gasto?', esGasto, '| Es ingreso?', esIngreso);

        Alert.alert(
            '¿Eliminar movimiento?',
            `¿Estás seguro de que deseas eliminar este ${tipoMovimiento}?\n\nMonto: $${montoNum.toFixed(2)}\n${esGasto ? `Se recuperarán $${montoNum.toFixed(2)} del presupuesto.` : esIngreso ? `Se revertirá el ingreso de $${montoNum.toFixed(2)}.` : 'N/A'}\n\nEsta acción no se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: 'Eliminar', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            console.log('[StatusScreen] Procediendo con eliminación...');

                            // Actualizar el presupuesto ANTES de eliminar
                            if (presupuestoId) {
                                console.log('[StatusScreen] Actualizando presupuesto ID:', presupuestoId);
                                try {
                                    const budgets = await DatabaseService.getBudgets(user.id);
                                    console.log('[StatusScreen] Total presupuestos encontrados:', budgets.length);
                                    const budget = budgets.find(b => b.id === presupuestoId || String(b.id) === String(presupuestoId));
                                    
                                    console.log('[StatusScreen] Presupuesto encontrado:', budget);
                                    
                                    if (budget) {
                                        const gastadoActual = Number(budget.gastado || budget.spent || 0);
                                        const limiteActual = Number(budget.limite || budget.limit || 0);
                                        let nuevoGastado;
                                        
                                        console.log('[StatusScreen] Gastado actual:', gastadoActual);
                                        console.log('[StatusScreen] Límite:', limiteActual);
                                        
                                        if (esGasto) {
                                            // Si era un gasto, restamos el monto (recuperamos dinero)
                                            nuevoGastado = Math.max(0, gastadoActual - montoNum);
                                            console.log('[StatusScreen] GASTO eliminado - Nuevo gastado:', nuevoGastado, '(', gastadoActual, '-', montoNum, ')');
                                        } else if (esIngreso) {
                                            // Si era un ingreso, sumamos el monto (revertimos la recuperación)
                                            nuevoGastado = gastadoActual + montoNum;
                                            console.log('[StatusScreen] INGRESO eliminado - Nuevo gastado:', nuevoGastado, '(', gastadoActual, '+', montoNum, ')');
                                        }
                                        
                                        console.log('[StatusScreen] Actualizando presupuesto a gastado:', nuevoGastado);
                                        const resultado = await DatabaseService.updateBudget(presupuestoId, { gastado: nuevoGastado });
                                        console.log('[StatusScreen] Resultado de actualización de presupuesto:', resultado);
                                    } else {
                                        console.warn('[StatusScreen] ⚠️ No se encontró el presupuesto con ID:', presupuestoId);
                                        console.log('[StatusScreen] IDs de presupuestos disponibles:', budgets.map(b => b.id));
                                    }
                                } catch (e) {
                                    console.error('[StatusScreen] ❌ Error actualizando presupuesto al eliminar:', e);
                                }
                            } else {
                                console.warn('[StatusScreen] ⚠️ No hay presupuestoId vinculado a este movimiento');
                            }

                            // Eliminar la transacción
                            console.log('[StatusScreen] Eliminando transacción ID:', editingMovimiento.id);
                            await DatabaseService.deleteTransaction(editingMovimiento.id);
                            console.log('[StatusScreen] ✓ Transacción eliminada');

                            // Enviar notificación
                            try {
                                const subject = `${tipoMovimiento === 'ingreso' ? 'Ingreso' : 'Gasto'} eliminado`;
                                const body = `Se ha eliminado un ${tipoMovimiento} de $${montoNum.toFixed(2)} (${editingMovimiento.concepto || 'Sin concepto'}). ${esGasto ? `Se recuperaron $${montoNum.toFixed(2)} en el presupuesto.` : `Se eliminaron $${montoNum.toFixed(2)} del presupuesto.`}`;
                                await DatabaseService.addMail(user.id, { subject, body, is_read: 0 });
                            } catch (e) {
                                console.warn('[StatusScreen] Error enviando notificación', e);
                            }

                            // Recargar datos y cerrar modal
                            await loadData();
                            setMovimientoModalVisible(false);
                            
                            Alert.alert('Eliminado', `El ${tipoMovimiento} ha sido eliminado correctamente.`);
                        } catch (e) {
                            console.warn('[StatusScreen] delete transaccion error', e);
                            Alert.alert('Error', 'No fue posible eliminar el movimiento');
                        }
                    }
                }
            ]
        );
    };

    return (
    <ScrollView
        contentContainerStyle={styles.containerMain}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
    >
        <View style={styles.fondoAzul}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.Atras}>{"< Atrás"}</Text>
            </TouchableOpacity>
        </View>
        
            <View style={styles.contenido}>
                <View style={styles.dataContainer}>
                    <Text style={styles.titleTag}> Saldo Disponible</Text>

                    <Text style={styles.titleMoney}>$ {typeof saldo === 'number' ? saldo.toFixed(2) : '0.00'}</Text>
                    <TouchableOpacity 
                        style={styles.botonMovimientos}
                        onPress={() => setTipoMovimientoModalVisible(true)}
                    >
                        <Text style={styles.tituloBoton}> Crear Movimiento </Text>
                    </TouchableOpacity>
                </View>


                <View style={styles.dataContainer}>

                    <View style={styles.movimientosContainer}>
                        <Text style={styles.titleTag}> Movimientos Recientes</Text>
                        <TouchableOpacity 
                            style={styles.movimientosBoton}
                            onPress={() => setOrderModalVisible(true)}
                        >
                            <Text style={styles.movimientosBotonText}> Ordenar por..</Text>
                        </TouchableOpacity>
                        
                    </View>
                    {/* Monthly budgets filter modal */}
                    <Modal
                        visible={monthlyFilterModalVisible}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setMonthlyFilterModalVisible(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContainer}>
                                <Text style={styles.titleTag}>Filtros Presupuestos</Text>
                                <Text style={styles.modalSubtitle}>Riesgo (puede seleccionar varios):</Text>
                                <TouchableOpacity
                                    style={styles.orderOption}
                                    onPress={() => setMonthlyRiskFilters(prev => ({...prev, bajo: !prev.bajo}))}
                                >
                                    <Text style={styles.orderOptionText}>{monthlyRiskFilters.bajo ? '☑' : '☐'} Bajo (≤50%)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.orderOption}
                                    onPress={() => setMonthlyRiskFilters(prev => ({...prev, alto: !prev.alto}))}
                                >
                                    <Text style={styles.orderOptionText}>{monthlyRiskFilters.alto ? '☑' : '☐'} Alto (≥80%)</Text>
                                </TouchableOpacity>

                                <Text style={[styles.modalSubtitle, {marginTop: 10}]}>Ordenar por riesgo:</Text>
                                <TouchableOpacity style={styles.orderOption} onPress={() => { setMonthlySortType('riesgoMayor'); setMonthlyFilterModalVisible(false); }}>
                                    <Text style={styles.orderOptionText}>🔥 Riesgo (mayor a menor)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.orderOption} onPress={() => { setMonthlySortType('riesgoMenor'); setMonthlyFilterModalVisible(false); }}>
                                    <Text style={styles.orderOptionText}>❄️ Riesgo (menor a mayor)</Text>
                                </TouchableOpacity>

                                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 12}}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, {backgroundColor: '#6c757d', flex: 1, marginRight: 8}]}
                                        onPress={() => { setMonthlyRiskFilters({ bajo: false, alto: false }); setMonthlySortType('riesgoMayor'); setMonthlyFilterModalVisible(false);}}
                                    >
                                        <Text style={styles.modalButtonText}>Limpiar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, {backgroundColor: '#0a57d9', flex: 1}]}
                                        onPress={() => setMonthlyFilterModalVisible(false)}
                                    >
                                        <Text style={styles.modalButtonText}>Aplicar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    <ScrollView 
                        nestedScrollEnabled={true}
                        showsHorizontalScrollIndicator={false}
                        style={styles.movimientosScroll}
                    >
                        {(() => {
                            const ordered = getOrderedMovimientos();
                            if (!ordered || ordered.length === 0) return (
                                <View style={{ padding: 12, alignItems: 'center' }}>
                                    <Text style={{ color: '#888' }}>No hay movimientos registrados.</Text>
                                </View>
                            );
                            return ordered.map(tx => {
                                const montoNum = Number(tx.monto) || 0;
                                const isReceived = montoNum > 0;
                                // resolve counterparty from metadata
                                let counterparty = '';
                                try {
                                    let meta = tx.metadata;
                                    if (meta && typeof meta === 'string') {
                                        try { meta = JSON.parse(meta); } catch (e) { }
                                    }
                                    const cpId = meta && (meta.fromUserId || meta.toUserId || meta.fromUser || meta.toUser);
                                    if (cpId) {
                                        const found = (usersList || []).find(u => String(u.id) === String(cpId));
                                        if (found) counterparty = found.nombre || found.correo || found.cuenta || '';
                                    }
                                } catch (e) {}
                                const title = isReceived ? `Recibido${counterparty ? ' de ' + counterparty : ''}` : `Enviado${counterparty ? ' a ' + counterparty : ''}`;
                                const dateLabel = tx.fecha ? new Date(tx.fecha).toLocaleString() : '';
                                const amountLabel = `$ ${Math.abs(montoNum).toFixed(2)}`;
                                const key = tx.id || `${tx.fecha}_${montoNum}`;
                                return (
                                    <TouchableOpacity
                                        key={key}
                                        style={styles.movimientoDatoContainer}
                                        onPress={() => { setEditingMovimiento(tx); setMovimientoModalVisible(true); }}
                                    >
                                        <View style={{flex: 1}}>
                                            <Text style={styles.movimientoTag}>{title}</Text>
                                            <Text style={styles.tag}>{tx.concepto || tx.concept || ''}</Text>
                                            <Text style={styles.movimientoFecha}>{dateLabel}</Text>
                                        </View>
                                        <View style={styles.tipoMovimientoContainer}>
                                            <Text style={[styles.money, { color: montoNum < 0 ? '#d9534f' : '#36d36c' }]}>{isReceived ? `+ ${amountLabel}` : `- ${amountLabel}`}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        })()}
                    </ScrollView>

                    {/* Modal de información de movimiento */}
                    {movimientoModalVisible && editingMovimiento && (
                        <Modal
                            visible={movimientoModalVisible}
                            transparent={true}
                            animationType="fade"
                            onRequestClose={() => setMovimientoModalVisible(false)}
                        >
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContainer}>
                                        <Text style={styles.titleTag}>{editingMovimiento.tag || editingMovimiento.tipo || 'Movimiento'}</Text>
                                        <View style={styles.modalInfoSection}>
                                            <Text style={styles.modalInputLabel}>Título / Concepto:</Text>
                                            <Text style={styles.modalInputValue}>{editingMovimiento.concepto || editingMovimiento.title || editingMovimiento.concept || ''}</Text>
                                        
                                            <Text style={styles.modalInputLabel}>Monto:</Text>
                                            <Text style={styles.modalInputValue}>{editingMovimiento.monto != null ? `$ ${Number(editingMovimiento.monto).toFixed(2)}` : (editingMovimiento.amount || '')}</Text>
                                        
                                            <Text style={styles.modalInputLabel}>Fecha:</Text>
                                            <Text style={styles.modalInputValue}>{editingMovimiento.fecha ? new Date(editingMovimiento.fecha).toLocaleDateString() : (editingMovimiento.date || '')}</Text>
                                        
                                            <Text style={styles.modalInputLabel}>Hora:</Text>
                                            <Text style={styles.modalInputValue}>{editingMovimiento.fecha ? new Date(editingMovimiento.fecha).toLocaleTimeString() : (editingMovimiento.time || '')}</Text>
                                        </View>
                                    <View style={{flexDirection: 'row', gap: 10, flexWrap: 'wrap'}}>
                                        <TouchableOpacity
                                            style={[styles.modalButton, {flex: 1, backgroundColor: '#0A84FF', minWidth: 100}]}
                                            onPress={() => {
                                                setMovimientoModalVisible(false);
                                                navigation.navigate('Actualizar', { movimiento: editingMovimiento });
                                            }}
                                        >
                                            <Text style={styles.modalButtonText}>Actualizar</Text>
                                        </TouchableOpacity>
                                        
                                        {/* Botón eliminar solo para gastos e ingresos */}
                                        {(() => {
                                            let tipoMov = 'transferencia';
                                            try {
                                                let meta = editingMovimiento.metadata;
                                                if (meta && typeof meta === 'string') {
                                                    try { meta = JSON.parse(meta); } catch (e) { }
                                                }
                                                if (meta && meta.tipo) tipoMov = meta.tipo;
                                            } catch (e) {}
                                            if (editingMovimiento.tipo && (editingMovimiento.tipo === 'gasto' || editingMovimiento.tipo === 'ingreso')) {
                                                tipoMov = editingMovimiento.tipo;
                                            }
                                            
                                            if (tipoMov === 'gasto' || tipoMov === 'ingreso') {
                                                return (
                                                    <TouchableOpacity
                                                        style={[styles.modalButton, {flex: 1, backgroundColor: '#d9534f', minWidth: 100}]}
                                                        onPress={() => handleDeleteTransaccion()}
                                                    >
                                                        <Text style={styles.modalButtonText}>Eliminar</Text>
                                                    </TouchableOpacity>
                                                );
                                            }
                                            return null;
                                        })()}
                                        
                                        <TouchableOpacity
                                            style={[styles.modalButton, {flex: 1, minWidth: 100}]}
                                            onPress={() => setMovimientoModalVisible(false)}
                                        >
                                            <Text style={styles.modalButtonText}>Cerrar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    )}

                    {/* Modal de ordenar/filtrar (combinable) */}
                    <Modal
                        visible={orderModalVisible}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setOrderModalVisible(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContainer}>
                                <Text style={styles.titleTag}>Ordenar/Filtrar por:</Text>

                                <Text style={[styles.modalSubtitle, {marginTop: 5}]}>Filtrar por tipo (puede seleccionar varios):</Text>
                                <TouchableOpacity
                                    style={styles.orderOption}
                                    onPress={() => setFilters(prev => ({...prev, transferencias: !prev.transferencias}))}
                                >
                                    <Text style={styles.orderOptionText}>{filters.transferencias ? '☑' : '☐'} 🔄 Transferencias</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.orderOption}
                                    onPress={() => setFilters(prev => ({...prev, gastos: !prev.gastos}))}
                                >
                                    <Text style={styles.orderOptionText}>{filters.gastos ? '☑' : '☐'} 💸 Gastos</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.orderOption}
                                    onPress={() => setFilters(prev => ({...prev, ingresos: !prev.ingresos}))}
                                >
                                    <Text style={styles.orderOptionText}>{filters.ingresos ? '☑' : '☐'} 💵 Ingresos</Text>
                                </TouchableOpacity>

                                <Text style={[styles.modalSubtitle, {marginTop: 10}]}>Ordenar por (elige uno):</Text>
                                <TouchableOpacity
                                    style={styles.orderOption}
                                    onPress={() => { setSortType('fechaReciente'); setOrderModalVisible(false); }}
                                >
                                    <Text style={styles.orderOptionText}>📅 Fecha más reciente</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.orderOption}
                                    onPress={() => { setSortType('fechaAntigua'); setOrderModalVisible(false); }}
                                >
                                    <Text style={styles.orderOptionText}>📅 Fecha más antigua</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.orderOption}
                                    onPress={() => { setSortType('montoMenor'); setOrderModalVisible(false); }}
                                >
                                    <Text style={styles.orderOptionText}>💰 Monto menor a mayor</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.orderOption}
                                    onPress={() => { setSortType('montoMayor'); setOrderModalVisible(false); }}
                                >
                                    <Text style={styles.orderOptionText}>💰 Monto mayor a menor</Text>
                                </TouchableOpacity>

                                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 12}}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, {backgroundColor: '#6c757d', flex: 1, marginRight: 8}]}
                                        onPress={() => { setFilters({ transferencias: false, gastos: false, ingresos: false }); setSortType('fechaReciente'); setOrderModalVisible(false); }}
                                    >
                                        <Text style={styles.modalButtonText}>Limpiar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, {backgroundColor: '#0a57d9', flex: 1}]}
                                        onPress={() => setOrderModalVisible(false)}
                                    >
                                        <Text style={styles.modalButtonText}>Aplicar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {/* Modal de selección de tipo de movimiento */}
                    <Modal
                        visible={tipoMovimientoModalVisible}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setTipoMovimientoModalVisible(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContainer}>
                                <Text style={styles.titleTag}>¿Qué deseas hacer?</Text>
                                
                                <TouchableOpacity
                                    style={[styles.modalButton, {backgroundColor: '#0a57d9', marginTop: 20}]}
                                    onPress={() => {
                                        setTipoMovimientoModalVisible(false);
                                        navigation.navigate('Movimiento');
                                    }}
                                >
                                    <Text style={styles.modalButtonText}>💸 Transferencia</Text>
                                    <Text style={[styles.modalButtonText, {fontSize: 12, marginTop: 4}]}>Enviar dinero a otro usuario</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalButton, {backgroundColor: '#36d36c', marginTop: 15}]}
                                    onPress={() => {
                                        setTipoMovimientoModalVisible(false);
                                        setTransaccionTipo('ingreso');
                                        setTransaccionMonto('');
                                        setTransaccionDescripcion('');
                                        setTransaccionPresupuesto(null);
                                        setEditingTransaccionId(null);
                                        setTransaccionModalVisible(true);
                                    }}
                                >
                                    <Text style={styles.modalButtonText}>💰 Ingreso</Text>
                                    <Text style={[styles.modalButtonText, {fontSize: 12, marginTop: 4}]}>Registrar ingreso a mi cuenta</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalButton, {backgroundColor: '#d9534f', marginTop: 15}]}
                                    onPress={() => {
                                        setTipoMovimientoModalVisible(false);
                                        setTransaccionTipo('gasto');
                                        setTransaccionMonto('');
                                        setTransaccionDescripcion('');
                                        setTransaccionPresupuesto(null);
                                        setEditingTransaccionId(null);
                                        setTransaccionModalVisible(true);
                                    }}
                                >
                                    <Text style={styles.modalButtonText}>💳 Gasto</Text>
                                    <Text style={[styles.modalButtonText, {fontSize: 12, marginTop: 4}]}>Registrar un gasto</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalButton, {backgroundColor: '#999', marginTop: 20}]}
                                    onPress={() => setTipoMovimientoModalVisible(false)}
                                >
                                    <Text style={styles.modalButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/* Modal de transacción (ingreso/gasto) */}
                    <Modal
                        visible={transaccionModalVisible}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setTransaccionModalVisible(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContainer}>
                                <Text style={styles.titleTag}>
                                    {editingTransaccionId ? 'Editar' : 'Registrar'} {transaccionTipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
                                </Text>
                                
                                <Text style={styles.modalInputLabel}>Presupuesto</Text>
                                <TouchableOpacity
                                    style={[styles.modalInput, {justifyContent: 'center', paddingVertical: 12}]}
                                    onPress={() => setTransaccionPresupuestoModalVisible(true)}
                                >
                                    <Text style={{color: transaccionPresupuesto ? '#000' : '#999'}}>
                                        {transaccionPresupuesto ? transaccionPresupuesto.concept : 'Seleccionar presupuesto'}
                                    </Text>
                                </TouchableOpacity>
                                
                                <Text style={styles.modalInputLabel}>Monto</Text>
                                <TextInput
                                    placeholder="0.00"
                                    value={transaccionMonto}
                                    onChangeText={setTransaccionMonto}
                                    keyboardType="decimal-pad"
                                    style={styles.modalInput}
                                />
                                
                                <Text style={styles.modalInputLabel}>Descripción (opcional)</Text>
                                <TextInput
                                    placeholder="Detalles adicionales..."
                                    value={transaccionDescripcion}
                                    onChangeText={setTransaccionDescripcion}
                                    style={[styles.modalInput, {height: 80}]}
                                    multiline
                                    numberOfLines={3}
                                />

                                <View style={styles.modalButtonsRow}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, {backgroundColor: transaccionTipo === 'ingreso' ? '#36d36c' : '#d9534f'}]}
                                        onPress={handleSaveTransaccion}
                                    >
                                        <Text style={styles.modalButtonText}>{editingTransaccionId ? 'Actualizar' : 'Guardar'}</Text>
                                    </TouchableOpacity>
                                    
                                    {editingTransaccionId && (
                                        <TouchableOpacity
                                            style={[styles.modalButton, {backgroundColor: '#ff3b30'}]}
                                            onPress={handleDeleteTransaccion}
                                        >
                                            <Text style={styles.modalButtonText}>Eliminar</Text>
                                        </TouchableOpacity>
                                    )}
                                    
                                    <TouchableOpacity
                                        style={[styles.modalButton, {backgroundColor: '#999'}]}
                                        onPress={() => {
                                            setTransaccionModalVisible(false);
                                            setEditingTransaccionId(null);
                                        }}
                                    >
                                        <Text style={styles.modalButtonText}>Cancelar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {/* Modal de selección de presupuesto */}
                    <Modal
                        visible={transaccionPresupuestoModalVisible}
                        animationType="slide"
                        transparent
                        onRequestClose={() => setTransaccionPresupuestoModalVisible(false)}
                    >
                        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 }}>
                            <View style={{ backgroundColor: '#fff', borderRadius: 8, maxHeight: '70%', padding: 12 }}>
                                <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 12 }}>Seleccionar presupuesto</Text>
                                <FlatList
                                    data={monthlyBudgets}
                                    keyExtractor={item => String(item.id)}
                                    renderItem={({ item }) => {
                                        const percentage = getPercentageSpent(item.spent, item.limit);
                                        const disponible = parseFloat(item.limit) - parseFloat(item.spent);
                                        return (
                                            <TouchableOpacity 
                                                onPress={() => {
                                                    setTransaccionPresupuesto(item);
                                                    setTransaccionPresupuestoModalVisible(false);
                                                }} 
                                                style={{ 
                                                    paddingVertical: 10, 
                                                    borderBottomWidth: 1, 
                                                    borderBottomColor: '#eee',
                                                    backgroundColor: transaccionPresupuesto && transaccionPresupuesto.id === item.id ? '#e3f2fd' : 'transparent'
                                                }}
                                            >
                                                <Text style={{ fontWeight: '600', fontSize: 16 }}>{item.concept}</Text>
                                                <Text style={{ color: '#666', fontSize: 13, marginTop: 2 }}>
                                                    Gastado: ${Number(item.spent || 0).toFixed(2)} / Límite: ${Number(item.limit || 0).toFixed(2)}
                                                </Text>
                                                <Text style={{ color: disponible >= 0 ? '#36d36c' : '#d9534f', fontSize: 13 }}>
                                                    Disponible: ${disponible.toFixed(2)} ({percentage}%)
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    }}
                                />
                                <TouchableOpacity 
                                    onPress={() => { 
                                        setTransaccionPresupuesto(null); 
                                        setTransaccionPresupuestoModalVisible(false); 
                                    }} 
                                    style={{ marginTop: 8, padding: 8 }}
                                >
                                    <Text style={{ color: '#0a57d9' }}>Ninguno / Cancelar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                </View>

                {/* Monthly Budgets Section */}
                <View style={styles.dataContainer}>
                    <View style={[styles.textPresupuestoContainer, {justifyContent: 'space-between', alignItems: 'center'}]}>
                        <Text style={styles.titleTag}> Presupuestos Mensuales</Text>
                    </View>

                                <Text style={styles.monthlyBudgetInfo}>
                                    Mes actual: {new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
                                </Text>

                                <View style={styles.presupuestoContainer}>
                                    <TextInput
                                        placeholder="Buscar por concepto..."
                                        value={monthlySearchTerm}
                                        onChangeText={setMonthlySearchTerm}
                                        style={styles.presupuestoInput}
                                    />
                                    <TouchableOpacity
                                        style={styles.presupuestoBoton}
                                        onPress={() => setMonthlyFilterModalVisible(true)}
                                    >
                                        <Text style={styles.presupuestoBotonText}>Filtros</Text>
                                    </TouchableOpacity>
                                </View>

                    <ScrollView
                        style={styles.monthlyBudgetScroll}
                        contentContainerStyle={styles.monthlyBudgetScrollContent}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.monthlyBudgetRow}>
                            {(() => {
                                const list = getFilteredMonthlyBudgets();
                                if (!list || list.length === 0) return (
                                    <View style={{ padding: 12, alignItems: 'center', width: '100%' }}>
                                        <Text style={{ color: '#888' }}>No hay presupuestos mensuales registrados.</Text>
                                    </View>
                                );
                                return list.map(mb => {
                                const percentage = getPercentageSpent(mb.spent, mb.limit);
                                const progressColor = getProgressColor(percentage);
                                return (
                                    <TouchableOpacity
                                        key={mb.id}
                                        style={styles.monthlyBudgetItemBox}
                                        activeOpacity={0.8}
                                        onPress={() => {
                                            setEditingMonthlyId(mb.id);
                                                setNewMonthlyCategory(mb.concept || '');
                                                try {
                                                    const limVal = (mb.limit != null && !isNaN(Number(mb.limit))) ? Number(mb.limit).toFixed(2) : '';
                                                    setNewMonthlyLimit(limVal);
                                                } catch (e) { setNewMonthlyLimit(mb.limit != null ? String(mb.limit) : ''); }
                                                try {
                                                    const spentVal = (mb.spent != null && !isNaN(Number(mb.spent))) ? Number(mb.spent).toFixed(2) : '0.00';
                                                    setNewMonthlySpent(spentVal);
                                                } catch (e) { setNewMonthlySpent(mb.spent != null ? String(mb.spent) : '0.00'); }
                                            setMonthlyModalVisible(true);
                                        }}
                                    >
                                        <View style={[styles.thermoBackground]}> 
                                            <View style={[styles.thermoFill, {width: `${percentage}%`, backgroundColor: progressColor}]} />
                                        </View>
                                        <View style={styles.monthlyBudgetBoxContent}>
                                            <View style={styles.monthlyBudgetHeader}>
                                                <Text style={styles.conceptTitle}>{mb.concept}</Text>
                                            </View>
                                            <View style={styles.monthlyBudgetAmount}>
                                                <Text style={styles.spentAmount}>$ {mb.spent} / $ {mb.limit}</Text>
                                                <Text style={styles.percentageText}>{percentage}%</Text>
                                            </View>
                                            <Text style={styles.remainingText}>
                                                Disponible: $ {(parseFloat(mb.limit) - parseFloat(mb.spent)).toFixed(2)}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                                });
                            })()}
                        </View>
                    </ScrollView>

                    {/* Monthly Budget Modal */}
                    {monthlyModalVisible && (
                        <Modal
                            visible={monthlyModalVisible}
                            transparent={true}
                            animationType="fade"
                            onRequestClose={() => setMonthlyModalVisible(false)}
                        >
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContainer}>
                                    <Text style={styles.titleTag}>{editingMonthlyId ? 'Editar Presupuesto Mensual' : 'Nuevo Presupuesto Mensual'}</Text>
                                    
                                    <Text style={styles.modalInputLabel}>Categoría</Text>
                                    <TextInput
                                        placeholder="Ej: Alimentación"
                                        value={newMonthlyCategory}
                                        onChangeText={setNewMonthlyCategory}
                                        style={styles.modalInput}
                                    />
                                    
                                    <Text style={styles.modalInputLabel}>Límite mensual</Text>
                                    <TextInput
                                        placeholder="0.00"
                                        value={newMonthlyLimit}
                                        onChangeText={setNewMonthlyLimit}
                                        keyboardType="decimal-pad"
                                        style={styles.modalInput}
                                    />
                                    
                                    <Text style={styles.modalInputLabel}>Gastado hasta ahora (opcional)</Text>
                                    <TextInput
                                        placeholder="0.00"
                                        value={newMonthlySpent}
                                        onChangeText={setNewMonthlySpent}
                                        keyboardType="decimal-pad"
                                        style={styles.modalInput}
                                    />
                                    <View style={styles.modalButtonsRow}>
                                        <TouchableOpacity
                                            style={[styles.modalButton, {backgroundColor: '#0a57d9'}]}
                                            onPress={() => { handleSaveBudget(); }}
                                        >
                                            <Text style={styles.modalButtonText}>{editingMonthlyId ? 'Actualizar' : 'Guardar'}</Text>
                                        </TouchableOpacity>
                                        {editingMonthlyId && (
                                            <TouchableOpacity
                                                style={[styles.modalButton, {backgroundColor: '#d9534f'}]}
                                                onPress={() => { handleDeleteBudget(); }}
                                            >
                                                <Text style={styles.modalButtonText}>Eliminar</Text>
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity
                                            style={[styles.modalButton, {backgroundColor: '#999'}]}
                                            onPress={() => {
                                                setMonthlyModalVisible(false);
                                                setEditingMonthlyId(null);
                                            }}
                                        >
                                            <Text style={styles.modalButtonText}>Cancelar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    )}
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                        <TouchableOpacity 
                            style={styles.botonPresupuesto}
                            onPress={() => {
                                setNewMonthlyCategory('');
                                setNewMonthlyLimit('');
                                setNewMonthlySpent('0.00');
                                setEditingMonthlyId(null);
                                setMonthlyModalVisible(true);
                            }}
                        >
                            <Text style={styles.tituloBoton}> Crear Presupuesto </Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </View>
        <View style={styles.fondoInferior} />
        
    </ScrollView>
        
  
  );
}

//CAmbios
const styles = StyleSheet.create({
    containerMain: {
        flexGrow: 1,
        backgroundColor: '#f2f4f8',
        alignItems: "center",
        paddingBottom: 40, 
    },
    contenido: {
        width: "90%",
        marginTop: 80,
        marginBottom: 40,
    },
    fondoAzul: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: 250,
        backgroundColor: "#002359",
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,

        paddingTop: 30,
        paddingLeft: 20,
        
          
    },
    Atras: {
        color: "#0a57d9",
        fontSize: 16,
    },
    
    fondoInferior: {
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        height: 60,
        backgroundColor: "#002359",
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
    },
    
    dataContainer: {
        flex: 1,
        paddingHorizontal: 10,
        borderRadius: 10,
        padding: 20,
        
        alignItems: 'center',
        backgroundColor: '#ffffff',
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,

    },
    movimientosContainer: {
        width: '100%', 
        flexDirection: 'row',  
        alignItems: 'center',  
        padding: 10,
        justifyContent: 'space-between'
    },
    textDateContainer: {
        width: '100%', 
        flexDirection: 'row',  
        justifyContent:'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingBottom: 20,
    },
    textPresupuestoContainer: {
        paddingTop: 20,
        paddingBottom: 20,
        width: '100%', 
        flexDirection: 'row',  
        paddingHorizontal: 10,
    },
    presupuestoContainer: {
        width: '100%', 
        flexDirection: 'row',  
        alignItems: 'center',  
        padding: 10,
        justifyContent: 'space-between'
    },
    presupuestoBoton: {
        backgroundColor: '#0a57d9',
        borderRadius: 30,
        padding: 10,
        
        alignItems: 'center',
    },
    presupuestoBotonText: {
        fontSize: 10,
        fontWeight: '500',
        color: '#ffffff',
        alignItems: 'center',
    },
    presupuestoInput: {
        width: '80%',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        
    },
    tipoMovimientoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteText: {
        color: '#ffffff',
        fontWeight: '500',
        fontSize: 15,
    },
    deleteBoton: {
        backgroundColor: '#d9534f',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginLeft: 10,
    },
    movimientoDatoContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        
        
    },
    movimientoTag: {
        fontSize: 15,
        fontWeight: '500',
        alignItems: 'center',
    },
    movimientosScroll: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        borderColor: '#919191ff',
        borderWidth: 2,
    },
    movimientosBoton: {
        backgroundColor: '#0a57d9',
        borderRadius: 30,
        padding: 10,
        
        alignItems: 'center',
        
        
    },
    movimientosBotonText: {
        fontSize: 10,
        fontWeight: '500',
        color: '#ffffff',
        alignItems: 'center',
       
    },
    titleTag:{
        fontSize: 15,
        fontWeight: '500',

    },
    dateTag: {
        fontSize: 10,
    },
    tag: {
        fontSize: 10,
        alignItems: 'center',
        
    },
    movimientoFecha: {
        fontSize: 9,
        color: '#999',
        marginTop: 4,
        fontStyle: 'italic',
    },
    money: {
        fontSize: 15,
        fontWeight: '500',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 20,
    },
    titleMoney: {
        fontSize: 30,
        fontWeight: '700',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 20,
    },
    botonMovimientos: {
        backgroundColor: '#0a57d9',
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: 30,
    },
    botonPresupuesto: {
        backgroundColor: '#0a57d9',
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: 30,
        marginTop: 30,
    },
    tituloBoton: {
        fontSize: 15,
        fontWeight: '500',
        color: '#ffffff',
    },
    movimientosBotonActive: {
        backgroundColor: '#ff8c00',
    },
    monthlyBudgetScroll: {
        width: '100%',
        maxHeight: 400,
    },
    monthlyBudgetInfo: {
        fontSize: 12,
        color: '#666',
        marginBottom: 12,
        fontStyle: 'italic',
    },
    
    monthlyBudgetItem: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#0a57d9',
    },
    monthlyBudgetItemBox: {
        width: '90%',
        maxWidth: 320,
        minWidth: 180,
        height: 120,
        margin: 10,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#f2f4f8',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        position: 'relative',
    },
    thermoBackground: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        right: 0,
        backgroundColor: '#e0e0e0',
        borderRadius: 16,
        overflow: 'hidden',
    },
    thermoFill: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        borderRadius: 16,
    },
    monthlyBudgetBoxContent: {
        flex: 1,
        zIndex: 2,
        padding: 14,
        justifyContent: 'center',
    },
    monthlyBudgetHeader: {
        marginBottom: 4,
    },
    conceptTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    monthlyBudgetAmount: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    spentAmount: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
    percentageText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#0a57d9',
    },
    progressBarContainer: {
        width: '100%',
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    remainingText: {
        fontSize: 11,
        color: '#666',
        fontWeight: '500',
    },
    addMonthlyButton: {
        backgroundColor: '#0a57d9',
        borderRadius: 10,
        padding: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    addMonthlyButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
    },
    monthlyBudgetRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    monthlyBudgetScrollContent: {
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        paddingBottom: 30,
    },
    
    modalInputLabel: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
        marginTop: 10,
    },
    modalInputValue: {
        fontSize: 16,
        color: '#007bff',
        fontWeight: '500',
        marginBottom: 10,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        marginBottom: 15,
        backgroundColor: '#fff',
    },
    // Styles for movimiento detail buttons
    movimientoDetailButton: {
        backgroundColor: '#0a57d9',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    movimientoDetailButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    // Styles for delete confirmation in movimiento detail modal
    deleteConfirmationContainer: {
        backgroundColor: '#f8d7da',
        borderRadius: 8,
        padding: 15,
        marginTop: 10,
    },
    deleteConfirmationText: {
        color: '#721c24',
        fontSize: 14,
        marginBottom: 10,
    },
    deleteConfirmationButton: {
        backgroundColor: '#d9534f',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    deleteConfirmationButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    // Styles for close button in modals
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f2f2f2',
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    // General modal styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalContainer: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0a57d9',
        marginBottom: 15,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    modalButton: {
        backgroundColor: '#0a57d9',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginTop: 15,
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    // Specific styles for movimiento detail modal
    movimientoDetailContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    movimientoDetailLabel: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    movimientoDetailValue: {
        fontSize: 14,
        color: '#007bff',
        fontWeight: '600',
    },
    movimientoActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
    },
    movimientoActionButton: {
        flex: 1,
        marginHorizontal: 5,
    },
    movimientoActionText: {
        textAlign: 'center',
        fontWeight: '500',
    },
    movimientoDeleteButton: {
        backgroundColor: '#d9534f',
    },
    movimientoEditButton: {
        backgroundColor: '#007bff',
    },
    movimientoSaveButton: {
        backgroundColor: '#28a745',
    },
    movimientoCancelButton: {
        backgroundColor: '#6c757d',
    },
    movimientoFormGroup: {
        width: '100%',
        marginTop: 10,
    },
    movimientoFormLabel: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
    },
    movimientoFormInput: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
    },
    movimientoFormButton: {
        backgroundColor: '#0a57d9',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginTop: 15,
    },
    movimientoFormButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    movimientoDeleteConfirmation: {
        backgroundColor: '#f8d7da',
        borderRadius: 8,
        padding: 15,
        marginTop: 10,
    },
    movimientoDeleteConfirmationText: {
        color: '#721c24',
        fontSize: 14,
        marginBottom: 10,
    },
    movimientoDeleteConfirmationButton: {
        backgroundColor: '#d9534f',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    movimientoDeleteConfirmationButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    modalInfoSection: {
        width: '100%',
        marginVertical: 15,
    },
    orderOption: {
        width: '100%',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#f9f9f9',
        marginVertical: 2,
        borderRadius: 8,
    },
    orderOptionText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
});
