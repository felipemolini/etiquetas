"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import DistribuiVolumesTable from "./DistribuiVolumesTable";
import PaleteCountInput from "./PaleteCountInput";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Divide, XCircle } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface StepOrganizaPaletesProps {
  notas: any[];
  onNext: (paletes: any[]) => void;
  onBack: () => void;
}

const STORAGE_KEY = "distribuicoes_parciais_v4";

export default function StepOrganizaPaletes({ notas, onNext, onBack }: StepOrganizaPaletesProps) {
  const [paleteCounts, setPaleteCounts] = useState<{ [numero: string]: number }>(() =>
    Object.fromEntries(notas.map((n) => [n.numero, 1]))
  );

  const [distribuicoes, setDistribuicoes] = useState<{ [numero: string]: { [idProduto: string]: number[] } }>(() =>
    Object.fromEntries(
      notas.map((n) => [
        n.numero,
        Object.fromEntries(
          n.detalhes.itens.map((item: any) => [
            item.item.id_produto,
            [Number(item.item.quantidade)],
          ])
        ),
      ])
    )
  );

  // Undo stack por linha (produto)
  const [undoStack, setUndoStack] = useState<{ [nota: string]: { [idProduto: string]: number[][] } }>({});

  // Destaque visual temporário por célula (linha, palete)
  const [flash, setFlash] = useState<{ [key: string]: boolean }>({});

  // Sticky actions bar scroll handler (mobile)
  const [actionsSticky, setActionsSticky] = useState(false);
  useEffect(() => {
    function handleScroll() {
      setActionsSticky(window.scrollY > 20);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Restaura distribuição parcial
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setDistribuicoes(parsed);
        }
      } catch { }
    }
  }, []);

  // Salva distribuição parcial
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(distribuicoes));
  }, [distribuicoes]);

  function handleChangeCount(numero: string, count: number) {
    setPaleteCounts((prev) => ({ ...prev, [numero]: count }));
    setDistribuicoes((prev) => {
      const prevDistrib = prev[numero];
      const newDistrib: { [idProduto: string]: number[] } = {};
      for (const [id, arr] of Object.entries(prevDistrib)) {
        const novoArr = [...arr];
        if (novoArr.length < count) {
          for (let i = novoArr.length; i < count; i++) novoArr.push(0);
        } else if (novoArr.length > count) {
          novoArr.length = count;
        }
        newDistrib[id] = novoArr;
      }
      return { ...prev, [numero]: newDistrib };
    });
  }

  // Salva último estado para Undo
  function pushUndo(notaNum: string, idProduto: string) {
    setUndoStack((stack) => {
      const current = distribuicoes[notaNum][idProduto];
      const arr = [...(stack[notaNum]?.[idProduto] ?? [])];
      arr.push([...current]);
      return {
        ...stack,
        [notaNum]: {
          ...(stack[notaNum] || {}),
          [idProduto]: arr.slice(-5), // só 5 últimos estados
        },
      };
    });
  }

  function handleDistribuicaoChange(notaNum: string, idProduto: string, idx: number, valor: number) {
    pushUndo(notaNum, idProduto);
    setDistribuicoes((prev) => {
      const distNota = { ...prev[notaNum] };
      const arr = [...distNota[idProduto]];
      arr[idx] = valor;
      distNota[idProduto] = arr;
      return { ...prev, [notaNum]: distNota };
    });
    // Flash visual (verde leve) na célula alterada
    const flashKey = `${notaNum}-${idProduto}-${idx}`;
    setFlash((f) => ({ ...f, [flashKey]: true }));
    setTimeout(() => setFlash((f) => ({ ...f, [flashKey]: false })), 400);
  }

  function handleDistribuirIgual(notaNum: string, idProduto: string) {
    pushUndo(notaNum, idProduto);
    setDistribuicoes((prev) => {
      const distNota = { ...prev[notaNum] };
      const arr = [...distNota[idProduto]];
      const somaAtual = arr.reduce((acc, v) => acc + v, 0);
      const total = notas.find(n => n.numero === notaNum).detalhes.itens.find((item: any) => item.item.id_produto === idProduto).item.quantidade;
      const falta = total - somaAtual;
      if (falta > 0) {
        const livres = arr.map((v, i) => ({ idx: i, val: v })).filter(({ val }) => val === 0).map(({ idx }) => idx);
        const porPalete = Math.floor(falta / livres.length);
        const resto = falta % livres.length;
        livres.forEach((idx, i) => {
          arr[idx] = porPalete + (i < resto ? 1 : 0);
        });
        distNota[idProduto] = arr;
      }
      return { ...prev, [notaNum]: distNota };
    });
    toast.success("Distribuição igual preenchida!");
  }

  function handleLimparLinha(notaNum: string, idProduto: string) {
    pushUndo(notaNum, idProduto);
    setDistribuicoes((prev) => {
      const distNota = { ...prev[notaNum] };
      distNota[idProduto] = distNota[idProduto].map(() => 0);
      return { ...prev, [notaNum]: distNota };
    });
    toast.info("Linha limpa!");
  }

  function handleUndo(notaNum: string, idProduto: string) {
    setUndoStack((stack) => {
      const arr = [...(stack[notaNum]?.[idProduto] ?? [])];
      if (arr.length === 0) return stack;
      const prev = arr.pop();
      setDistribuicoes((prevDistrib) => {
        const distNota = { ...prevDistrib[notaNum] };
        distNota[idProduto] = prev;
        return { ...prevDistrib, [notaNum]: distNota };
      });
      return {
        ...stack,
        [notaNum]: {
          ...(stack[notaNum] || {}),
          [idProduto]: arr,
        },
      };
    });
    toast.success("Desfeito!");
  }

  // BOTÕES DE NOTA
  function handleLimparTudoNota(notaNum: string) {
    setDistribuicoes((prev) => {
      const novo = { ...prev };
      for (const idProduto of Object.keys(novo[notaNum])) {
        novo[notaNum][idProduto] = novo[notaNum][idProduto].map(() => 0);
      }
      return novo;
    });
    toast.info("Todos os produtos dessa nota foram limpos!");
  }
  function handleDistribuirTudoNota(notaNum: string) {
    setDistribuicoes((prev) => {
      const novo = { ...prev };
      for (const idProduto of Object.keys(novo[notaNum])) {
        const item = notas.find(n => n.numero === notaNum).detalhes.itens.find((item: any) => item.item.id_produto === idProduto).item;
        const qtd = Number(item.quantidade);
        const paletes = novo[notaNum][idProduto].length;
        const porPalete = Math.floor(qtd / paletes);
        const resto = qtd % paletes;
        novo[notaNum][idProduto] = Array.from({ length: paletes }, (_, i) => porPalete + (i < resto ? 1 : 0));
      }
      return novo;
    });
    toast.success("Distribuição preenchida para todos os produtos dessa nota!");
  }

  // BOTÕES GLOBAIS
  function handleLimparTudoGlobal() {
    setDistribuicoes((prev) => {
      const novo = { ...prev };
      for (const notaNum of Object.keys(novo)) {
        for (const idProduto of Object.keys(novo[notaNum])) {
          novo[notaNum][idProduto] = novo[notaNum][idProduto].map(() => 0);
        }
      }
      return novo;
    });
    toast.info("Todas as distribuições foram limpas!");
  }
  function handleDistribuirTudoGlobal() {
    setDistribuicoes((prev) => {
      const novo = { ...prev };
      for (const notaNum of Object.keys(novo)) {
        for (const idProduto of Object.keys(novo[notaNum])) {
          const item = notas.find(n => n.numero === notaNum).detalhes.itens.find((item: any) => item.item.id_produto === idProduto).item;
          const qtd = Number(item.quantidade);
          const paletes = novo[notaNum][idProduto].length;
          const porPalete = Math.floor(qtd / paletes);
          const resto = qtd % paletes;
          novo[notaNum][idProduto] = Array.from({ length: paletes }, (_, i) => porPalete + (i < resto ? 1 : 0));
        }
      }
      return novo;
    });
    toast.success("Distribuição preenchida para todas as notas!");
  }

  // Atalhos de teclado globais
  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "d") {
        handleDistribuirTudoGlobal();
        toast("Distribuição automática em todas as notas (atalho: Ctrl+D)");
      }
      if (e.ctrlKey && e.key.toLowerCase() === "l") {
        handleLimparTudoGlobal();
        toast("Limpou todas as distribuições (atalho: Ctrl+L)");
      }
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
    // eslint-disable-next-line
  }, []);

  // Validação: soma dos volumes por produto deve bater com o total da nota
  const erros: { [idProduto: string]: boolean } = {};
  let algumErro = false;
  for (const nota of notas) {
    const dist = distribuicoes[nota.numero];
    for (const item of nota.detalhes.itens) {
      const esperado = Number(item.item.quantidade);
      const soma = dist[item.item.id_produto].reduce((acc, v) => acc + (isNaN(v) ? 0 : v), 0);
      if (soma !== esperado) {
        erros[item.item.id_produto] = true;
        algumErro = true;
      }
    }
  }

  function handleAvancar() {
    if (!algumErro) {
      const resultado: any[] = [];
      for (const nota of notas) {
        const dist = distribuicoes[nota.numero];
        const count = paleteCounts[nota.numero];
        for (let p = 0; p < count; p++) {
          resultado.push({
            numeroNota: nota.numero,
            cliente: nota.detalhes.cliente,
            produtos: nota.detalhes.itens.map((item: any) => ({
              ...item.item,
              quantidade: dist[item.item.id_produto][p] || 0,
            })).filter((item: any) => item.quantidade > 0),
            idxPalete: p + 1,
            totalPaletes: count,
          });
        }
      }
      onNext(resultado);
    } else {
      toast.error("Distribua corretamente todos os produtos antes de avançar.");
    }
  }

  return (
    <div className="w-full max-w-6/10 mx-auto bg-card p-4 md:p-6 rounded-xl shadow transition-colors">
      {/* Sticky bar de ações globais */}
      <TooltipProvider>
        <div className={`flex gap-2 items-center justify-end sticky top-0 z-20 py-2 ${actionsSticky ? "bg-card border-b shadow-sm" : ""}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="secondary" onClick={handleDistribuirTudoGlobal} aria-label="Distribuir tudo (todas as notas)">
                <Divide className="w-4 h-4 mr-1" /> Distribuir tudo
              </Button>
            </TooltipTrigger>
            <TooltipContent>Distribui igualmente todos os produtos em todos os paletes de todas as notas (atalho: Ctrl+D)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="secondary" onClick={handleLimparTudoGlobal} aria-label="Limpar tudo (todas as notas)">
                <XCircle className="w-4 h-4 mr-1" /> Limpar tudo
              </Button>
            </TooltipTrigger>
            <TooltipContent>Limpa todas as distribuições (atalho: Ctrl+L)</TooltipContent>
          </Tooltip>
          <ThemeToggle />
        </div>
      </TooltipProvider>

      <div className="space-y-6">
        {notas.map((nota) => (
          <div key={nota.numero} className="bg-background p-4 rounded-xl border mb-4">
            <div className="flex flex-wrap justify-between items-end gap-2 mb-2">
              <div>
                <div className="font-semibold">Nota: {nota.numero}</div>
                <div className="text-sm text-muted-foreground">{nota.detalhes.cliente.nome} — {nota.detalhes.cliente.cpf_cnpj}</div>
              </div>
              <div className="flex gap-2 items-center">
                <PaleteCountInput
                  value={paleteCounts[nota.numero]}
                  min={1}
                  max={15}
                  onChange={val => handleChangeCount(nota.numero, val)}
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => handleDistribuirTudoNota(nota.numero)}>
                        <Divide className="w-4 h-4 mr-1" /> Distribuir tudo
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Distribui igualmente todos os produtos dessa nota entre os paletes</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => handleLimparTudoNota(nota.numero)}>
                        <XCircle className="w-4 h-4 mr-1" /> Limpar tudo
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Limpa todas as distribuições dessa nota</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <DistribuiVolumesTable
              itens={nota.detalhes.itens}
              distrib={distribuicoes[nota.numero]}
              setDistrib={(idProduto, idx, valor) =>
                handleDistribuicaoChange(nota.numero, idProduto, idx, valor)
              }
              paleteCount={paleteCounts[nota.numero]}
              onDistribuirIgual={(idProduto) => handleDistribuirIgual(nota.numero, idProduto)}
              onLimparLinha={(idProduto) => handleLimparLinha(nota.numero, idProduto)}
              onUndo={(idProduto) => handleUndo(nota.numero, idProduto)}
              erros={erros}
              flash={flash}
            />
          </div>
        ))}
      </div>
      {algumErro && (
        <Alert variant="destructive" className="my-4">
          <AlertDescription>
            Existem produtos com distribuição incompleta ou incorreta. Corrija antes de avançar!
          </AlertDescription>
        </Alert>
      )}
      <div className="flex gap-4 justify-end mt-6">
        <Button variant="secondary" onClick={onBack}>Voltar</Button>
        <Button onClick={handleAvancar} disabled={algumErro}>Avançar</Button>
      </div>
    </div>
  );
}
