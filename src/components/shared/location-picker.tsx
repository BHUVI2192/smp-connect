"use client";

import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { LocationSelection } from "@/types";

interface LocationOption {
  id: number;
  name: string;
}

interface LocationPickerProps {
  value: LocationSelection;
  onChange: (value: LocationSelection) => void;
  showVillage?: boolean;
}

export function LocationPicker({ value, onChange, showVillage = true }: LocationPickerProps) {
  const [states, setStates] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [taluks, setTaluks] = useState<LocationOption[]>([]);
  const [panchayats, setPanchayats] = useState<LocationOption[]>([]);
  const [villages, setVillages] = useState<LocationOption[]>([]);

  useEffect(() => {
    fetch("/api/locations/states").then((r) => r.json()).then((d) => setStates(d.data || []));
  }, []);

  useEffect(() => {
    if (value.stateId) {
      fetch(`/api/locations/districts?stateId=${value.stateId}`)
        .then((r) => r.json())
        .then((d) => setDistricts(d.data || []));
    } else {
      setDistricts([]);
    }
  }, [value.stateId]);

  useEffect(() => {
    if (value.districtId) {
      fetch(`/api/locations/taluks?districtId=${value.districtId}`)
        .then((r) => r.json())
        .then((d) => setTaluks(d.data || []));
    } else {
      setTaluks([]);
    }
  }, [value.districtId]);

  useEffect(() => {
    if (value.talukId) {
      fetch(`/api/locations/panchayats?talukId=${value.talukId}`)
        .then((r) => r.json())
        .then((d) => setPanchayats(d.data || []));
    } else {
      setPanchayats([]);
    }
  }, [value.talukId]);

  useEffect(() => {
    if (value.panchayatId && showVillage) {
      fetch(`/api/locations/villages?panchayatId=${value.panchayatId}`)
        .then((r) => r.json())
        .then((d) => setVillages(d.data || []));
    } else {
      setVillages([]);
    }
  }, [value.panchayatId, showVillage]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label className="text-xs">State</Label>
        <Select
          value={value.stateId?.toString() || ""}
          onValueChange={(v) =>
            onChange({ stateId: parseInt(v), districtId: undefined, talukId: undefined, panchayatId: undefined, villageId: undefined })
          }
        >
          <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
          <SelectContent>
            {states.map((s) => (
              <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">District</Label>
        <Select
          value={value.districtId?.toString() || ""}
          onValueChange={(v) =>
            onChange({ ...value, districtId: parseInt(v), talukId: undefined, panchayatId: undefined, villageId: undefined })
          }
          disabled={!value.stateId}
        >
          <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
          <SelectContent>
            {districts.map((d) => (
              <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Taluk</Label>
        <Select
          value={value.talukId?.toString() || ""}
          onValueChange={(v) =>
            onChange({ ...value, talukId: parseInt(v), panchayatId: undefined, villageId: undefined })
          }
          disabled={!value.districtId}
        >
          <SelectTrigger><SelectValue placeholder="Select taluk" /></SelectTrigger>
          <SelectContent>
            {taluks.map((t) => (
              <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Panchayat</Label>
        <Select
          value={value.panchayatId?.toString() || ""}
          onValueChange={(v) =>
            onChange({ ...value, panchayatId: parseInt(v), villageId: undefined })
          }
          disabled={!value.talukId}
        >
          <SelectTrigger><SelectValue placeholder="Select panchayat" /></SelectTrigger>
          <SelectContent>
            {panchayats.map((p) => (
              <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showVillage && (
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs">Village</Label>
          <Select
            value={value.villageId?.toString() || ""}
            onValueChange={(v) => onChange({ ...value, villageId: parseInt(v) })}
            disabled={!value.panchayatId}
          >
            <SelectTrigger><SelectValue placeholder="Select village" /></SelectTrigger>
            <SelectContent>
              {villages.map((v) => (
                <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
