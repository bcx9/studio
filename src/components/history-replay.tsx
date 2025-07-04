
'use client';

import * as React from 'react';
import type { UnitHistoryPoint } from '@/types/mesh';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, History } from 'lucide-react';

interface HistoryReplayProps {
  unitHistory: Record<number, UnitHistoryPoint[]>;
  isReplaying: boolean;
  onToggleReplay: (active: boolean) => void;
  onTimeChange: (timestamp: number) => void;
}

export default function HistoryReplay({ unitHistory, isReplaying, onToggleReplay, onTimeChange }: HistoryReplayProps) {
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [currentTime, setCurrentTime] = React.useState(0);
    const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

    const timeRange = React.useMemo(() => {
        let min = Infinity;
        let max = -Infinity;
        Object.values(unitHistory).forEach(history => {
            if (history.length > 0) {
                min = Math.min(min, history[history.length - 1].timestamp);
                max = Math.max(max, history[0].timestamp);
            }
        });
        return { min, max };
    }, [unitHistory]);

    React.useEffect(() => {
        if (timeRange.max > 0 && !isReplaying) {
            setCurrentTime(timeRange.max);
        }
    }, [timeRange.max, isReplaying]);
    
     React.useEffect(() => {
        if (isPlaying && isReplaying) {
            intervalRef.current = setInterval(() => {
                setCurrentTime(prevTime => {
                    const nextTime = prevTime + 1000;
                    if (nextTime > timeRange.max) {
                        setIsPlaying(false);
                        return timeRange.max;
                    }
                    onTimeChange(nextTime);
                    return nextTime;
                });
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isPlaying, isReplaying, onTimeChange, timeRange.max]);


    const handleToggleReplay = () => {
        const nextState = !isReplaying;
        onToggleReplay(nextState);
        if (!nextState) {
            setIsPlaying(false);
        } else {
            setCurrentTime(timeRange.min);
            onTimeChange(timeRange.min);
        }
    };
    
    const handleSliderChange = (value: number[]) => {
        setCurrentTime(value[0]);
        onTimeChange(value[0]);
    };

    const hasHistory = timeRange.min !== Infinity;
    
    return (
        <div className="container mx-auto max-w-4xl py-8">
            <Card className="bg-card/50">
                <CardHeader>
                    <div className='flex items-center gap-3'>
                        <History className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle className="text-2xl">Verlauf & Replay</CardTitle>
                            <CardDescription>
                                Analysieren Sie vergangene Ereignisse, indem Sie den aufgezeichneten Datenverkehr abspielen.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {!hasHistory ? (
                        <p className='text-muted-foreground'>Keine Verlaufsdaten vorhanden. Starten Sie das Gateway, um Daten aufzuzeichnen.</p>
                    ) : (
                        <div className="space-y-6">
                            <Button onClick={handleToggleReplay} variant={isReplaying ? "secondary" : "default"}>
                                {isReplaying ? "Replay-Modus beenden" : "Replay-Modus starten"}
                            </Button>
                            
                            {isReplaying && (
                                <div className="space-y-4 animate-in fade-in-50">
                                    <div className="flex items-center gap-4">
                                        <Button onClick={() => setIsPlaying(!isPlaying)} size="icon" disabled={currentTime >= timeRange.max}>
                                            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                                        </Button>
                                        <div className="flex-1">
                                            <Slider 
                                                min={timeRange.min} 
                                                max={timeRange.max} 
                                                step={1000}
                                                value={[currentTime]}
                                                onValueChange={handleSliderChange}
                                            />
                                        </div>
                                        <div className="text-sm font-mono w-48 text-right">
                                            {new Date(currentTime).toLocaleString('de-DE')}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
