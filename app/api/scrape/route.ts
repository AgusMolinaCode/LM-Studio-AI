import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import { LMStudioClient } from "@lmstudio/sdk";

/**
 * Genera una descripción de producto usando LM Studio
 * @param llmModel - Modelo de LM Studio a utilizar
 * @param year - Año de la motocicleta
 * @param make - Marca de la motocicleta
 * @param model - Modelo de la motocicleta
 * @param productInfo - Información de productos encontrados
 * @param pageContent - Contenido de la página web
 * @param isFallback - Si es true, genera descripción genérica
 * @returns Descripción generada en español
 */
async function generateDescription(
  llmModel: any,
  year: string,
  make: string,
  model: string,
  productInfo: any[],
  pageContent: { description?: string; title?: string },
  isFallback: boolean = false
) {
  const basePrompt = `Genera una descripción detallada en español para pistones Pro-X para una motocicleta ${make} ${model} del año ${year}.

La descripción debe incluir:
1. Características principales de los pistones Pro-X
2. Compatibilidad con el modelo específico
3. Ventajas de usar pistones Pro-X
4. Recomendaciones de instalación generales`;

  const enhancedPrompt = isFallback
    ? `${basePrompt}

Nota: Esta es una descripción genérica ya que no se pudo obtener información específica del producto.`
    : `${basePrompt}

Información de la página: ${pageContent.description || pageContent.title || 'No disponible'}

Productos encontrados: ${JSON.stringify(productInfo)}`;

  console.log(isFallback ? "Generando descripción fallback..." : "Generando descripción con LM Studio...");
  const result = await llmModel.respond(enhancedPrompt);
  return result.content;
}

export async function POST(request: NextRequest) {
  try {
    const { year, make, model } = await request.json();

    // Construir la URL para el scraping
    const url = `https://www.pro-x.com/product-category/engine/pistons-piston-components/piston-kits/yr-${year}/mk-${make}/ml-${model}/`;

    console.log(`Iniciando scraping de: ${url}`);

    // Iniciar Playwright para hacer scraping
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(url, { timeout: 30000 });
      console.log("Página cargada correctamente");

      // Esperar a que cargue el contenido
      await page.waitForLoadState('networkidle');

      // Capturar una captura de pantalla para depuración (opcional)
      // await page.screenshot({ path: 'screenshot.png' });

      // Extraer información de los productos
      const productInfo = await page.evaluate(() => {
        const products = Array.from(document.querySelectorAll('.product'));
        if (products.length === 0) {
          // Intentar con otros selectores si no encuentra productos
          const alternativeProducts = Array.from(document.querySelectorAll('.products .product, ul.products li'));
          if (alternativeProducts.length > 0) {
            return alternativeProducts.map(product => {
              const title = product.querySelector('h2, .woocommerce-loop-product__title')?.textContent?.trim() || '';
              const price = product.querySelector('.price, .amount')?.textContent?.trim() || '';
              const imageUrl = product.querySelector('img')?.getAttribute('src') || '';
              return { title, price, imageUrl };
            });
          }
        }

        return products.map(product => {
          const title = product.querySelector('.woocommerce-loop-product__title')?.textContent?.trim() || '';
          const price = product.querySelector('.price')?.textContent?.trim() || '';
          const imageUrl = product.querySelector('img')?.getAttribute('src') || '';
          return { title, price, imageUrl };
        });
      });

      // Extraer información adicional de la página
      const pageContent = await page.evaluate(() => {
        const description = document.querySelector('.term-description')?.textContent?.trim() || '';
        const breadcrumbs = document.querySelector('.woocommerce-breadcrumb')?.textContent?.trim() || '';
        const title = document.querySelector('h1.page-title')?.textContent?.trim() || '';
        const rawHtml = document.documentElement.outerHTML;
        return { description, breadcrumbs, title, htmlLength: rawHtml.length };
      });

      // Obtener el HTML de la página para análisis
      const htmlContent = await page.content();
      const htmlPreview = htmlContent.substring(0, 500) + '...';

      console.log(`Productos encontrados: ${productInfo.length}`);
      console.log(`Información de página obtenida: ${Object.keys(pageContent).join(', ')}`);

      await browser.close();

      // Generar descripción con LM Studio
      const client = new LMStudioClient();
      const llmModel = await client.llm.model("oh-dcft-v3.1-claude-3-5-sonnet-20241022");

      const description = await generateDescription(
        llmModel,
        year,
        make,
        model,
        productInfo,
        { description: pageContent.description, title: pageContent.title }
      );

      return NextResponse.json({ 
        description,
        products: productInfo,
        pageInfo: pageContent,
        url: url,
        htmlPreview: htmlPreview
      });

    } catch (scrapingError) {
      console.error('Error durante el scraping:', scrapingError);
      await browser.close();
      
      // Si falla el scraping, generamos una descripción genérica
      const client = new LMStudioClient();
      const llmModel = await client.llm.model("oh-dcft-v3.1-claude-3-5-sonnet-20241022");

      const description = await generateDescription(
        llmModel,
        year,
        make,
        model,
        [],
        {},
        true
      );

      return NextResponse.json({ 
        description,
        scrapingError: true,
        errorDetails: scrapingError instanceof Error ? scrapingError.message : String(scrapingError),
        url: url
      });
    }
  } catch (error) {
    console.error('Error general:', error);
    return NextResponse.json(
      { 
        error: 'Error al realizar el scraping', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}