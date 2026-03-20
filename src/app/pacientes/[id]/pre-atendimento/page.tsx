"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";

// Opções de chips
const QUEIXAS_OPCOES = [
  "Queda de cabelo", "Afinamento dos fios", "Falhas/rarefação", "Caspa/descamação",
  "Coceira no couro", "Oleosidade excessiva", "Cabelo quebradiço", "Calvície avançada",
  "Entradas (recuo frontal)", "Couro sensível",
];

const TEMPO_QUEIXA_OPCOES = ["< 3 meses", "3-6 meses", "6m-1 ano", "1-3 anos", "> 3 anos"];

const CONDICOES_COURO_OPCOES = [
  "Coceira", "Caspa", "Inflamação", "Oleosidade", "Ferida", "Seco/ressecado",
  "Queda visível (ralos)", "Progressiva/alisamento", "Quebradiço", "Sensibilidade",
  "Química", "Nenhuma",
];

const TRAT_ANTERIORES_OPCOES = [
  "Minoxidil (tópico)", "Finasterida/Dutasterida (oral)", "Shampoo anticaspa/antiqueda",
  "Vitaminas/suplementos", "PRP (plasma)", "Mesoterapia", "Laser", "Transplante capilar",
  "Trat. dermatológico", "Trat. caseiro/natural", "Nenhum",
];

const CONDICOES_SAUDE_OPCOES = [
  "Hipertensão", "Diabetes", "Cardíaco", "Tireoide (hipo/hiper)", "Autoimune",
  "Epilepsia", "Depressão/Ansiedade", "Anemia", "Coagulopatia", "SOP", "Câncer",
  "Dermatológica", "Arritmia cardíaca", "Dislipidemia", "Doença renal/hepática/GI",
  "Doença neurológica", "Distúrbios circulatórios", "Nenhuma",
];

const MEDICAMENTOS_OPCOES = [
  "Anti-hipertensivos", "Antidiabéticos", "Anticoncepcional", "Antidepressivos",
  "Ansiolíticos", "Corticoides", "Anticoagulantes", "Isotretinoína (Roacutan)",
  "Finasterida/Dutasterida", "Minoxidil oral", "Reposição hormonal",
  "Suplementos/vitaminas", "Nenhum",
];

const ALERGIAS_OPCOES = [
  "Látex", "Anestésicos locais (lidocaína)", "Vitaminas injetáveis", "Antibióticos",
  "Dipirona/AINEs", "Cosméticos", "Nenhuma",
];

const SHAMPOO_OPCOES = [
  "Clear Men", "Head & Shoulders", "Anticaspa genérico", "Antiqueda genérico",
  "Manipulado", "Comum (sem finalidade)", "Cetoconazol", "Tricofort",
];

