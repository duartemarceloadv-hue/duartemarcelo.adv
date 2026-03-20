"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ContratoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [tipo, setTipo] = useState("Protocolo Terapêutico Capilar");
  const [numContrato, setNumContrato] = useState("");
  const [pacote, setPacote] = useState("");
  const [valor, setValor] = useState("");
  const [desconto, setDesconto] = useState("");
  const [numSessoes, setNumSessoes] = useState("12");
  const [prazoMax, setPrazoMax] = useState("");
  const [formaPgto, setFormaPgto] = useState("");
  const [parcelas, setParcelas] = useState("1");
  const [kitTipo, setKitTipo] = useState("");
  const [kitEntrega, setKitEntrega] = useState("");
  const [assinado, setAssinado] = useState(false);

  const FORMAS_PGTO = ["PIX", "Dinheiro", "Cartão crédito", "Cartão débito", "Boleto", "Recorrência", "Sorocred", "Crediário"];

  async function handleSubmit() {
    if (!valor || !formaPgto) {
      alert("Valor e forma de pagamento são obrigatórios");
      return;
    }
    setLoading(true);

    const payload = {
      pacienteId: parseInt(id),
      tipo,
      numContrato,
      pacote,
      valor,
      desconto,
      numSessoes,
      prazoMaxMeses: prazoMax,
      formaPagamento: formaPgto,
      parcelas,
      kitHomeCare: kitTipo ? { tipo: kitTipo, entrega: kitEntrega } : null,
      assinado,
    };

    const res = await fetch("/api/contrato", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push(`/pacientes/${id}`);
    } else {
      alert("Erro ao salvar contrato");
    }
    setLoading(false);
  }

  const valorNum = parseFloat(valor) || 0;
  const descontoNum = parseFloat(desconto) || 0;
  const valorFinal = valorNum - descontoNum;
  const numParcelas = parseInt(parcelas) || 1;
  const valorParcela = numParcelas > 0 ? valorFinal / numParcelas : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/pacientes/${id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">M3 — Contrato</h1>
          <p className="text-sm text-gray-500">Preenchido pela recepcionista</p>
        </div>
      </div>

      {/* Tipo de contrato */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Dados do Contrato</h2>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Tipo:</p>
          <div className="flex gap-2">
            {["Protocolo Terapêutico Capilar", "Protocolo de Manutenção"].map((t) => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  tipo === t ? "bg-teal-600 text-white border-teal-600" : "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nº contrato</label>
            <input value={numContrato} onChange={(e) => setNumContrato(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pacote</label>
            <input value={pacote} onChange={(e) => setPacote(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor R$ *</label>
            <input type="number" value={valor} onChange={(e) => setValor(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desconto R$</label>
            <input type="number" value={desconto} onChange={(e) => setDesconto(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nº sessões</label>
            <input type="number" value={numSessoes} onChange={(e) => setNumSessoes(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prazo máximo (meses)</label>
            <input type="number" value={prazoMax} onChange={(e) => setPrazoMax(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>

        {valorFinal > 0 && (
          <div className="bg-teal-50 rounded-lg p-3 text-sm text-teal-800">
            Valor final: <strong>R$ {valorFinal.toFixed(2)}</strong>
            {numParcelas > 1 && <> | {numParcelas}x de <strong>R$ {valorParcela.toFixed(2)}</strong></>}
          </div>
        )}
      </div>

      {/* Pagamento */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Forma de Pagamento</h2>
        <div className="flex flex-wrap gap-2">
          {FORMAS_PGTO.map((f) => (
            <button
              key={f}
              onClick={() => setFormaPgto(f)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                formaPgto === f ? "bg-teal-600 text-white border-teal-600" : "bg-gray-50 text-gray-700 border-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nº parcelas</label>
          <input type="number" value={parcelas} onChange={(e) => setParcelas(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" min="1" />
        </div>
      </div>

      {/* Kit home care */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Kit Home Care</h2>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Tipo:</p>
          <div className="flex gap-2">
            {["Essencial (Shampoo+Loção Dia+Noite)", "Basic (Loção Dia+Noite)", "Não incluso"].map((k) => (
              <button
                key={k}
                onClick={() => setKitTipo(k)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  kitTipo === k ? "bg-teal-600 text-white border-teal-600" : "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Entrega:</p>
          <div className="flex gap-2">
            {["Entregue na compra", "Entregar na 1ª sessão"].map((e) => (
              <button
                key={e}
                onClick={() => setKitEntrega(e)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  kitEntrega === e ? "bg-teal-600 text-white border-teal-600" : "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assinatura */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={assinado} onChange={(e) => setAssinado(e.target.checked)} className="h-4 w-4 text-teal-600 rounded" />
          <span className="text-sm font-medium text-gray-900">Contrato assinado pelo paciente</span>
        </label>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
      >
        {loading ? "Salvando..." : "Salvar Contrato"}
      </button>
      <div className="h-8" />
    </div>
  );
}
