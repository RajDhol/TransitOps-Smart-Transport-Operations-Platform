'use client';

import React, { useState } from 'react';
import Input from './Input';
import Select from './Select';
import Button from './Button';

export interface FormFieldSchema {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'password' | 'date';
  placeholder?: string;
  required?: boolean;
  options?: { value: string | number; label: string }[];
}

interface DynamicFormProps {
  schema: FormFieldSchema[];
  onSubmit: (data: Record<string, string>) => void;
  submitLabel: string;
  errors?: Record<string, string>;
  initialData?: Record<string, string>;
}

export default function DynamicForm({
  schema,
  onSubmit,
  submitLabel,
  errors = {},
  initialData = {},
}: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const defaultData: Record<string, string> = {};
    schema.forEach((field) => {
      // Set initial value to passed data or fallback to defaults
      defaultData[field.name] = initialData[field.name] || (field.type === 'select' && field.options ? String(field.options[0]?.value) : '');
    });
    return defaultData;
  });

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {schema.map((field) => {
        if (field.type === 'select' && field.options) {
          return (
            <Select
              key={field.name}
              label={field.label}
              value={formData[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              options={field.options}
              error={errors[field.name]}
              required={field.required}
            />
          );
        }

        return (
          <Input
            key={field.name}
            label={field.label}
            type={field.type}
            placeholder={field.placeholder}
            value={formData[field.name]}
            onChange={(e) => handleChange(field.name, e.target.value)}
            error={errors[field.name]}
            required={field.required}
          />
        );
      })}

      <div className="pt-2">
        <Button type="submit" fullWidth>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