export default function PreAtendimentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [secaoAberta, setSecaoAberta] = useState<string>("queixa");

  // State para todos os campos
  const [queixas, setQueixas] = useState<string[]>([]);
  const [queixaOutro, setQueixaOutro] = useState("");
  const [tempoQueixa, setTempoQueixa] = useState("");

  // Queda e volume
  const [quedaAcentuada, setQuedaAcentuada] = useState("");
  const [quedaTempo, setQuedaTempo] = useState("");
  const [melhoraPiora, setMelhoraPiora] = useState("");
  const [fiosNovos, setFiosNovos] = useState("");
  const [perdaVolume, setPerdaVolume] = useState("");
  const [peloOutrasAreas, setPeloOutrasAreas] = useState("");
  const [eventoMarcante, setEventoMarcante] = useState("");

  // Afinamento
  const [afinamento, setAfinamento] = useState("");
  const [afinamentoTempo, setAfinamentoTempo] = useState("");

  // Sinais e sintomas
  const [coceira, setCoceira] = useState("");
  const [dor, setDor] = useState("");
  const [ardencia, setArdencia] = useState("");
  const [sensibilidade, setSensibilidade] = useState("");
  const [caspa, setCaspa] = useState("");
  const [feridas, setFeridas] = useState("");
  const [vermelhidao, setVermelhidao] = useState("");

  // Oleosidade
  const [oleosidade, setOleosidade] = useState("");

  // Condições do couro
  const [condicoesCouro, setCondicoesCouro] = useState<string[]>([]);

  // Tratamentos anteriores
  const [tratAnteriores, setTratAnteriores] = useState<string[]>([]);
  const [orientadoProfissional, setOrientadoProfissional] = useState("");
  const [obteveResultado, setObteveResultado] = useState("");
  const [transplante, setTransplante] = useState("");

  // Histórico familiar
  const [histFamiliar, setHistFamiliar] = useState("");
  const [predisposicao, setPredisposicao] = useState("");

  // Expectativas
  const [expectativa, setExpectativa] = useState("");
  const [expectativaTexto, setExpectativaTexto] = useState("");
  const [disponibilidade, setDisponibilidade] = useState<string[]>([]);

  // Higiene
  const [shampoo, setShampoo] = useState<string[]>([]);
  const [freqLavagem, setFreqLavagem] = useState("");
  const [tempAgua, setTempAgua] = useState("");
  const [secagem, setSecagem] = useState("");
  const [tempoAgua, setTempoAgua] = useState("");
  const [bone, setBone] = useState("");
  const [tinta, setTinta] = useState("");
  const [arrancaCabelo, setArrancaCabelo] = useState("");

  // Cuidados capilares adicionais
  const [secadorChapinha, setSecadorChapinha] = useState("");
  const [alisamentos, setAlisamentos] = useState("");
  const [penteadosTracao, setPenteadosTracao] = useState("");

  // Saúde
  const [condicoesSaude, setCondicoesSaude] = useState<string[]>([]);
  const [queloides, setQueloides] = useState("");
  const [intestino, setIntestino] = useState("");
  const [cirurgias, setCirurgias] = useState("");
  const [cirurgiaRecente, setCirurgiaRecente] = useState("");

  // Medicamentos e Alergias
  const [medicamentos, setMedicamentos] = useState<string[]>([]);
  const [alergias, setAlergias] = useState<string[]>([]);

  // Hábitos
  const [tabagismo, setTabagismo] = useState("");
  const [etilismo, setEtilismo] = useState("");
  const [estresse, setEstresse] = useState("");
  const [ansiedade, setAnsiedade] = useState("");
  const [horasSono, setHorasSono] = useState("");
  const [cansado, setCansado] = useState("");
  const [problemaSono, setProblemaSono] = useState("");
  const [tratPsico, setTratPsico] = useState("");
  const [atividadeFisica, setAtividadeFisica] = useState("");
  const [proteinas, setProteinas] = useState("");
  const [frutas, setFrutas] = useState("");
  const [refrigerante, setRefrigerante] = useState("");
  const [agua, setAgua] = useState("");
  const [protetorSolar, setProtetorSolar] = useState("");

  // Reprodutivo
  const [planejaFilhos, setPlanejaFilhos] = useState("");
  const [gestante, setGestante] = useState("");
  const [cicloMenstrual, setCicloMenstrual] = useState("");
  const [fluxoMenstrual, setFluxoMenstrual] = useState("");
  const [anticoncepcional, setAnticoncepcional] = useState("");

  // LGPD
  const [lgpd, setLgpd] = useState(false);

  // Sexo do paciente (para campos femininos)
  const [sexoPaciente] = useState(""); // será carregado se necessário

  function toggleChip(arr: string[], setArr: (v: string[]) => void, val: string) {
    if (arr.includes(val)) setArr(arr.filter((v) => v !== val));
    else setArr([...arr, val]);
  }

  function selectSingle(setter: (v: string) => void, val: string, current: string) {
    setter(current === val ? "" : val);
  }

  async function handleSubmit() {
    if (!lgpd) {
      alert("É necessário aceitar o termo LGPD para continuar.");
      return;
    }
    setLoading(true);

    const finalQueixas = [...queixas];
    if (queixaOutro) finalQueixas.push(queixaOutro);

    const payload = {
      pacienteId: parseInt(id),
      queixas: finalQueixas,
      tempoQueixa,
      quedaVolume: {
        quedaAcentuada, quedaTempo, melhoraPiora, fiosNovos,
        perdaVolume, peloOutrasAreas, eventoMarcante,
      },
      afinamento: { afinamento, afinamentoTempo },
      sinaisSintomas: { coceira, dor, ardencia, sensibilidade, caspa, feridas, vermelhidao },
      oleosidade,
      condicoesCouro,
      tratAnteriores: { tratamentos: tratAnteriores, orientadoProfissional, obteveResultado, transplante },
      histFamiliar: { historico: histFamiliar, predisposicao },
      expectativas: { expectativa, descricao: expectativaTexto, disponibilidade },
      higiene: {
        shampoo, frequencia: freqLavagem, temperatura: tempAgua, secagem,
        tempoAgua, boné: bone, tinta, arrancaCabelo,
      },
      cuidadosCapilares: { secadorChapinha, alisamentos, penteadosTracao },
      condicoesSaude,
      infoSaudeExtra: { queloides, intestino, cirurgias, cirurgiaRecente },
      medicamentos,
      alergias,
      habitos: {
        tabagismo, etilismo, estresse, ansiedade, horasSono, cansado,
        problemaSono, tratPsico, atividadeFisica, proteinas, frutas,
        refrigerante, agua, protetorSolar,
      },
      reprodutivo: {
        planejaFilhos, gestante, cicloMenstrual, fluxoMenstrual, anticoncepcional,
      },
      lgpdConsent: lgpd,
    };

    const res = await fetch("/api/pre-atendimento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push(`/pacientes/${id}`);
    } else {
      alert("Erro ao salvar pré-atendimento");
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
        {!multi && (
          <span className="text-xs text-gray-400 self-center ml-1">(selecione um)</span>
        )}
      </div>
    );
  }

  function PerguntaSimNao({
    pergunta,
    valor,
    onChange,
    detalhePlaceholder,
    detalhe,
    onDetalheChange,
  }: {
    pergunta: string;
    valor: string;
    onChange: (v: string) => void;
    detalhePlaceholder?: string;
    detalhe?: string;
    onDetalheChange?: (v: string) => void;
  }) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">{pergunta}</p>
        <ChipGroup
          opcoes={["Sim", "Não"]}
          selecionados={valor}
          onChange={(v) => selectSingle(onChange, v, valor)}
          multi={false}
        />
        {valor === "Sim" && detalhePlaceholder && onDetalheChange && (
          <input
            type="text"
            placeholder={detalhePlaceholder}
            value={detalhe || ""}
            onChange={(e) => onDetalheChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          />
        )}
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
          <h1 className="text-2xl font-bold text-gray-900">M1 — Pré-atendimento</h1>
          <p className="text-sm text-gray-500">Preenchido pelo paciente</p>
        </div>
      </div>

      {/* QUEIXA PRINCIPAL */}
      <Secao id="queixa" titulo="Queixa Principal">
        <p className="text-sm text-gray-600 mb-2">Selecione suas queixas:</p>
        <ChipGroup
          opcoes={QUEIXAS_OPCOES}
          selecionados={queixas}
          onChange={(v) => toggleChip(queixas, setQueixas, v)}
        />
        <input
          placeholder="Outro (especificar)"
          value={queixaOutro}
          onChange={(e) => setQueixaOutro(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-2"
        />
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Tempo da queixa:</p>
          <ChipGroup
            opcoes={TEMPO_QUEIXA_OPCOES}
            selecionados={tempoQueixa}
            onChange={(v) => selectSingle(setTempoQueixa, v, tempoQueixa)}
            multi={false}
          />
        </div>
      </Secao>

      {/* QUEDA E VOLUME */}
      <Secao id="queda" titulo="Queda e Volume">
        <PerguntaSimNao
          pergunta="Queda acentuada?"
          valor={quedaAcentuada}
          onChange={setQuedaAcentuada}
          detalhePlaceholder="Há quanto tempo?"
          detalhe={quedaTempo}
          onDetalheChange={setQuedaTempo}
        />
        <div>
          <p className="text-sm font-medium text-gray-700">Períodos de melhora e piora?</p>
          <ChipGroup
            opcoes={["Sim", "Não", "Não notei"]}
            selecionados={melhoraPiora}
            onChange={(v) => selectSingle(setMelhoraPiora, v, melhoraPiora)}
            multi={false}
          />
        </div>
        <PerguntaSimNao pergunta="Percebe fios novos nascendo?" valor={fiosNovos} onChange={setFiosNovos} />
        <PerguntaSimNao pergunta="Perda de volume?" valor={perdaVolume} onChange={setPerdaVolume} />
        <div>
          <p className="text-sm font-medium text-gray-700">Perda de pelos em outras áreas?</p>
          <ChipGroup
            opcoes={["Sim", "Não", "Não notei"]}
            selecionados={peloOutrasAreas}
            onChange={(v) => selectSingle(setPeloOutrasAreas, v, peloOutrasAreas)}
            multi={false}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Evento marcante antes da queda?</p>
          <input
            placeholder="Descreva (estresse, cirurgia, dieta, etc.)"
            value={eventoMarcante}
            onChange={(e) => setEventoMarcante(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </Secao>

      {/* AFINAMENTO */}
      <Secao id="afinamento" titulo="Afinamento">
        <PerguntaSimNao
          pergunta="Percepção de afinamento?"
          valor={afinamento}
          onChange={setAfinamento}
          detalhePlaceholder="Há quanto tempo?"
          detalhe={afinamentoTempo}
          onDetalheChange={setAfinamentoTempo}
        />
      </Secao>

      {/* SINAIS E SINTOMAS */}
      <Secao id="sinais" titulo="Sinais e Sintomas">
        <PerguntaSimNao pergunta="Coceira?" valor={coceira} onChange={setCoceira} />
        <PerguntaSimNao pergunta="Dor no couro?" valor={dor} onChange={setDor} />
        <PerguntaSimNao pergunta="Ardência/Queimação?" valor={ardencia} onChange={setArdencia} />
        <PerguntaSimNao pergunta="Sensibilidade alterada?" valor={sensibilidade} onChange={setSensibilidade} />
        <PerguntaSimNao pergunta="Caspa/descamação?" valor={caspa} onChange={setCaspa} />
        <PerguntaSimNao pergunta="Feridas ou crostas?" valor={feridas} onChange={setFeridas} />
        <PerguntaSimNao pergunta="Vermelhidão (eritema)?" valor={vermelhidao} onChange={setVermelhidao} />
      </Secao>

      {/* OLEOSIDADE */}
      <Secao id="oleosidade" titulo="Oleosidade">
        <ChipGroup
          opcoes={["Oleoso <24h", "Oleoso >48h", "Seco", "Normal"]}
          selecionados={oleosidade}
          onChange={(v) => selectSingle(setOleosidade, v, oleosidade)}
          multi={false}
        />
      </Secao>

      {/* CONDIÇÕES DO COURO */}
      <Secao id="condicoesCouro" titulo="Condições do Couro Cabeludo">
        <ChipGroup
          opcoes={CONDICOES_COURO_OPCOES}
          selecionados={condicoesCouro}
          onChange={(v) => toggleChip(condicoesCouro, setCondicoesCouro, v)}
        />
      </Secao>

      {/* TRATAMENTOS ANTERIORES */}
      <Secao id="tratamentos" titulo="Tratamentos Anteriores">
        <ChipGroup
          opcoes={TRAT_ANTERIORES_OPCOES}
          selecionados={tratAnteriores}
          onChange={(v) => toggleChip(tratAnteriores, setTratAnteriores, v)}
        />
        <PerguntaSimNao
          pergunta="Orientado por profissional?"
          valor={orientadoProfissional}
          onChange={setOrientadoProfissional}
        />
        <div>
          <p className="text-sm font-medium text-gray-700">Obteve resultados?</p>
          <ChipGroup
            opcoes={["Sim", "Não", "Parcial"]}
            selecionados={obteveResultado}
            onChange={(v) => selectSingle(setObteveResultado, v, obteveResultado)}
            multi={false}
          />
        </div>
        <PerguntaSimNao pergunta="Transplante capilar?" valor={transplante} onChange={setTransplante} />
      </Secao>

      {/* HISTÓRICO FAMILIAR */}
      <Secao id="histFamiliar" titulo="Histórico Familiar">
        <p className="text-sm font-medium text-gray-700 mb-2">Histórico familiar de calvície:</p>
        <ChipGroup
          opcoes={["Pai", "Mãe", "Ambos", "Avós maternos", "Avós paternos", "Sem histórico"]}
          selecionados={histFamiliar}
          onChange={(v) => selectSingle(setHistFamiliar, v, histFamiliar)}
          multi={false}
        />
        <p className="text-sm font-medium text-gray-700 mt-3 mb-2">Predisposição genética:</p>
        <ChipGroup
          opcoes={["Sim", "Não", "Não sei"]}
          selecionados={predisposicao}
          onChange={(v) => selectSingle(setPredisposicao, v, predisposicao)}
          multi={false}
        />
      </Secao>

      {/* EXPECTATIVAS */}
      <Secao id="expectativas" titulo="Expectativas">
        <p className="text-sm font-medium text-gray-700 mb-2">Expectativa do tratamento:</p>
        <ChipGroup
          opcoes={["Realista (entendo que leva tempo)", "Melhorias graduais", "Resultado rápido", "Não sei o que esperar"]}
          selecionados={expectativa}
          onChange={(v) => selectSingle(setExpectativa, v, expectativa)}
          multi={false}
        />
        <div>
          <p className="text-sm font-medium text-gray-700">Descreva o que espera alcançar:</p>
          <textarea
            value={expectativaTexto}
            onChange={(e) => setExpectativaTexto(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <p className="text-sm font-medium text-gray-700 mb-2">Disponibilidade:</p>
        <ChipGroup
          opcoes={["Manhã", "Tarde", "Qualquer horário", "Seg-Sex", "Sábado"]}
          selecionados={disponibilidade}
          onChange={(v) => toggleChip(disponibilidade, setDisponibilidade, v)}
        />
      </Secao>

      {/* HIGIENE CAPILAR */}
      <Secao id="higiene" titulo="Higiene Capilar">
        <p className="text-sm font-medium text-gray-700 mb-2">Shampoo:</p>
        <ChipGroup
          opcoes={SHAMPOO_OPCOES}
          selecionados={shampoo}
          onChange={(v) => toggleChip(shampoo, setShampoo, v)}
        />
        <p className="text-sm font-medium text-gray-700 mt-3 mb-2">Frequência de lavagem:</p>
        <ChipGroup
          opcoes={["1x/dia", "2x/dia", "3x+/dia", "Alternado", "2-3x/semana"]}
          selecionados={freqLavagem}
          onChange={(v) => selectSingle(setFreqLavagem, v, freqLavagem)}
          multi={false}
        />
        <p className="text-sm font-medium text-gray-700 mt-3 mb-2">Temperatura da água:</p>
        <ChipGroup
          opcoes={["Fria", "Morna", "Quente"]}
          selecionados={tempAgua}
          onChange={(v) => selectSingle(setTempAgua, v, tempAgua)}
          multi={false}
        />
        <p className="text-sm font-medium text-gray-700 mt-3 mb-2">Secagem:</p>
        <ChipGroup
          opcoes={["Toalha", "Secador", "Natural"]}
          selecionados={secagem}
          onChange={(v) => selectSingle(setSecagem, v, secagem)}
          multi={false}
        />
        <p className="text-sm font-medium text-gray-700 mt-3 mb-2">Tempo na água:</p>
        <ChipGroup
          opcoes={["< 5min", "5-10min", "> 10min"]}
          selecionados={tempoAgua}
          onChange={(v) => selectSingle(setTempoAgua, v, tempoAgua)}
          multi={false}
        />
        <PerguntaSimNao pergunta="Uso de boné/chapéu?" valor={bone} onChange={setBone} />
        <PerguntaSimNao pergunta="Tinta no cabelo?" valor={tinta} onChange={setTinta} />
        <PerguntaSimNao pergunta="Arranca cabelo?" valor={arrancaCabelo} onChange={setArrancaCabelo} />
        {arrancaCabelo === "Sim" && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm text-amber-800">
            Atenção: possível tricotilomania. Encaminhamento para acompanhamento psicológico será sugerido.
          </div>
        )}
      </Secao>

      {/* CUIDADOS CAPILARES */}
      <Secao id="cuidados" titulo="Cuidados Capilares Adicionais">
        <PerguntaSimNao pergunta="Secador/chapinha/modelador?" valor={secadorChapinha} onChange={setSecadorChapinha} />
        <PerguntaSimNao pergunta="Alisamentos químicos?" valor={alisamentos} onChange={setAlisamentos} />
        <PerguntaSimNao pergunta="Penteados com tração?" valor={penteadosTracao} onChange={setPenteadosTracao} />
      </Secao>

      {/* CONDIÇÕES DE SAÚDE */}
      <Secao id="saude" titulo="Condições de Saúde">
        <ChipGroup
          opcoes={CONDICOES_SAUDE_OPCOES}
          selecionados={condicoesSaude}
          onChange={(v) => toggleChip(condicoesSaude, setCondicoesSaude, v)}
        />
        <PerguntaSimNao pergunta="Tendência a queloides?" valor={queloides} onChange={setQueloides} />
        <div>
          <p className="text-sm font-medium text-gray-700">Funcionamento intestino:</p>
          <ChipGroup
            opcoes={["Regular", "Constipado", "Diarreia frequente"]}
            selecionados={intestino}
            onChange={(v) => selectSingle(setIntestino, v, intestino)}
            multi={false}
          />
        </div>
        <PerguntaSimNao pergunta="Realizou cirurgias?" valor={cirurgias} onChange={setCirurgias} />
        <PerguntaSimNao pergunta="Cirurgia recente (<6 meses)?" valor={cirurgiaRecente} onChange={setCirurgiaRecente} />
      </Secao>

      {/* MEDICAMENTOS */}
      <Secao id="medicamentos" titulo="Medicamentos em Uso">
        <ChipGroup
          opcoes={MEDICAMENTOS_OPCOES}
          selecionados={medicamentos}
          onChange={(v) => toggleChip(medicamentos, setMedicamentos, v)}
        />
      </Secao>

      {/* ALERGIAS */}
      <Secao id="alergias" titulo="Alergias">
        <ChipGroup
          opcoes={ALERGIAS_OPCOES}
          selecionados={alergias}
          onChange={(v) => toggleChip(alergias, setAlergias, v)}
        />
      </Secao>

      {/* HÁBITOS */}
      <Secao id="habitos" titulo="Hábitos e Estilo de Vida">
        <PerguntaSimNao pergunta="Tabagismo?" valor={tabagismo} onChange={setTabagismo} />
        <PerguntaSimNao pergunta="Etilismo?" valor={etilismo} onChange={setEtilismo} />
        <div>
          <p className="text-sm font-medium text-gray-700">Estresse:</p>
          <ChipGroup opcoes={["Alto", "Moderado", "Baixo"]} selecionados={estresse} onChange={(v) => selectSingle(setEstresse, v, estresse)} multi={false} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Nível de ansiedade:</p>
          <ChipGroup opcoes={["Alto", "Moderado", "Baixo"]} selecionados={ansiedade} onChange={(v) => selectSingle(setAnsiedade, v, ansiedade)} multi={false} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Horas de sono/noite:</p>
          <ChipGroup opcoes={["< 5h", "5-7h", "7-9h", "> 9h"]} selecionados={horasSono} onChange={(v) => selectSingle(setHorasSono, v, horasSono)} multi={false} />
        </div>
        <PerguntaSimNao pergunta="Sente-se frequentemente cansado?" valor={cansado} onChange={setCansado} />
        <PerguntaSimNao pergunta="Problemas de sono?" valor={problemaSono} onChange={setProblemaSono} />
        <PerguntaSimNao pergunta="Tratamento psicológico/psiquiátrico?" valor={tratPsico} onChange={setTratPsico} />
        <div>
          <p className="text-sm font-medium text-gray-700">Atividade física:</p>
          <ChipGroup opcoes={["Sim", "Não", "Às vezes"]} selecionados={atividadeFisica} onChange={(v) => selectSingle(setAtividadeFisica, v, atividadeFisica)} multi={false} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Ingestão de proteínas:</p>
          <ChipGroup opcoes={["Adequada", "Deficiente"]} selecionados={proteinas} onChange={(v) => selectSingle(setProteinas, v, proteinas)} multi={false} />
        </div>
        <PerguntaSimNao pergunta="Consome frutas regularmente?" valor={frutas} onChange={setFrutas} />
        <PerguntaSimNao pergunta="Consome refrigerante?" valor={refrigerante} onChange={setRefrigerante} />
        <div>
          <p className="text-sm font-medium text-gray-700">Água/dia:</p>
          <ChipGroup opcoes={["< 1L", "1-2L", "> 2L"]} selecionados={agua} onChange={(v) => selectSingle(setAgua, v, agua)} multi={false} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Protetor solar:</p>
          <ChipGroup opcoes={["Diariamente", "Eventualmente", "Não uso"]} selecionados={protetorSolar} onChange={(v) => selectSingle(setProtetorSolar, v, protetorSolar)} multi={false} />
        </div>
      </Secao>

      {/* REPRODUTIVO */}
      <Secao id="reprodutivo" titulo="Reprodutivo">
        <div>
          <p className="text-sm font-medium text-gray-700">Planeja filhos em 12 meses?</p>
          <ChipGroup opcoes={["Sim", "Não", "Não sei"]} selecionados={planejaFilhos} onChange={(v) => selectSingle(setPlanejaFilhos, v, planejaFilhos)} multi={false} />
          {planejaFilhos === "Sim" && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-sm text-red-800 mt-2">
              Dutasterida CONTRAINDICADA — protocolo será adaptado com Cafeisilane C.
            </div>
          )}
        </div>

        {/* Campos femininos — simplificados, sempre visíveis (paciente preenche se aplicável) */}
        <PerguntaSimNao pergunta="Gestante/amamentando? (se aplicável)" valor={gestante} onChange={setGestante} />
        {gestante === "Sim" && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-sm text-red-800">
            CONTRAINDICAÇÃO ABSOLUTA — Procedimento não pode ser realizado.
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-gray-700">Ciclo menstrual: (se aplicável)</p>
          <ChipGroup opcoes={["Regular", "Irregular", "Ausente", "N/A"]} selecionados={cicloMenstrual} onChange={(v) => selectSingle(setCicloMenstrual, v, cicloMenstrual)} multi={false} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Fluxo menstrual: (se aplicável)</p>
          <ChipGroup opcoes={["Intenso", "Moderado", "Baixo", "N/A"]} selecionados={fluxoMenstrual} onChange={(v) => selectSingle(setFluxoMenstrual, v, fluxoMenstrual)} multi={false} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Anticoncepcional:</p>
          <input
            placeholder="Qual? ou Não"
            value={anticoncepcional}
            onChange={(e) => setAnticoncepcional(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </Secao>

      {/* LGPD */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={lgpd}
            onChange={(e) => setLgpd(e.target.checked)}
            className="mt-1 h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
          />
          <span className="text-sm text-gray-700">
            Autorizo o tratamento dos meus dados pessoais conforme a Lei Geral de
            Proteção de Dados (LGPD) para fins de diagnóstico, tratamento e
            acompanhamento capilar na DR HAIR. *
          </span>
        </label>
      </div>

      {/* Botão enviar */}
      <button
        onClick={handleSubmit}
        disabled={loading || !lgpd}
        className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
      >
        {loading ? "Salvando..." : "Enviar Pré-atendimento"}
      </button>

      {/* Espaçamento inferior */}
      <div className="h-8" />
    </div>
  );
}
