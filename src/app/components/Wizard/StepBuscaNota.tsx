"use client";
import { useState, useEffect } from "react";
import NotaInput from "./NotaInput";
import NotaCard from "../NotaCard";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MAX_NOTAS = 15;
const SESSION_KEY = "lastNotasBusca";

interface StepBuscaNotaProps {
  onNext: (notas: any[]) => void;
}

export default function StepBuscaNota({ onNext }: StepBuscaNotaProps) {
  const [notasConsulta, setNotasConsulta] = useState<string[]>([]);
  const [notas, setNotas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  // Salva/restaura último lote no sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setNotasConsulta(JSON.parse(saved));
  }, []);

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(notasConsulta));
  }, [notasConsulta]);

  async function buscarNotas(arr: string[]) {
    setErro("");
    setNotas([]);
    setNotasConsulta(arr);
    setLoading(true);

    try {
      const res = await fetch(`/api/notas?numero=${encodeURIComponent(arr.join(","))}`);
      const data = await res.json();
      if (data.resultados) {
        setNotas(data.resultados);
        if (data.resultados.every((n: any) => n.erro)) {
          setErro("Nenhuma nota encontrada.");
          toast.error("Nenhuma nota encontrada.");
        } else {
          toast.success("Notas buscadas com sucesso!");
        }
      } else {
        setErro("Nenhum dado retornado.");
        toast.error("Nenhum dado retornado.");
      }
    } catch (e) {
      setErro("Erro ao buscar notas.");
      toast.error("Erro ao buscar notas.");
    }
    setLoading(false);
  }

  const notasValidas = notas.filter((n: any) => !n.erro);
  const notasInvalidas = notas.filter((n: any) => n.erro);

  function removerNota(numero: string) {
    setNotas((prev) => prev.filter((x) => x.numero !== numero));
    setNotasConsulta((prev) => prev.filter((n) => n !== numero));
    toast.success("Nota removida!");
  }

  function limparTudo() {
    setNotas([]);
    setNotasConsulta([]);
    setErro("");
    toast.success("Busca limpa!");
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-card p-6 rounded-xl shadow transition-colors">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Etiquetas de Palete</h1>
        <ThemeToggle />
      </div>

      <NotaInput
        onBuscar={buscarNotas}
        disabled={loading}
        maxNotas={MAX_NOTAS}
      />

      {/* Só exibe o botão "Limpar tudo" se houver notas buscadas */}
      {notasConsulta.length > 0 && (
        <div className="flex justify-end mt-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={limparTudo}
                  aria-label="Limpar todas as notas buscadas"
                >
                  Limpar tudo
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>Limpar todos os números de nota da busca</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground mt-4">
          <Loader2 className="animate-spin h-5 w-5" /> Buscando notas...
        </div>
      )}

      {notas.length > 0 && (
        <div className="flex gap-4 mt-2">
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 rounded text-xs">
            {notasValidas.length} válida(s)
          </span>
          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 rounded text-xs">
            {notasInvalidas.length} inválida(s)
          </span>
        </div>
      )}

      {erro && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      <div className="mt-4 space-y-2">
        {notas.length === 0 && !erro && !loading && (
          <div className="text-muted-foreground text-sm text-center">
            Nenhuma nota consultada ainda.<br />Digite os números acima e clique em <strong>Buscar</strong>.
          </div>
        )}
        {notas.map((n, idx) => (
          <NotaCard key={idx} nota={n} onRemove={removerNota} />
        ))}
      </div>

      {notasValidas.length > 0 && (
        <Button
          className="mt-4 w-full"
          onClick={() => onNext(notasValidas)}
        >
          Próximo
        </Button>
      )}
    </div>
  );
}
