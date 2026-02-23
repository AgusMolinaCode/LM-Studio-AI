"use client";

import { useState, useCallback } from "react";
import { FormInput } from "@/components/FormInput";

interface Product {
  title: string;
  price: string;
  imageUrl: string;
}

interface PageInfo {
  description: string;
  breadcrumbs: string;
  title: string;
  htmlLength: number;
}

interface ScrapeResponse {
  description?: string;
  products?: Product[];
  pageInfo?: PageInfo;
  url?: string;
  scrapingError?: boolean;
  errorDetails?: string;
  error?: string;
}

interface FormState {
  year: string;
  make: string;
  model: string;
}

interface ResultState {
  description: string;
  products: Product[];
  pageInfo: PageInfo | null;
  url: string;
  error: string;
}

// Estado inicial reutilizable
const INITIAL_FORM_STATE: FormState = {
  year: "2022",
  make: "honda",
  model: "crf-250-r",
};

const INITIAL_RESULT_STATE: ResultState = {
  description: "",
  products: [],
  pageInfo: null,
  url: "",
  error: "",
};

export default function Home() {
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ResultState>(INITIAL_RESULT_STATE);

  // Helper para actualizar campos del formulario
  const updateFormField = useCallback(
    (field: keyof FormState) => (value: string) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Resetear resultado
  const resetResult = useCallback(() => {
    setResult(INITIAL_RESULT_STATE);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetResult();

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });

      const data: ScrapeResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al realizar el scraping");
      }

      setResult({
        description: data.description ?? "",
        products: data.products ?? [],
        pageInfo: data.pageInfo ?? null,
        url: data.url ?? "",
        error: data.scrapingError
          ? `Error durante el scraping: ${data.errorDetails || "Detalles no disponibles"}`
          : "",
      });
    } catch (error) {
      console.error("Error:", error);
      setResult((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : String(error),
      }));
    } finally {
      setLoading(false);
    }
  };

  // Configuración de campos del formulario
  const formFields = [
    {
      id: "year",
      label: "Año",
      value: formState.year,
      onChange: updateFormField("year"),
      placeholder: "Ej: 2022",
    },
    {
      id: "make",
      label: "Marca",
      value: formState.make,
      onChange: updateFormField("make"),
      placeholder: "Ej: honda",
    },
    {
      id: "model",
      label: "Modelo",
      value: formState.model,
      onChange: updateFormField("model"),
      placeholder: "Ej: crf-250-r",
    },
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Buscador de Pistones Pro-X</h1>

      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {formFields.map((field) => (
            <FormInput key={field.id} {...field} />
          ))}
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
          disabled={loading}
        >
          {loading ? "Buscando..." : "Buscar información"}
        </button>
      </form>

      {result.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-4">
          <h2 className="font-semibold">Error:</h2>
          <p>{result.error}</p>
        </div>
      )}

      {result.url && (
        <div className="mb-4">
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Ver página original
          </a>
        </div>
      )}

      {result.description && (
        <div className="bg-gray-800 text-white p-4 rounded mb-6">
          <h2 className="text-xl font-semibold mb-2">Descripción:</h2>
          <div className="whitespace-pre-wrap">{result.description}</div>
        </div>
      )}

      {result.products.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Productos encontrados:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.products.map((product, index) => (
              <div key={index} className="border rounded p-4">
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-40 object-contain mb-2"
                  />
                )}
                <h3 className="font-medium">{product.title}</h3>
                {product.price && (
                  <p className="text-green-600">{product.price}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {result.pageInfo && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Información de la página:</h2>
          {result.pageInfo.title && (
            <p>
              <strong>Título:</strong> {result.pageInfo.title}
            </p>
          )}
          {result.pageInfo.breadcrumbs && (
            <p>
              <strong>Ruta:</strong> {result.pageInfo.breadcrumbs}
            </p>
          )}
          {result.pageInfo.description && (
            <div>
              <p><strong>Descripción original:</strong></p>
              <p className="italic">{result.pageInfo.description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
