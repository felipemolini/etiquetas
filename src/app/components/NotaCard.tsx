"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface NotaCardProps {
  nota: any;
  onRemove?: (numero: string) => void;
}

// Função robusta para tratar qualquer erro vindo do backend/tiny
function renderErro(erro: any): React.ReactNode {
  if (!erro) return null;
  if (typeof erro === "string") return erro;
  if (Array.isArray(erro)) {
    const mensagens = erro
      .map((e) =>
        typeof e === "string"
          ? e
          : e?.mensagem || e?.erro || undefined
      )
      .filter(Boolean);
    if (mensagens.length > 0) return mensagens.join(" | ");
    return erro.map((e) => JSON.stringify(e)).join(" | ");
  }
  if (typeof erro === "object") {
    if (erro.mensagem) return erro.mensagem;
    if (typeof erro.erro === "string") return erro.erro;
    if (erro.erro) return renderErro(erro.erro);
    if (erro.detalhe) return erro.detalhe;
    if (erro.detalhes) return renderErro(erro.detalhes);
    const valores = Object.values(erro).filter((v) => typeof v === "string");
    if (valores.length > 0) return valores.join(" | ");
    return "Erro desconhecido";
  }
  return "Erro desconhecido";
}

export default function NotaCard({ nota, onRemove }: NotaCardProps) {
  const [showDetalhes, setShowDetalhes] = useState(false);

  if (nota.erro) {
    return (
      <div className="border rounded p-3 mb-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 flex justify-between items-center">
        <span>
          <strong>Erro:</strong> {renderErro(nota.erro)}
        </span>
        {onRemove && (
          <Button variant="destructive" size="sm" onClick={() => onRemove(nota.numero)} aria-label={`Remover nota ${nota.numero}`}>
            Remover
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="border rounded p-3 mb-2 bg-card dark:bg-card/80 transition-colors">
      <div className="flex justify-between items-center">
        <div>
          <div><strong>Nota:</strong> {nota.numero}</div>
          <div><strong>Cliente:</strong> {nota.detalhes?.cliente?.nome}</div>
          <div><strong>CNPJ:</strong> {nota.detalhes?.cliente?.cpf_cnpj}</div>
          <div><strong>Produtos:</strong> {nota.detalhes?.itens?.length} itens</div>
          <div><strong>Volumes:</strong> {nota.detalhes?.quantidade_volumes}</div>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowDetalhes(!showDetalhes)}
            aria-label="Mostrar detalhes da nota"
          >
            {showDetalhes ? "Esconder" : "Detalhes"}
          </Button>
          {onRemove && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onRemove(nota.numero)}
              aria-label={`Remover nota ${nota.numero}`}
            >
              Remover
            </Button>
          )}
        </div>
      </div>
      {showDetalhes && (
        <div className="mt-2 bg-background border rounded p-2 transition-colors">
          <ul className="list-disc ml-5">
            {nota.detalhes?.itens?.map((item: any, i: number) => (
              <li key={i}>
                {item.item?.descricao} — {item.item?.quantidade} {item.item?.unidade}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
