"use client";

import React from "react";

interface FormInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  type?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = true,
  type = "text",
}) => {
  return (
    <div>
      <label htmlFor={id} className="block mb-1 font-medium">
        {label}
      </label>
      <input
        type={type}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border rounded"
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
};
