import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeechToText } from "@/hooks/useSpeechToText";

interface InputWithSpeechProps extends React.ComponentProps<"input"> {
  onSpeechResult?: (text: string) => void;
}

const InputWithSpeech = React.forwardRef<HTMLInputElement, InputWithSpeechProps>(
  ({ className, onSpeechResult, onChange, value, ...props }, ref) => {
    const [localValue, setLocalValue] = React.useState(value || "");

    React.useEffect(() => {
      setLocalValue(value || "");
    }, [value]);

    const handleSpeechResult = React.useCallback((transcript: string) => {
      setLocalValue(transcript);
      
      if (onSpeechResult) {
        onSpeechResult(transcript);
      }
      
      if (onChange) {
        const syntheticEvent = {
          target: { value: transcript },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    }, [onChange, onSpeechResult]);

    const { isListening, toggleListening } = useSpeechToText({
      onResult: handleSpeechResult,
      continuous: false,
    });

    return (
      <div className="relative flex w-full items-center">
        <Input
          ref={ref}
          className={cn("pr-10 flex-1", className)}
          onChange={(e) => {
            setLocalValue(e.target.value);
            if (onChange) {
              onChange(e);
            }
          }}
          value={localValue}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "absolute right-1 h-7 w-7 hover:bg-transparent",
            isListening && "text-red-500 animate-pulse"
          )}
          onClick={toggleListening}
          data-testid="button-speech-to-text"
        >
          {isListening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }
);

InputWithSpeech.displayName = "InputWithSpeech";

export { InputWithSpeech };
