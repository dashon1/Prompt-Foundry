import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeechToText } from "@/hooks/useSpeechToText";

interface TextareaWithSpeechProps extends React.ComponentProps<"textarea"> {
  onSpeechResult?: (text: string) => void;
}

const TextareaWithSpeech = React.forwardRef<HTMLTextAreaElement, TextareaWithSpeechProps>(
  ({ className, onSpeechResult, onChange, value, ...props }, ref) => {
    const handleSpeechResult = React.useCallback((transcript: string) => {
      if (onSpeechResult) {
        onSpeechResult(transcript);
      }
      
      if (onChange) {
        const syntheticEvent = {
          target: { value: transcript },
        } as React.ChangeEvent<HTMLTextAreaElement>;
        onChange(syntheticEvent);
      }
    }, [onChange, onSpeechResult]);

    const { isListening, toggleListening } = useSpeechToText({
      onResult: handleSpeechResult,
      continuous: true,
    });

    return (
      <div className="relative w-full">
        <Textarea
          ref={ref}
          className={cn("pr-10", className)}
          onChange={onChange}
          value={value}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "absolute right-2 top-2 h-7 w-7 hover:bg-transparent",
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

TextareaWithSpeech.displayName = "TextareaWithSpeech";

export { TextareaWithSpeech };
