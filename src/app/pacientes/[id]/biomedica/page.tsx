"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";

const HN_OPCOES = ["I", "II", "IIa", "III", "IIIa", "IIIv", "IV", "IVa", "V", "Va", "VI", "VII"];
const LUDWIG_OPCOES = ["Grau I", "Grau II", "Grau III"];
const OLSEN_OPCOES = ["Leve", "Moderada", "Severa"];
const FITZPATRICK_OPCOES = ["I", "II", "III", "IV", "V", "VI"];
const OSTIOS_OPCOES = ["Normais", "Black dots", "White dots", "Yellow dots"];
const EPIDERME_OPCOES = ["Normal", "Descamação", "Eritema"];
const AREAS_AFETADAS_OPCOES = ["Frontal", "Temporal D", "Temporal E", "Vértice", "Occipital", "Difusa", "Localizada"];
const TRILHA_OPCOES = ["AGA Masculina", "AGA Feminina", "Eflúvio Telógeno", "Alopecia Seborreica", "Personalizado"];
const CONTRAINDICACOES_OPCOES = [
  "Gestação", "Amamentação", "Isotretinoína", "Infecção ativa",
  "Coagulopatia grave", "Alergia anestésicos", "Câncer ativo", "Epilepsia (LED)",
];

export default function BiomedicaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [secaoAberta, setSecaoAberta] = useState<string>("identidade");

  // Identity
  const [identidadeConfirmada, setIdentidadeConfirmada] = useState(false);

  // Anamnese
  const [evolucao, setEvolucao] = useState("");
  const [sono, setSono] = useState("");
  const [alimentacao, setAlimentacao] = useState("");
  const [atividadeFisica, setAtividadeFisica] = useState("");
  const [aguaDia, setAguaDia] = useState("");

  // Exam classifications
  const [classificacaoHN, setClassificacaoHN] = useState("");
  const [classificacaoLudwig, setClassificacaoLudwig] = useState("");
  const [classificacaoOlsen, setClassificacaoOlsen] = useState("");
  const [classificacaoFitzpatrick, setClassificacaoFitzpatrick] = useState("");

  // Tests
  const [pullTest, setPullTest] = useState("");
  const [cardTest, setCardTest] = useState("");
  const [tugTest, setTugTest] = useState("");
  const [washTest, setWashTest] = useState("");

  // Trichoscopy
  const [tricoMiniaturizacao, setTricoMiniaturizacao] = useState("");
  const [tricoMiniRegioes, setTricoMiniRegioes] = useState<string[]>([]);
  const [tricoAnomalias, setTricoAnomalias] = useState("");
  const [tricoOstios, setTricoOstios] = useState<string[]>([]);
  const [tricoEpiderme, setTricoEpiderme] = useState<string[]>([]);
  const [tricoAreasAfetadas, setTricoAreasAfetadas] = useState<string[]>([]);

  // Hair analysis
  const [densidade, setDensidade] = useState("");
  const [elasticidade, setElasticidade] = useState("");
  const [textura, setTextura] = useState("");
  const [porosidade, setPorosidade] = useState("");
  const [curvatura, setCurvatura] = useState("");
  const [diametro, setDiametro] = useState("");
  const [tipoClassificacao, setTipoClassificacao] = useState("");
  const [corNatural, setCorNatural] = useState("");

  // Pain scale
  const [escalaDorPre, setEscalaDorPre] = useState<number | null>(null);
  const [toleranciaDor, setToleranciaDor] = useState("");

  // Contraindications
  const [contraindicacoes, setContraindicacoes] = useState<string[]>([]);

  // Treatment path
  const [trilha, setTrilha] = useState("");

  // TCLE
  const [informadoProcedimento, setInformadoProcedimento] = useState(false);
  const [informadoEfeitos, setInformadoEfeitos] = useState(false);
  const [informadoContraind, setInformadoContraind] = useState(false);
  const [declarouAlergias, setDeclarouAlergias] = useState(false);
  const [autorizouFotos, setAutorizouFotos] = useState(false);
  const [recebeuHomeCare, setRecebeuHomeCare] = useState(false);
  const [tcleAssinado, setTcleAssinado] = useState(false);

  // Observations
  const [observacoes, setObservacoes] = useState("");

  function toggleChip(arr: string[], setArr: (v: string[]) => void, val: string) {
    if (arr.includes(val)) setArr(arr.filter((v) => v !== val));
    else setArr([...arr, val]);
  }

  function selectSingle(setter: (v: string) => void, val: string, current: string) {
    setter(current === val ? "" : val);
  }

  function toggleContraindicacao(val: string) {
    if (contraindicacoes.includes(val)) {
      setContraindicacoes(contraindicacoes.filter((c) => c !== val));
    } else {
      setContraindicacoes([...contraindicacoes, val]);
    }
  }

  function dorColor(n: number): string {
    if (n <= 2) return "bg-green-500 text-white";
    if (n <= 4) return "bg-yellow-400 text-white";
    if (n <= 6) return "bg-orange-500 text-white";
    return "bg-red-500 text-white";
  }

  async function handleSubmit() {
    setLoading(true);

    const payload = {
      pacienteId: parseInt(id),
      identidadeConfirmada,
      evolucao,
      sono,
      alimentacao,
      atividadeFisica,
      aguaDia,
      classificacaoHN,
      classificacaoLudwig,
      classificacaoOlsen,
      classificacaoFitzpatrick,
      pullTest,
      cardTest,
      tugTest,
      washTest,
      tricoMiniaturizacao: {
        presente: tricoMiniaturizacao,
        regioes: tricoMiniRegioes,
      },
      tricoAnomalias,
      tricoOstios,
      tricoEpiderme,
      tricoAreasAfetadas,
      densidade,
      elasticidade,
      textura,
      porosidade,
      curvatura,
      diametro,
      tipoClassificacao,
      corNatural,
      escalaDorPre,
      toleranciaDor,
      contraindicacoes,
      observacoes,
      tcle: {
        informadoProcedimento,
        informadoEfeitos,
        informadoContraind,
        declarouAlergias,
        autorizouFotos,
        recebeuHomeCare,
        assinado: tcleAssinado,
      },
      planoTerapeutico: {
        trilha,
        diagnosticoPrincipal: trilha,
      },
    };

    const res = await fetch("/api/biomedica", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push(`/pacientes/${id}`);
    } else {
      alert("Erro ao salvar avaliação biomédica");
    }
    setLoading(false);
  }

  function Secao({
    id: secId,
    titulo,
    children,
  }: {
    id: string;
    titulo: string;
    children: React.ReactNode;
  }) {
    const aberta = secaoAberta === secId;
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setSecaoAberta(aberta ? "" : secId)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <h2 className="text-lg font-semibold text-gray-900">{titulo}</h2>
          {aberta ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {aberta && <div className="px-4 pb-4 space-y-4">{children}</div>}
      </div>
    );
  }

  function ChipGroup({
    opcoes,
    selecionados,
    onChange,
    multi = true,
  }: {
    opcoes: string[];
    selecionados: string | string[];
    onChange: (val: string) => void;
    multi?: boolean;
  }) {
    const sel = Array.isArray(selecionados) ? selecionados : [selecionados];
    return (
      <div className="flex flex-wrap gap-2">
        {opcoes.map((op) => (
          <button
            key={op}
            type="button"
            onClick={() => onChange(op)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              sel.includes(op)
                ? "bg-teal-600 text-white border-teal-600"
                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
            }`}
          >
            {op}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/pacientes/${id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">M4 — Biomédica 1a consulta</h1>
          <p className="text-sm text-gray-500">Avaliação biomédica completa</p>
        </div>
      </div>

      {/* Identidade */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={identidadeConfirmada}
            onChange={(e) => setIdentidadeConfirmada(e.target.checked)}
            className="h-4 w-4 text-teal-600 rounded"
          />
          <span className="text-sm font-medium text-gray-900">
            Identidade confirmada por verbalização do paciente (POP-ASS-001)
          </span>
        </label>
      </div>

      {/* Anamnese */}
      <Secao id="anamnese" titulo="Anamnese">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Evolução:</p>
          <ChipGroup
            opcoes={["Piorando", "Estável", "Melhorando"]}
            selecionados={evolucao}
            onChange={(v) => selectSingle(setEvolucao, v, evolucao)}
            multi={false}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Sono:</p>
          <ChipGroup
            opcoes={["Bom", "Regular", "Ruim"]}
            selecionados={sono}
            onChange={(v) => selectSingle(setSono, v, sono)}
            multi={false}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Alimentação:</p>
          <ChipGroup
            opcoes={["Equilibrada", "Restritiva", "Irregular"]}
            selecionados={alimentacao}
            onChange={(v) => selectSingle(setAlimentacao, v, alimentacao)}
            multi={false}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Atividade Física:</p>
          <ChipGroup
            opcoes={["Sim", "Não", "Às vezes"]}
            selecionados={atividadeFisica}
            onChange={(v) => selectSingle(setAtividadeFisica, v, atividadeFisica)}
            multi={false}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Água/dia:</p>
          <ChipGroup
            opcoes={["<1L", "1-2L", ">2L"]}
            selecionados={aguaDia}
            onChange={(v) => selectSingle(setAguaDia, v, aguaDia)}
            multi={false}
          />
        </div>
      </Secao>

      {/* Exame Clínico - Classificações */}
      <Secao id="exame" titulo="Exame Clínico - Classificações">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Hamilton-Norwood (masculino):</p>
          <ChipGroup
            opcoes={HN_OPCOES}
            selecionados={classificacaoHN}
            onChange={(v) => selectSingle(setClassificacaoHN, v, classificacaoHN)}
            multi={false}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Ludwig (feminino):</p>
          <ChipGroup
            opcoes={LUDWIG_OPCOES}
            selecionados={classificacaoLudwig}
            onChange={(v) => selectSingle(setClassificacaoLudwig, v, classificacaoLudwig)}
            multi={false}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Olsen (feminino):</p>
          <ChipGroup
            opcoes={OLSEN_OPCOES}
            selecionados={classificacaoOlsen}
            onChange={(v) => selectSingle(setClassificacaoOlsen, v, classificacaoOlsen)}
            multi={false}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Fitzpatrick (fototipo):</p>
          <ChipGroup
            opcoes={FITZPATRICK_OPCOES}
            selecionados={classificacaoFitzpatrick}
            onChange={(v) => selectSingle(setClassificacaoFitzpatrick, v, classificacaoFitzpatrick)}
            multi={false}
          />
        </div>
      </Secao>

      {/* Testes */}
      <Secao id="testes" titulo="Testes Clínicos">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Pull Test:</p>
          <ChipGroup
            opcoes={["Positivo (>6 fios)", "Negativo"]}
            selecionados={pullTest}
            onChange={(v) => selectSingle(setPullTest, v, pullTest)}
            multi={false}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Card Test:</p>
          <ChipGroup
            opcoes={["Positivo", "Negativo"]}
            selecionados={cardTest}
            onChange={(v) => selectSingle(setCardTest, v, cardTest)}
            multi={false}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Tug Test:</p>
          <ChipGroup
            opcoes={["Positivo", "Negativo"]}
            selecionados={tugTest}
            onChange={(v) => selectSingle(setTugTest, v, tugTest)}
            multi={false}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Wash Test (contagem de fios):</label>
          <input
            type="text"
            value={washTest}
            onChange={(e) => setWashTest(e.target.value)}
            placeholder="Ex: 85 fios"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          />
        </div>
      </Secao>

      {/* Tricoscopia */}
      <Secao id="tricoscopia" titulo="Tricoscopia">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Miniaturização:</p>
          <ChipGroup
            opcoes={["Sim", "Não"]}
            selecionados={tricoMiniaturizacao}
            onChange={(v) => selectSingle(setTricoMiniaturizacao, v, tricoMiniaturizacao)}
            multi={false}
          />
          {tricoMiniaturizacao === "Sim" && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 mb-1">Regiões afetadas:</p>
              <ChipGroup
                opcoes={AREAS_AFETADAS_OPCOES}
                selecionados={tricoMiniRegioes}
                onChange={(v) => toggleChip(tricoMiniRegioes, setTricoMiniRegioes, v)}
              />
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Anomalias da haste:</label>
          <input
            type="text"
            value={tricoAnomalias}
            onChange={(e) => setTricoAnomalias(e.target.value)}
            placeholder="Descreva anomalias observadas"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Óstios:</p>
          <ChipGroup
            opcoes={OSTIOS_OPCOES}
            selecionados={tricoOstios}
            onChange={(v) => toggleChip(tricoOstios, setTricoOstios, v)}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Epiderme:</p>
          <ChipGroup
            opcoes={EPIDERME_OPCOES}
            selecionados={tricoEpiderme}
            onChange={(v) => toggleChip(tricoEpiderme, setTricoEpiderme, v)}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Áreas afetadas:</p>
          <ChipGroup
            opcoes={AREAS_AFETADAS_OPCOES}
            selecionados={tricoAreasAfetadas}
            onChange={(v) => toggleChip(tricoAreasAfetadas, setTricoAreasAfetadas, v)}
          />
        </div>
      </Secao>

      {/* Análise Capilar */}
      <Secao id="analise" titulo="Análise Capilar">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Densidade:</p>
          <ChipGroup
            opcoes={["Normal", "Rarefação leve", "Moderada", "Severa"]}
            selecionados={densidade}
            onChange={(v) => selectSingle(setDensidade, v, densidade)}
            multi={false}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Elasticidade:</p>
          <ChipGroup
            opcoes={["Normal", "Reduzida", "Aumentada"]}
            selecionados={elasticidade}
            onChange={(v) => selectSingle(setElasticidade, v, elasticidade)}
            multi={false}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Textura:</p>
          <ChipGroup
            opcoes={["Lisa", "Ondulada", "Cacheada", "Crespa"]}
            selecionados={textura}
            onChange={(v) => selectSingle(setTextura, v, textura)}
            multi={false}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Porosidade:</p>
          <ChipGroup
            opcoes={["Baixa", "Normal", "Alta"]}
            selecionados={porosidade}
            onChange={(v) => selectSingle(setPorosidade, v, porosidade)}
            multi={false}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Curvatura:</label>
          <input
            type="text"
            value={curvatura}
            onChange={(e) => setCurvatura(e.target.value)}
            placeholder="Descreva a curvatura"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Diâmetro:</p>
          <ChipGroup
            opcoes={["Fino", "Médio", "Grosso", "Misto"]}
            selecionados={diametro}
            onChange={(v) => selectSingle(setDiametro, v, diametro)}
            multi={false}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo (1A-4C):</label>
          <input
            type="text"
            value={tipoClassificacao}
            onChange={(e) => setTipoClassificacao(e.target.value)}
            placeholder="Ex: 2B"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cor natural:</label>
          <input
            type="text"
            value={corNatural}
            onChange={(e) => setCorNatural(e.target.value)}
            placeholder="Ex: Castanho escuro"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          />
        </div>
      </Secao>

      {/* Escala de Dor */}
      <Secao id="dor" titulo="Escala de Dor (Pré-procedimento)">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Nível de dor (0-10):</p>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 11 }, (_, i) => i).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setEscalaDorPre(escalaDorPre === n ? null : n)}
                className={`w-10 h-10 rounded-full text-sm font-medium border transition-colors ${
                  escalaDorPre === n
                    ? dorColor(n)
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Tolerância à dor:</p>
          <ChipGroup
            opcoes={["Alta", "Média", "Baixa"]}
            selecionados={toleranciaDor}
            onChange={(v) => selectSingle(setToleranciaDor, v, toleranciaDor)}
            multi={false}
          />
        </div>
      </Secao>

      {/* Contraindicações */}
      <Secao id="contraindicacoes" titulo="Contraindicações">
        <div className="space-y-2">
          {CONTRAINDICACOES_OPCOES.map((c) => (
            <label key={c} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={contraindicacoes.includes(c)}
                onChange={() => toggleContraindicacao(c)}
                className="h-4 w-4 text-teal-600 rounded"
              />
              <span className="text-sm text-gray-700">{c}</span>
            </label>
          ))}
        </div>
        {contraindicacoes.length > 0 && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-sm text-red-800">
            Atenção: {contraindicacoes.length} contraindicação(ões) identificada(s). Avaliar
            possibilidade de prosseguir com o tratamento.
          </div>
        )}
      </Secao>

      {/* Trilha de Tratamento */}
      <Secao id="trilha" titulo="Trilha de Tratamento">
        <ChipGroup
          opcoes={TRILHA_OPCOES}
          selecionados={trilha}
          onChange={(v) => selectSingle(setTrilha, v, trilha)}
          multi={false}
        />
      </Secao>

      {/* TCLE */}
      <Secao id="tcle" titulo="TCLE — Termo de Consentimento">
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={informadoProcedimento}
              onChange={(e) => setInformadoProcedimento(e.target.checked)}
              className="h-4 w-4 text-teal-600 rounded"
            />
            <span className="text-sm text-gray-700">
              Paciente informado sobre o procedimento
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={informadoEfeitos}
              onChange={(e) => setInformadoEfeitos(e.target.checked)}
              className="h-4 w-4 text-teal-600 rounded"
            />
            <span className="text-sm text-gray-700">
              Paciente informado sobre possíveis efeitos colaterais
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={informadoContraind}
              onChange={(e) => setInformadoContraind(e.target.checked)}
              className="h-4 w-4 text-teal-600 rounded"
            />
            <span className="text-sm text-gray-700">
              Paciente informado sobre contraindicações
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={declarouAlergias}
              onChange={(e) => setDeclarouAlergias(e.target.checked)}
              className="h-4 w-4 text-teal-600 rounded"
            />
            <span className="text-sm text-gray-700">
              Paciente declarou alergias
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={autorizouFotos}
              onChange={(e) => setAutorizouFotos(e.target.checked)}
              className="h-4 w-4 text-teal-600 rounded"
            />
            <span className="text-sm text-gray-700">
              Paciente autorizou registro fotográfico
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={recebeuHomeCare}
              onChange={(e) => setRecebeuHomeCare(e.target.checked)}
              className="h-4 w-4 text-teal-600 rounded"
            />
            <span className="text-sm text-gray-700">
              Paciente recebeu orientações de home care
            </span>
          </label>
          <hr className="border-gray-200" />
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={tcleAssinado}
              onChange={(e) => setTcleAssinado(e.target.checked)}
              className="h-4 w-4 text-teal-600 rounded"
            />
            <span className="text-sm font-semibold text-gray-900">
              TCLE assinado pelo paciente
            </span>
          </label>
        </div>
      </Secao>

      {/* Observações */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Observações gerais</label>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          placeholder="Observações adicionais..."
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
      >
        {loading ? "Salvando..." : "Salvar Avaliação Biomédica"}
      </button>

      <div className="h-8" />
    </div>
  );
}
