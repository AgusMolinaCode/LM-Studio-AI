"use client";

import React, { InputHTMLAttributes } from "react";

// Tipos de input HTML5 válidos para formularios
type InputType = "text" | "email" | "password" | "number" | "tel" | "url" | "search";

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "type"> {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  type?: InputType;
}

export const FormInput: React.FC<FormInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = true,
  type = "text",
  className = "",
  ...rest
}) => {
  return (
    <div>
      <label htmlFor={id} className="block mb-1 font-medium">
        {label}
      </label>
      <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-2 border rounded ${className}`}
        placeholder={placeholder}
        required={required}
        {...rest}
      />
    </div>
  );
};
