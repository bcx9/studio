
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings } from 'lucide-react';
import { CODE_TO_UNIT_STATUS, CODE_TO_UNIT_TYPE } from '@/types/mesh';

export default function AdminSettings() {

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card className="bg-card/50">
        <CardHeader>
          <div className='flex items-center gap-3'>
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">System-Administration</CardTitle>
              <CardDescription>
                Übersicht der systemweiten ID-Konfigurationen. In einer realen Anwendung würden diese Werte aus einer Datenbank geladen und hier bearbeitbar sein.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6 pt-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Einheitentyp-IDs</h3>
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[120px]">ID</TableHead>
                        <TableHead>Typ-Bezeichnung</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.entries(CODE_TO_UNIT_TYPE).map(([id, name]) => (
                            <TableRow key={id}>
                                <TableCell className="font-mono">{id}</TableCell>
                                <TableCell>{name}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          </div>

           <div>
            <h3 className="text-lg font-semibold mb-2">Status-IDs</h3>
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[120px]">ID</TableHead>
                        <TableHead>Status-Bezeichnung</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {Object.entries(CODE_TO_UNIT_STATUS).map(([id, name]) => (
                            <TableRow key={id}>
                                <TableCell className="font-mono">{id}</TableCell>
                                <TableCell>{name}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
