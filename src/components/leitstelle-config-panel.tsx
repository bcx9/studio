'use client';
import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plug, Send, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

interface LeitstelleConfigPanelProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSendMessage: (message: string) => void;
  isRallying: boolean;
  onToggleRally: () => void;
  isRallyPossible: boolean;
}

export default function LeitstelleConfigPanel({ 
    isOpen, 
    setIsOpen, 
    onSendMessage,
    isRallying,
    onToggleRally,
    isRallyPossible,
 }: LeitstelleConfigPanelProps) {
  const [message, setMessage] = React.useState('');
  const { toast } = useToast();

  const handleSend = () => {
    if (!message.trim()) {
        toast({
            variant: 'destructive',
            title: 'Leere Nachricht',
            description: 'Bitte geben Sie eine Nachricht ein.',
        });
        return;
    }
    onSendMessage(message);
    setMessage('');
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Leitstelle Konfiguration</SheetTitle>
          <SheetDescription>
            Die Leitstelle ist permanent mit Strom versorgt und kann Nachrichten an alle Einheiten senden.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-6 overflow-y-auto p-1 pr-6">
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <Label>Stromversorgung</Label>
                    <p className="text-xs text-muted-foreground">
                        Die Leitstelle ist an eine externe Stromquelle angeschlossen.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-400 font-medium">
                    <Plug className="h-4 w-4" />
                    <span>Extern versorgt</span>
                </div>
            </div>
             <div className="space-y-2">
                <Label>Sammelpunkt</Label>
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <Label htmlFor="rally-switch" className="cursor-pointer font-medium">Einheiten zur Leitstelle beordern</Label>
                        <p className="text-xs text-muted-foreground">
                            Alle aktiven Einheiten bewegen sich zur Leitstelle und verbleiben in einem Radius von 500m.
                        </p>
                         {!isRallyPossible && (
                            <p className="text-xs text-yellow-500 flex items-center gap-1 mt-1">
                                <AlertTriangle className="h-3 w-3" />
                                Setzen Sie zuerst einen Leitstellen-Marker auf der Karte.
                            </p>
                        )}
                    </div>
                    <Switch
                        id="rally-switch"
                        checked={isRallying}
                        onCheckedChange={onToggleRally}
                        disabled={!isRallyPossible}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="message-to-all">Rundnachricht</Label>
                <Textarea
                    id="message-to-all"
                    placeholder="Geben Sie Ihre Nachricht an alle Einheiten hier ein..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                />
            </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Abbrechen</Button>
          <Button onClick={handleSend} disabled={!message.trim()}>
            <Send className="mr-2 h-4 w-4"/>
            An alle senden
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
