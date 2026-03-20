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

const ESTADO_CIVIL_OPCOES = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União estável"];
const INDICACAO_OPCOES = ["Redes sociais", "Amigo/familiar", "Google", "Indicação profissional", "Outro"];
const COMO_CONHECEU_OPCOES = ["Instagram", "TikTok", "Facebook", "Google", "Indicação", "Outro"];
const PARENTESCO_OPCOES = ["Cônjuge", "Pai/Mãe", "Irmão(ã)", "Filho(a)", "Amigo(a)", "Outro"];
const FREQ_TERMICA_OPCOES = ["Diariamente", "Semanalmente", "Eventualmente"];
const FREQ_TRACAO_OPCOES = ["Diariamente", "Às vezes", "Raramente"];
const SIM_NAO_NAOSEI_OPCOES = ["Sim", "Não", "Não sei"];

export default function PreAtendimentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [secaoAberta, setSecaoAberta] = useState<string>("queixa");

  // Dados Pessoais
  const [rg, setRg] = useState("");
  const [estadoCivil, setEstadoCivil] = useState("");
  const [ocupacao, setOcupacao] = useState("");
  const [endereco, setEndereco] = useState("");
  const [indicacao, setIndicacao] = useState("");
  const [comoConheceu, setComoConheceu] = useState("");
  const [contatoUrgNome, setContatoUrgNome] = useState("");
  const [contatoUrgTelefone, setContatoUrgTelefone] = useState("");
  const [contatoUrgParentesco, setContatoUrgParentesco] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");

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
  const [secadorChapinhaFreq, setSecadorChapinhaFreq] = useState("");
  const [alisamentos, setAlisamentos] = useState("");
  const [alisamentosTipoFreq, setAlisamentosTipoFreq] = useState("");
  const [penteadosTracao, setPenteadosTracao] = useState("");
  const [penteadosTracaoFreq, setPenteadosTracaoFreq] = useState("");
  const [dorTracao, setDorTracao] = useState("");

  // Saúde
  const [condicoesSaude, setCondicoesSaude] = useState<string[]>([]);
  const [queloides, setQueloides] = useState("");
  const [intestino, setIntestino] = useState("");
  const [cirurgias, setCirurgias] = useState("");
  const [cirurgiasDetalhe, setCirurgiasDetalhe] = useState("");
  const [cirurgiaRecente, setCirurgiaRecente] = useState("");
  const [cirurgiaRecenteDetalhe, setCirurgiaRecenteDetalhe] = useState("");
  const [internacoesRecentes, setInternacoesRecentes] = useState("");
  const [internacoesDetalhe, setInternacoesDetalhe] = useState("");

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
  const [dataUltimaMenstruacao, setDataUltimaMenstruacao] = useState("");
  const [numFilhos, setNumFilhos] = useState("");
  const [dataUltimoParto, setDataUltimoParto] = useState("");
  const [desregulacaoHormonal, setDesregulacaoHormonal] = useState("");
  const [sop, setSop] = useState("");

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

    const pesoNum = peso ? parseFloat(peso) : null;
    const alturaNum = altura ? parseFloat(altura) : null;
    const imcCalc = pesoNum && alturaNum && alturaNum > 0
      ? pesoNum / ((alturaNum / 100) * (alturaNum / 100))
      : null;

    const payload = {
      pacienteId: parseInt(id),
      dadosPessoais: {
        rg, estadoCivil, ocupacao, endereco, indicacao, comoConheceu,
        contatoUrgencia: {
          nome: contatoUrgNome,
          telefone: contatoUrgTelefone,
          parentesco: contatoUrgParentesco,
        },
        peso: pesoNum, altura: alturaNum, imc: imcCalc ? parseFloat(imcCalc.toFixed(1)) : null,
      },
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
      cuidadosCapilares: {
        secadorChapinha, secadorChapinhaFreq,
        alisamentos, alisamentosTipoFreq,
        penteadosTracao, penteadosTracaoFreq, dorTracao,
      },
      condicoesSaude,
      infoSaudeExtra: {
        queloides, intestino,
        cirurgias, cirurgiasDetalhe,
        cirurgiaRecente, cirurgiaRecenteDetalhe,
        internacoesRecentes, internacoesDetalhe,
      },
      medicamentos,
      alergias,
      habitos: {
        tabagismo, etilismo, estresse, ansiedade, horasSono, cansado,
        problemaSono, tratPsico, atividadeFisica, proteinas, frutas,
        refrigerante, agua, protetorSolar,
      },
      reprodutivo: {
        planejaFilhos, gestante, cicloMenstrual, fluxoMenstrual, anticoncepcional,
        dataUltimaMenstruacao, numFilhos, dataUltimoParto,
        desregulacaoHormonal, sop,
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

      {/* DADOS PESSOAIS */}
      <Secao id="dadosPessoais" titulo="Dados Pessoais">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">RG:</p>
          <input
            placeholder="Número do RG"
            value={rg}
            onChange={(e) => setRg(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Estado civil:</p>
          <ChipGroup
            opcoes={ESTADO_CIVIL_OPCOES}
            selecionados={estadoCivil}
            onChange={(v) => selectSingle(setEstadoCivil, v, estadoCivil)}
            multi={false}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Ocupação/profissão:</p>
          <input
            placeholder="Sua ocupação ou profissão"
            value={ocupacao}
            onChange={(e) => setOcupacao(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Endereço completo:</p>
          <input
            placeholder="Rua, nº, bairro, cidade, estado, CEP"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Indicação:</p>
          <ChipGroup
            opcoes={INDICACAO_OPCOES}
            selecionados={indicacao}
            onChange={(v) => selectSingle(setIndicacao, v, indicacao)}
            multi={false}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Como conheceu DR HAIR:</p>
          <ChipGroup
            opcoes={COMO_CONHECEU_OPCOES}
            selecionados={comoConheceu}
            onChange={(v) => selectSingle(setComoConheceu, v, comoConheceu)}
            multi={false}
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Contato de urgência:</p>
          <input
            placeholder="Nome"
            value={contatoUrgNome}
            onChange={(e) => setContatoUrgNome(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          />
          <input
            placeholder="Telefone"
            value={contatoUrgTelefone}
            onChange={(e) => setContatoUrgTelefone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          />
          <p className="text-sm font-medium text-gray-700 mt-1">Parentesco:</p>
          <ChipGroup
            opcoes={PARENTESCO_OPCOES}
            selecionados={contatoUrgParentesco}
            onChange={(v) => selectSingle(setContatoUrgParentesco, v, contatoUrgParentesco)}
            multi={false}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Peso (kg):</p>
            <input
              type="number"
              placeholder="Ex: 75"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Altura (cm):</p>
            <input
              type="number"
              placeholder="Ex: 175"
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>
        </div>
        {peso && altura && parseFloat(altura) > 0 && (() => {
          const pesoNum = parseFloat(peso);
          const alturaM = parseFloat(altura) / 100;
          const imc = pesoNum / (alturaM * alturaM);
          let classificacao = "";
          let cor = "";
          if (imc < 18.5) { classificacao = "Abaixo do peso"; cor = "text-amber-600"; }
          else if (imc <= 24.9) { classificacao = "Normal"; cor = "text-green-600"; }
          else if (imc <= 29.9) { classificacao = "Sobrepeso"; cor = "text-amber-600"; }
          else { classificacao = "Obesidade"; cor = "text-red-600"; }
          return (
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-medium">IMC:</span>{" "}
                <span className={`font-bold ${cor}`}>{imc.toFixed(1)}</span>{" "}
                <span className={`text-sm ${cor}`}>({classificacao})</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">Fórmula: peso / (altura em m)² = {pesoNum} / ({alturaM.toFixed(2)} × {alturaM.toFixed(2)})</p>
            </div>
          );
        })()}
      </Secao>

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
        {secadorChapinha === "Sim" && (
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Frequência de uso:</p>
            <ChipGroup
              opcoes={FREQ_TERMICA_OPCOES}
              selecionados={secadorChapinhaFreq}
              onChange={(v) => selectSingle(setSecadorChapinhaFreq, v, secadorChapinhaFreq)}
              multi={false}
            />
          </div>
        )}
        <PerguntaSimNao pergunta="Alisamentos químicos?" valor={alisamentos} onChange={setAlisamentos} />
        {alisamentos === "Sim" && (
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Tipo e frequência?</p>
            <input
              type="text"
              placeholder="Ex: Progressiva, a cada 3 meses"
              value={alisamentosTipoFreq}
              onChange={(e) => setAlisamentosTipoFreq(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>
        )}
        <PerguntaSimNao pergunta="Penteados com tração?" valor={penteadosTracao} onChange={setPenteadosTracao} />
        {penteadosTracao === "Sim" && (
          <div className="ml-4 space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-2">Frequência:</p>
            <ChipGroup
              opcoes={FREQ_TRACAO_OPCOES}
              selecionados={penteadosTracaoFreq}
              onChange={(v) => selectSingle(setPenteadosTracaoFreq, v, penteadosTracaoFreq)}
              multi={false}
            />
            <PerguntaSimNao pergunta="Sente dor na tração?" valor={dorTracao} onChange={setDorTracao} />
          </div>
        )}
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
        <PerguntaSimNao
          pergunta="Realizou cirurgias?"
          valor={cirurgias}
          onChange={setCirurgias}
          detalhePlaceholder="Quais e quando?"
          detalhe={cirurgiasDetalhe}
          onDetalheChange={setCirurgiasDetalhe}
        />
        <PerguntaSimNao
          pergunta="Cirurgia recente (<6 meses)?"
          valor={cirurgiaRecente}
          onChange={setCirurgiaRecente}
          detalhePlaceholder="Qual e há quanto tempo?"
          detalhe={cirurgiaRecenteDetalhe}
          onDetalheChange={setCirurgiaRecenteDetalhe}
        />
        <PerguntaSimNao
          pergunta="Internações recentes?"
          valor={internacoesRecentes}
          onChange={setInternacoesRecentes}
          detalhePlaceholder="Motivo e quando?"
          detalhe={internacoesDetalhe}
          onDetalheChange={setInternacoesDetalhe}
        />
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
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Data última menstruação: (se aplicável)</p>
          <input
            type="date"
            value={dataUltimaMenstruacao}
            onChange={(e) => setDataUltimaMenstruacao(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Nº filhos:</p>
            <input
              type="number"
              placeholder="0"
              value={numFilhos}
              onChange={(e) => setNumFilhos(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Data último parto:</p>
            <input
              type="date"
              value={dataUltimoParto}
              onChange={(e) => setDataUltimoParto(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Desregulação hormonal: (se aplicável)</p>
          <ChipGroup
            opcoes={SIM_NAO_NAOSEI_OPCOES}
            selecionados={desregulacaoHormonal}
            onChange={(v) => selectSingle(setDesregulacaoHormonal, v, desregulacaoHormonal)}
            multi={false}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">SOP (Síndrome dos Ovários Policísticos): (se aplicável)</p>
          <ChipGroup
            opcoes={SIM_NAO_NAOSEI_OPCOES}
            selecionados={sop}
            onChange={(v) => selectSingle(setSop, v, sop)}
            multi={false}
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
