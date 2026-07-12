'use client';

import React from 'react';
import { FILTER_OPTIONS } from '../../constants/dashboardContent';
import Select from '../ui/Select';
import Card from '../ui/Card';

interface DashboardFiltersProps {
  selectedType: string;
  setSelectedType: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  selectedRegion: string;
  setSelectedRegion: (value: string) => void;
}

export default function DashboardFilters({
  selectedType,
  setSelectedType,
  selectedStatus,
  setSelectedStatus,
  selectedRegion,
  setSelectedRegion,
}: DashboardFiltersProps) {
  return (
    <Card variant="gray" title="Interactive Fleet Filters" subtitle="Refine metrics and asset lists in real-time.">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Select
          label="Vehicle Type"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          options={FILTER_OPTIONS.types}
        />
        <Select
          label="Operational Status"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          options={FILTER_OPTIONS.statuses}
        />
        <Select
          label="Region / Location"
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          options={FILTER_OPTIONS.regions}
        />
      </div>
    </Card>
  );
}
