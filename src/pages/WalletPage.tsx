import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { billeteraApi, type TransaccionLedgerDTO } from '../API/billeteraApi';
import { ApiError } from '../API/httpClient';
import { Wallet, ArrowDownRight, Lock, DollarSign, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const WalletPage: React.FC = () => {
  const { usuarioActual, saldos, actualizarSaldos } = useAuth();

  const [monto, setMonto] = useState<string>('');
  const [cargandoDeposito, setCargandoDeposito] = useState<boolean>(false);
  const [errorDeposito, setErrorDeposito] = useState<string | null>(null);
  const [exitoDeposito, setExitoDeposito] = useState<string | null>(null);

  // Transacciones Ledger
  const [transacciones, setTransacciones] = useState<TransaccionLedgerDTO[]>([]);
  const [pagina, setPagina] = useState<number>(1);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);
  const [tienePrevia, setTienePrevia] = useState<boolean>(false);
  const [tieneSiguiente, setTieneSiguiente] = useState<boolean>(false);
  const [cargandoTabla, setCargandoTabla] = useState<boolean>(true);

  const cargarHistorial = async (p: number) => {
    if (!usuarioActual) return;
    setCargandoTabla(true);
    try {
      const res = await billeteraApi.obtenerTransacciones(usuarioActual.id, p, 8);
      setTransacciones(res.items);
      setPagina(res.pagina);
      setTotalPaginas(res.totalPaginas);
      setTienePrevia(res.tienePaginaPrevia);
      setTieneSiguiente(res.tienePaginaSiguiente);
    } catch {
      // Manejo de error si falla la carga
    } finally {
      setCargandoTabla(false);
    }
  };

  useEffect(() => {
    cargarHistorial(pagina);
  }, [usuarioActual?.id, pagina]);

  const handleDepositar = async (montoIngresado: number) => {
    if (!usuarioActual || montoIngresado <= 0) return;
    setErrorDeposito(null);
    setExitoDeposito(null);
    setCargandoDeposito(true);

    try {
      await billeteraApi.depositar(usuarioActual.id, montoIngresado);
      setExitoDeposito(`¡Se acreditaron $ ${montoIngresado.toLocaleString('es-AR')} con éxito!`);
      setMonto('');
      await actualizarSaldos();
      await cargarHistorial(1);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorDeposito(err.message);
      } else {
        setErrorDeposito('Error al procesar el depósito.');
      }
    } finally {
      setCargandoDeposito(false);
    }
  };

  const getTipoBadge = (tipo: TransaccionLedgerDTO['tipo']) => {
    switch (tipo) {
      case 'DEPOSITO':
      case 'LIBERACION_OFERTA':
      case 'COBRO':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'RETENCION_OFERTA':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'PAGO':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Wallet className="w-7 h-7 text-emerald-400" /> Billetera Virtual
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Gestión de fondos, garantía Escrow y registro contable de transacciones.
        </p>
      </div>

      {/* 3 Tarjetas de Resumen Financiero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Saldo Disponible
            </span>
            <span className="text-2xl font-mono font-bold text-emerald-400">
              $ {saldos ? saldos.saldoDisponible.toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '0,00'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pr-8">
            Fondos libres para realizar nuevas pujas.
          </p>
          <DollarSign className="absolute right-3 bottom-3 w-8 h-8 text-emerald-500/15 pointer-events-none" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Saldo Retenido (Garantía Escrow)
            </span>
            <span className="text-2xl font-mono font-bold text-amber-400">
              $ {saldos ? saldos.saldoRetenido.toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '0,00'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pr-8">
            Bloqueado en subastas donde liderás la oferta.
          </p>
          <Lock className="absolute right-3 bottom-3 w-8 h-8 text-amber-500/15 pointer-events-none" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Saldo Total Contable
            </span>
            <span className="text-2xl font-mono font-bold text-blue-400">
              $ {saldos ? saldos.saldoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '0,00'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pr-8">
            Suma total de fondos disponibles y retenidos.
          </p>
          <ArrowDownRight className="absolute right-3 bottom-3 w-8 h-8 text-blue-500/15 pointer-events-none" />
        </div>
      </div>

      {/* Formulario de Carga de Fondos */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Acreditar Saldo Simulado</h2>

        {exitoDeposito && (
          <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-3 rounded-lg text-sm mb-4">
            {exitoDeposito}
          </div>
        )}

        {errorDeposito && (
          <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-3 rounded-lg text-sm mb-4">
            {errorDeposito}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3.5 top-2.5 text-slate-500 font-mono">$</span>
            <input
              type="number"
              min="1"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="Ingresá un monto a acreditar"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-white focus:outline-none focus:border-amber-500 font-mono text-sm"
            />
          </div>

          <button
            onClick={() => handleDepositar(Number(monto))}
            disabled={cargandoDeposito || !monto || Number(monto) <= 0}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-lg transition whitespace-nowrap"
          >
            {cargandoDeposito ? 'Acreditando...' : 'Acreditar Fondos'}
          </button>
        </div>

        {/* Chips de montos rápidos */}
        <div className="flex flex-wrap gap-2 mt-4">
          {[10000, 50000, 100000].map((val) => (
            <button
              key={val}
              onClick={() => handleDepositar(val)}
              disabled={cargandoDeposito}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-300 rounded-md transition"
            >
              +$ {val.toLocaleString('es-AR')}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla del Ledger Contable */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Historial de Transacciones (Ledger)</h2>

        {cargandoTabla ? (
          <p className="text-sm text-slate-400 py-8 text-center">Cargando movimientos contables...</p>
        ) : transacciones.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">No hay movimientos registrados aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/50 text-slate-400 font-medium border-b border-slate-800">
                <tr>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Monto</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Referencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {transacciones.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-3">
                      <span className={`px-2.5 py-1 text-[11px] font-semibold border rounded-full ${getTipoBadge(tx.tipo)}`}>
                        {tx.tipo}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-medium text-white">
                      $ {tx.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-slate-400 text-xs">
                      {new Date(tx.fecha).toLocaleString('es-AR')}
                    </td>
                    <td className="p-3 text-xs">
                      {tx.subastaId ? (
                        <Link
                          to={`/subastas/${tx.subastaId}`}
                          className="text-amber-400 hover:underline flex items-center gap-1"
                        >
                          Subasta #{tx.subastaId} <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800 text-xs">
            <button
              onClick={() => setPagina((p) => p - 1)}
              disabled={!tienePrevia || cargandoTabla}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <span className="text-slate-400 font-mono">
              Página {pagina} de {totalPaginas}
            </span>
            <button
              onClick={() => setPagina((p) => p + 1)}
              disabled={!tieneSiguiente || cargandoTabla}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded text-slate-300"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};