"use client";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface PaleteCountInputProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export default function PaleteCountInput({
  value,
  min = 1,
  max = 15,
  onChange,
  disabled = false,
}: PaleteCountInputProps) {
  // Permite edição direta, remove zeros à esquerda e limita valor
  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/^0+(?=\d)/, "");
    if (v === "") v = "1"; // nunca deixa vazio
    let num = Math.max(min, Math.min(max, Number(v)));
    onChange(num);
  }
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="px-2 py-1 rounded bg-muted border hover:bg-gray-200 dark:hover:bg-gray-700 font-bold text-lg"
              onClick={() => onChange(Math.max(min, value - 1))}
              disabled={value <= min || disabled}
              aria-label="Diminuir paletes"
              tabIndex={-1}
            >-</button>
          </TooltipTrigger>
          <TooltipContent>Diminuir quantidade de paletes</TooltipContent>
        </Tooltip>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={handleInput}
          className="w-14 px-1 rounded border text-center bg-background font-semibold"
          disabled={disabled}
          aria-label="Quantidade de paletes"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="px-2 py-1 rounded bg-muted border hover:bg-gray-200 dark:hover:bg-gray-700 font-bold text-lg"
              onClick={() => onChange(Math.min(max, value + 1))}
              disabled={value >= max || disabled}
              aria-label="Aumentar paletes"
              tabIndex={-1}
            >+</button>
          </TooltipTrigger>
          <TooltipContent>Aumentar quantidade de paletes</TooltipContent>
        </Tooltip>
        <span className="ml-2 text-xs text-muted-foreground">
          {value === 1 ? "1 palete" : `${value} paletes`}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="ml-1 text-xs cursor-help text-muted-foreground">ⓘ</span>
          </TooltipTrigger>
          <TooltipContent>
            Máx. {max} paletes por nota.<br />
            Você pode digitar, usar as setas do teclado ou clicar nos botões.
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
