'use client';

import React from 'react';
import { MockVehicle } from '../../constants/dashboardContent';
import Select from '../ui/Select';
import Card from '../ui/Card';

interface DashboardFiltersProps {
  vehicles: MockVehicle[];
  selectedType: string;
  setSelectedType: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  selectedRegion: string;
  setSelectedRegion: (value: string) => void;
}

export default function DashboardFilters({
  vehicles,
  selectedType,
  setSelectedType,
  selectedStatus,
  setSelectedStatus,
  selectedRegion,
  setSelectedRegion,
}: DashboardFiltersProps) {
  // Dynamically compute existing values in the current database
  const uniqueTypes = Array.from(new Set(vehicles.map((v) => v.type).filter(Boolean)));
  const uniqueStatuses = Array.from(new Set(vehicles.map((v) => v.status).filter(Boolean)));
  const uniqueRegions = Array.from(new Set(vehicles.map((v) => v.region).filter(Boolean)));

  const typeOptions = [
    { value: '', label: 'All Types' },
    ...uniqueTypes.map((t) => ({ value: t, label: t })),
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...uniqueStatuses.map((s) => ({ value: s, label: s })),
  ];

  const regionOptions = [
    { value: '', label: 'All Regions' },
    ...uniqueRegions.map((r) => ({ value: r, label: r.toUpperCase() })),
  ];

  return (
    <Card variant="gray">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Select
          label="Vehicle Type"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          options={typeOptions}
        />
        <Select
          label="Operational Status"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          options={statusOptions}
        />
        <Select
          label="Region / Location"
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          options={regionOptions}
        />
      </div>
    </Card>
  );
}
