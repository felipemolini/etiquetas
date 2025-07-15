"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";

interface NotaInputProps {
  onBuscar: (notas: string[]) => void;
  disabled?: boolean;
  maxNotas?: number;
}

export default function NotaInput({ onBuscar, disabled, maxNotas = 15 }: NotaInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleBuscar() {
    let arr = input
      .replace(/[\s]+/g, ",")
      .split(",")
      .map(n => n.replace(/\D/g, ""))
      .filter(n => n.length > 0);
    arr = Array.from(new Set(arr)); // remove duplicadas

    if (arr.length === 0) {
      toast.error("Digite ao menos um número de nota.");
      return;
    }
    if (arr.length > maxNotas) {
      toast.warning(`Máximo de ${maxNotas} notas por busca.`);
      return;
    }
    onBuscar(arr);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleBuscar();
    if (e.key === "Escape") setInput("");
  }

  return (
    <div className="flex gap-2 w-full max-sm:flex-col">
      <Input
        ref={inputRef}
        placeholder="Números das notas separados por vírgula (ex: 1234,5678)"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="Números das notas fiscais"
        className="flex-1"
        maxLength={70}
      />
      <Button onClick={handleBuscar} disabled={disabled} aria-label="Buscar notas">
        Buscar
      </Button>
    </div>
  );
}
