
'use client';

import * as React from 'react';
import { Bot, Send, User, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { invokeAiAssistant } from '@/app/actions';
import type { AiAssistantAction } from '@/ai/flows/ai-assistant-flow';
import type { MeshUnit, Group, UnitStatus } from '@/types/mesh';
import { useToast } from '@/hooks/use-toast';
import { UNIT_STATUS_TO_CODE, UNIT_TYPE_TO_CODE } from '@/types/mesh';

interface AiAssistantProps {
    units: MeshUnit[];
    groups: Group[];
    setUnitStatus: (unitId: number, status: UnitStatus) => void;
    sendMessage: (message: string, target: 'all' | number) => void;
}

interface Message {
    role: 'user' | 'ai';
    text: string;
}

export default function AiAssistant({ units, groups, setUnitStatus, sendMessage }: AiAssistantProps) {
    const [messages, setMessages] = React.useState<Message[]>([
        { role: 'ai', text: 'Hallo! Wie kann ich Ihnen heute helfen? Sie können mich nach dem Status von Einheiten fragen oder Befehle erteilen, z.B. "Setze HLF-20 in den Wartungsmodus".' }
    ]);
    const [inputValue, setInputValue] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    
    const scrollToBottom = () => {
        setTimeout(() => {
            const scrollContainer = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }, 100);
    };

    const handleAction = (action: AiAssistantAction) => {
        if (action.action === 'SET_STATUS') {
            const unit = units.find(u => u.name.toLowerCase() === action.unitName.toLowerCase());
            if (unit) {
                setUnitStatus(unit.id, action.newStatus);
                toast({
                    title: 'KI-Befehl ausgeführt',
                    description: `Status von ${unit.name} wurde auf "${action.newStatus}" gesetzt.`
                });
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Fehler bei Befehlsausführung',
                    description: `Einheit "${action.unitName}" wurde nicht gefunden.`
                });
            }
        } else if (action.action === 'SEND_MESSAGE') {
             const group = groups.find(g => g.name.toLowerCase() === action.groupName.toLowerCase());
             if (group) {
                sendMessage(action.message, group.id);
                 toast({
                    title: 'KI-Befehl ausgeführt',
                    description: `Nachricht an Gruppe "${group.name}" gesendet.`
                });
             } else {
                 toast({
                    variant: 'destructive',
                    title: 'Fehler bei Befehlsausführung',
                    description: `Gruppe "${action.groupName}" wurde nicht gefunden.`
                });
             }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', text: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        scrollToBottom();
        
        const compactUnits = units.map(unit => ({
            i: unit.id,
            t: UNIT_TYPE_TO_CODE[unit.type],
            s: UNIT_STATUS_TO_CODE[unit.status],
            p: {
                a: parseFloat(unit.position.lat.toFixed(5)),
                o: parseFloat(unit.position.lng.toFixed(5)),
            },
            v: unit.speed,
            h: unit.heading,
            b: parseFloat(unit.battery.toFixed(1)),
            ts: unit.timestamp,
            si: unit.sendInterval,
            a: unit.isActive ? 1 : 0,
        }));

        const unitNames = units.reduce((acc, unit) => {
            acc[unit.id] = unit.name;
            return acc;
        }, {} as Record<number, string>);

        const result = await invokeAiAssistant(userMessage.text, compactUnits, groups, unitNames);
        
        const aiMessage: Message = { role: 'ai', text: result.responseText };
        setMessages(prev => [...prev, aiMessage]);

        if (result.actions && result.actions.length > 0) {
            result.actions.forEach(handleAction);
        }

        setIsLoading(false);
        scrollToBottom();
    };

    return (
        <div className="container mx-auto max-w-4xl py-8 h-full">
            <Card className="h-full flex flex-col bg-card/50">
                <CardHeader>
                    <div className='flex items-center gap-3'>
                        <Bot className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle className="text-2xl">KI-Assistent</CardTitle>
                            <CardDescription>
                                Interagieren Sie per Chat mit der Leitstelle. Fragen Sie nach dem Status oder erteilen Sie Befehle.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                    <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
                        <div className="space-y-6">
                            {messages.map((message, index) => (
                                <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                                    {message.role === 'ai' && (
                                        <Avatar className="w-8 h-8 border">
                                            <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={`rounded-lg px-4 py-2 max-w-[80%] ${message.role === 'ai' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                                    </div>
                                    {message.role === 'user' && (
                                        <Avatar className="w-8 h-8 border">
                                           <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-start gap-3">
                                    <Avatar className="w-8 h-8 border">
                                        <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                                    </Avatar>
                                     <div className="rounded-lg px-4 py-3 bg-muted">
                                        <Loader2 className="h-5 w-5 animate-spin"/>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    <form onSubmit={handleSubmit} className="flex gap-2 border-t pt-4">
                        <Input 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Fragen Sie etwas oder geben Sie einen Befehl..."
                            disabled={isLoading}
                        />
                        <Button type="submit" disabled={isLoading || !inputValue.trim()}>
                            <Send className="mr-2 h-4 w-4"/>
                            Senden
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
