'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Commissionerate = {
  id: number;
  name: string;
  code: string | null;
};

type DCPZone = {
  id: number;
  name: string;
  code: string | null;
  commissionerateId: number;
  commissionerate?: Commissionerate;
};

type MunicipalZone = {
  id: number;
  name: string;
  code: string | null;
  dcpZoneId: number;
  dcpZone?: DCPZone;
};

type ACPDivision = {
  id: number;
  name: string;
  code: string | null;
  municipalZoneId: number;
  municipalZone?: MunicipalZone;
};

export default function MasterDataManagement() {
  const [loading, setLoading] = useState(false);

  const [commissionerates, setCommissionerates] = useState<Commissionerate[]>([]);
  const [dcpZones, setDcpZones] = useState<DCPZone[]>([]);
  const [municipalZones, setMunicipalZones] = useState<MunicipalZone[]>([]);
  const [acpDivisions, setAcpDivisions] = useState<ACPDivision[]>([]);

  const [newCommissionerate, setNewCommissionerate] = useState({ name: '', code: '' });
  const [newDcpZone, setNewDcpZone] = useState({ name: '', code: '', commissionerateId: '' });
  const [newMunicipalZone, setNewMunicipalZone] = useState({ name: '', code: '', dcpZoneId: '' });
  const [newAcpDivision, setNewAcpDivision] = useState({ name: '', code: '', municipalZoneId: '' });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [commRes, dcpRes, munRes, acpRes] = await Promise.all([
        fetch('/api/master/commissionerates'),
        fetch('/api/master/dcp-zones'),
        fetch('/api/master/municipal-zones'),
        fetch('/api/master/acp-divisions'),
      ]);

      if (commRes.ok) setCommissionerates(await commRes.json());
      if (dcpRes.ok) setDcpZones(await dcpRes.json());
      if (munRes.ok) setMunicipalZones(await munRes.json());
      if (acpRes.ok) setAcpDivisions(await acpRes.json());
    } catch (error) {
      console.error('Error fetching master data:', error);
      alert('Failed to load master data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreate = async (type: 'commissionerate' | 'dcp' | 'municipal' | 'acp') => {
    try {
      let url = '';
      let body: any = {};

      if (type === 'commissionerate') {
        url = '/api/master/commissionerates';
        body = newCommissionerate;
      } else if (type === 'dcp') {
        url = '/api/master/dcp-zones';
        body = {
          ...newDcpZone,
          commissionerateId: newDcpZone.commissionerateId,
        };
      } else if (type === 'municipal') {
        url = '/api/master/municipal-zones';
        body = {
          ...newMunicipalZone,
          dcpZoneId: newMunicipalZone.dcpZoneId,
        };
      } else if (type === 'acp') {
        url = '/api/master/acp-divisions';
        body = {
          ...newAcpDivision,
          municipalZoneId: newAcpDivision.municipalZoneId,
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchAll();
        if (type === 'commissionerate') setNewCommissionerate({ name: '', code: '' });
        if (type === 'dcp') setNewDcpZone({ name: '', code: '', commissionerateId: '' });
        if (type === 'municipal') setNewMunicipalZone({ name: '', code: '', dcpZoneId: '' });
        if (type === 'acp') setNewAcpDivision({ name: '', code: '', municipalZoneId: '' });
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create record');
      }
    } catch (error) {
      console.error('Error creating master record:', error);
      alert('An error occurred');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Master Data Management</h2>
        <p className="text-muted-foreground">
          Manage jurisdiction master data used across complaints.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Master Tables</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="commissionerates">
            <TabsList>
              <TabsTrigger value="commissionerates">Commissionerates</TabsTrigger>
              <TabsTrigger value="dcpZones">DCP Zones</TabsTrigger>
              <TabsTrigger value="municipalZones">Municipal Zones</TabsTrigger>
              <TabsTrigger value="acpDivisions">ACP Divisions</TabsTrigger>
            </TabsList>

            <TabsContent value="commissionerates" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newCommissionerate.name}
                    onChange={(e) =>
                      setNewCommissionerate((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Commissionerate name"
                  />
                </div>
                <div>
                  <Label>Code (optional)</Label>
                  <Input
                    value={newCommissionerate.code}
                    onChange={(e) =>
                      setNewCommissionerate((prev) => ({ ...prev, code: e.target.value }))
                    }
                    placeholder="Code"
                  />
                </div>
                <Button
                  onClick={() => handleCreate('commissionerate')}
                  disabled={loading || !newCommissionerate.name.trim()}
                >
                  Add Commissionerate
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissionerates.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.id}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.code || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="dcpZones" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newDcpZone.name}
                    onChange={(e) =>
                      setNewDcpZone((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="DCP Zone name"
                  />
                </div>
                <div>
                  <Label>Code (optional)</Label>
                  <Input
                    value={newDcpZone.code}
                    onChange={(e) =>
                      setNewDcpZone((prev) => ({ ...prev, code: e.target.value }))
                    }
                    placeholder="Code"
                  />
                </div>
                <div>
                  <Label>Commissionerate</Label>
                  <Select
                    value={newDcpZone.commissionerateId}
                    onValueChange={(value) =>
                      setNewDcpZone((prev) => ({ ...prev, commissionerateId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select commissionerate" />
                    </SelectTrigger>
                    <SelectContent>
                      {commissionerates.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => handleCreate('dcp')}
                  disabled={
                    loading ||
                    !newDcpZone.name.trim() ||
                    !newDcpZone.commissionerateId
                  }
                >
                  Add DCP Zone
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Commissionerate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dcpZones.map((z) => (
                    <TableRow key={z.id}>
                      <TableCell>{z.id}</TableCell>
                      <TableCell>{z.name}</TableCell>
                      <TableCell>{z.code || '-'}</TableCell>
                      <TableCell>{z.commissionerate?.name || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="municipalZones" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newMunicipalZone.name}
                    onChange={(e) =>
                      setNewMunicipalZone((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Municipal Zone name"
                  />
                </div>
                <div>
                  <Label>Code (optional)</Label>
                  <Input
                    value={newMunicipalZone.code}
                    onChange={(e) =>
                      setNewMunicipalZone((prev) => ({ ...prev, code: e.target.value }))
                    }
                    placeholder="Code"
                  />
                </div>
                <div>
                  <Label>DCP Zone</Label>
                  <Select
                    value={newMunicipalZone.dcpZoneId}
                    onValueChange={(value) =>
                      setNewMunicipalZone((prev) => ({ ...prev, dcpZoneId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select DCP zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {dcpZones.map((z) => (
                        <SelectItem key={z.id} value={String(z.id)}>
                          {z.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => handleCreate('municipal')}
                  disabled={
                    loading ||
                    !newMunicipalZone.name.trim() ||
                    !newMunicipalZone.dcpZoneId
                  }
                >
                  Add Municipal Zone
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>DCP Zone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {municipalZones.map((z) => (
                    <TableRow key={z.id}>
                      <TableCell>{z.id}</TableCell>
                      <TableCell>{z.name}</TableCell>
                      <TableCell>{z.code || '-'}</TableCell>
                      <TableCell>{z.dcpZone?.name || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="acpDivisions" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newAcpDivision.name}
                    onChange={(e) =>
                      setNewAcpDivision((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="ACP Division name"
                  />
                </div>
                <div>
                  <Label>Code (optional)</Label>
                  <Input
                    value={newAcpDivision.code}
                    onChange={(e) =>
                      setNewAcpDivision((prev) => ({ ...prev, code: e.target.value }))
                    }
                    placeholder="Code"
                  />
                </div>
                <div>
                  <Label>Municipal Zone</Label>
                  <Select
                    value={newAcpDivision.municipalZoneId}
                    onValueChange={(value) =>
                      setNewAcpDivision((prev) => ({ ...prev, municipalZoneId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select municipal zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {municipalZones.map((z) => (
                        <SelectItem key={z.id} value={String(z.id)}>
                          {z.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => handleCreate('acp')}
                  disabled={
                    loading ||
                    !newAcpDivision.name.trim() ||
                    !newAcpDivision.municipalZoneId
                  }
                >
                  Add ACP Division
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Municipal Zone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {acpDivisions.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.id}</TableCell>
                      <TableCell>{d.name}</TableCell>
                      <TableCell>{d.code || '-'}</TableCell>
                      <TableCell>{d.municipalZone?.name || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}


