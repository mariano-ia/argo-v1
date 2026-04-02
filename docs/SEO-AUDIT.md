# SEO Content Audit
## argomethod.com
### Fecha: 2 de abril de 2026

---

## SEO Health Score: 38/100

> El score bajo se debe a un problema estructural: al ser una SPA (Single Page Application) sin pre-rendering, Google ve el mismo HTML para TODAS las paginas. El contenido de blog, pricing, etc. solo existe despues de ejecutar JavaScript. Esto es lo mas critico de resolver.

---

## Resumen ejecutivo

argomethod.com tiene buen contenido, buen structured data en la homepage, y un blog engine con potencial. Pero el 70% de ese esfuerzo es invisible para Google porque:

1. **Todas las paginas sirven el mismo HTML** (index.html). Google necesita ejecutar JS para ver contenido diferenciado.
2. **Solo 2 blog posts en el sitemap** (ambos en espanol). Las versiones EN/PT no aparecen.
3. **Falta og:image** en toda la plataforma (critico para social sharing).
4. **Sin hreflang fuera del blog**, y el blog solo lo tiene client-side (invisible al crawler inicial).
5. **BlogIndex, Pricing, Terms, Privacy** no tienen meta tags propios.

---

## 1. Problema critico: SPA sin pre-rendering

### Que pasa hoy

| Pagina | Lo que Google ve (HTML inicial) | Lo que deberia ver |
|--------|------|------|
| `/` | Homepage con meta tags, structured data, noscript fallback | ✓ Correcto |
| `/blog` | **Homepage** (mismo index.html) | Blog listing con titulo y description propios |
| `/blog/mi-post` | **Homepage** (mismo index.html) | Articulo con meta tags, JSON-LD Article, hreflang |
| `/pricing` | **Homepage** (mismo index.html) | Pagina de pricing con structured data |

### Evidencia

Al hacer fetch de `argomethod.com/blog`, el servidor devuelve:
- Title: "Argo Method — Inteligencia deportiva para ninos | Perfilamiento conductual DISC" (el de la homepage)
- H1: "Argo Method — Inteligencia deportiva para ninos" (el de la homepage)
- Structured data: Organization + WebApplication + FAQPage (los de la homepage)
- Cero contenido de blog

### Impacto

- Google puede **no indexar** los blog posts correctamente
- Los meta tags dinamicos (BlogPost.tsx) se inyectan via JavaScript, que el crawler puede no ejecutar
- El sitemap apunta a URLs que en el HTML crudo no contienen el contenido esperado
- Core Web Vitals afectados: LCP alto por JS rendering

### Solucion recomendada

**Opcion A (recomendada): Pre-rendering en build time**
Usar un plugin como `vite-ssg` o un script custom que genera HTML estatico para rutas publicas (`/`, `/blog`, `/blog/:slug`, `/pricing`, `/terms`, `/privacy`). Las rutas protegidas (`/app`, `/dashboard`, `/admin`) quedan como SPA.

**Opcion B: ISR (Incremental Static Regeneration)**
Vercel soporta ISR. Se puede crear un middleware que pre-renderiza las paginas publicas on-demand y las cachea.

**Opcion C (minima, inmediata): Mejorar el noscript fallback**
index.html ya tiene un `<noscript>` con contenido basico. Expandirlo para incluir links a blog posts y paginas clave. No ideal pero mejora la crawlabilidad sin cambiar el stack.

---

## 2. On-page SEO

### Title Tag
- **Estado:** Necesita trabajo
- **Actual:** "Argo Method — Inteligencia deportiva para ninos | Perfilamiento conductual DISC" (85 chars)
- **Problema:** Excede los 60 chars recomendados. Google lo truncara.
- **Recomendado:** "Argo Method | Perfilamiento conductual DISC para deportistas" (60 chars)

### Meta Description
- **Estado:** Necesita trabajo
- **Actual:** "Argo Method usa ciencia del comportamiento (DISC + Motor) para que entrenadores y padres comprendan como cada nino procesa el deporte. 12 arquetipos, un informe personalizado en 12 minutos." (199 chars)
- **Problema:** Excede los 160 chars. Google lo truncara.
- **Recomendado:** "Herramienta DISC para entrenadores y padres. 12 arquetipos conductuales que revelan como tu deportista vive el deporte. Prueba gratis." (138 chars)

### Open Graph Tags
| Tag | Estado | Valor actual |
|-----|--------|------|
| og:title | ✓ Pass | "Argo Method — Inteligencia deportiva para ninos" |
| og:description | ✓ Pass | Presente y diferente del meta description |
| og:url | ✓ Pass | https://argomethod.com/ |
| og:type | ✓ Pass | website |
| og:site_name | ✓ Pass | Argo Method |
| og:locale | ✓ Pass | es_AR + alternate en_US |
| **og:image** | **✗ FALTA** | **No existe. Critico para social sharing** |

### Twitter Card
| Tag | Estado |
|-----|--------|
| twitter:card | ⚠ "summary" (deberia ser "summary_large_image") |
| twitter:title | ✓ Pass |
| twitter:description | ✓ Pass |
| **twitter:image** | **✗ FALTA** |

### Heading Hierarchy (Landing)
```
H1: "Cada nino es unico. Argo descubre su manera ideal de vivir el deporte."
  H2: "Como funciona"
    H3: "01 — El juego"
    H3: "02 — La plataforma"
  H2: "50 especialistas. Una sola mision."
  H2: "Conducta + Motor = Sintonia."
  H2: "Sin etiquetas. Sin juicios clinicos."
  H2: "En que lugar de la nave esta tu atleta?"
```
- **Problema:** H1 es poetico pero no contiene keywords target. Ninguna mencion a "DISC", "perfilamiento", "entrenadores" en headings.
- **Recomendado:** Agregar un H2 con keyword principal. Ej: "Perfilamiento conductual DISC para deportistas juveniles"

### Keywords en headings

| Keyword target | Presente en headings? |
|------|------|
| Perfilamiento conductual | ✗ No |
| DISC deportivo | ✗ No |
| Test personalidad deportistas | ✗ No |
| Herramienta entrenadores | ✗ No |
| Arquetipos conductuales | ⚠ Solo en body, no en H2/H3 |

---

## 3. Structured Data (JSON-LD)

### Homepage
| Schema | Estado | Notas |
|--------|--------|-------|
| Organization | ✓ Pass | Falta: sameAs (redes sociales), contactPoint, logo |
| WebApplication | ✓ Pass | Falta: screenshot, aggregateRating |
| FAQPage | ✓ Pass | 4 Q&A. Excelente para rich snippets |

### Blog Posts
| Schema | Estado | Notas |
|--------|--------|-------|
| Article | ✓ Pass | Falta: dateModified, articleBody, image |
| BreadcrumbList | ✗ Falta | Deberia tener: Home > Blog > Post |

### Paginas sin schema
- `/blog` (listing) — falta CollectionPage o ItemList
- `/pricing` — falta Product/Offer o PriceSpecification
- `/signup` — no aplica
- `/terms`, `/privacy` — no aplica

---

## 4. Sitemap

### Estado actual
**URL:** https://argomethod.com/api/sitemap.xml
**Total URLs:** 5

| URL | Priority | Lastmod |
|-----|----------|---------|
| / | 1.0 | — |
| /blog | 0.9 | — |
| /app | 0.7 | — |
| /blog/deporte-revela-personalidad-hijo | 0.8 | 2026-04-01 |
| /blog/por-que-algunos-ninos-rinden-deporte-entorno-personalizado | 0.8 | 2026-03-17 |

### Problemas

1. **Solo 2 blog posts** (ambos en espanol). Las versiones EN/PT no aparecen.
2. **No incluye hreflang** (xhtml:link alternate) para versiones multilenguaje.
3. **Faltan paginas importantes:** /pricing, /terms, /privacy, /signup.
4. **/app no deberia estar** (requiere login, no tiene valor SEO).
5. **Sin lastmod** en paginas estaticas.

### Sitemap recomendado

```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://argomethod.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://argomethod.com/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://argomethod.com/blog/mi-post-es</loc>
    <xhtml:link rel="alternate" hreflang="es" href="https://argomethod.com/blog/mi-post-es"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://argomethod.com/blog/my-post-en"/>
    <xhtml:link rel="alternate" hreflang="pt" href="https://argomethod.com/blog/meu-post-pt"/>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- ... repeat for each lang_group ... -->
</urlset>
```

---

## 5. International SEO (hreflang)

### Estado actual

| Pagina | hreflang | Metodo |
|--------|----------|--------|
| Homepage | ✗ No | Solo og:locale:alternate (no es hreflang) |
| Blog posts | ⚠ Parcial | Client-side JS (invisible al HTML inicial) |
| Blog index | ✗ No | — |
| Otras paginas | ✗ No | — |

### Problemas

1. **Routing por cookie/JS:** Todas las paginas usan la misma URL en los 3 idiomas. Google no puede diferenciar versiones.
2. **hreflang solo client-side:** Los tags se inyectan via useEffect() despues del render. Google probablemente no los ve.
3. **Sitemap sin hreflang:** El sitemap no incluye xhtml:link alternate.
4. **Sin x-default:** Falta la declaracion hreflang x-default para idioma fallback.
5. **Blog posts con slugs por idioma:** Los posts SI tienen URLs distintas por idioma (via lang_group), pero no estan enlazados en el sitemap.

### Solucion recomendada

**Para blog:** Incluir hreflang en el sitemap (server-side, no depende de JS).
**Para paginas estaticas:** O bien crear URLs por idioma (/es/, /en/, /pt/) o declarar hreflang en el sitemap.

---

## 6. Blog SEO

### Puntos fuertes
- ✓ URLs limpias: `/blog/:slug`
- ✓ Article JSON-LD schema con inLanguage
- ✓ Meta tags dinamicos (title, description, OG)
- ✓ Reading time visible
- ✓ Fecha de publicacion con locale
- ✓ Language switcher en la nav del post
- ✓ Pipeline de humanizacion anti-IA
- ✓ Internal linking automatico entre posts

### Problemas

| Problema | Impacto | Esfuerzo |
|----------|---------|----------|
| Meta tags inyectados via JS (no en HTML inicial) | Alto | Alto (requiere pre-render) |
| BlogIndex sin meta tags propios | Medio | Bajo |
| Sin canonical tag explicito en posts | Medio | Bajo |
| Sin og:image (featured_image no usada) | Alto | Bajo |
| Sin dateModified en JSON-LD | Bajo | Bajo |
| Sin paginas de categoria/tag | Medio | Medio |
| Sin "Related Posts" | Medio | Medio |
| Sin paginacion en el listing | Bajo (pocas publicaciones aun) | Bajo |
| Blog link solo en footer de landing | Medio | Bajo |
| Sin breadcrumbs | Bajo | Bajo |

---

## 7. Technical SEO

### robots.txt
- **Estado:** ✓ Bien configurado
- Bloquea /dashboard y /api/
- Permite AI crawlers (GPTBot, ClaudeBot, PerplexityBot)
- Apunta al sitemap dinamico

### Canonical URL
- **Homepage:** ✓ Presente
- **Blog posts:** ✗ No explicito (solo og:url)
- **Otras paginas:** ✗ No presente

### Viewport
- ✓ Correcto: `width=device-width, initial-scale=1.0`
- ⚠ `user-scalable=no` puede afectar accesibilidad (algunos auditors lo penalizan)

### Pagina 404
- ✗ No existe. Rutas invalidas muestran pagina en blanco.
- Recomendado: Agregar `<Route path="*" element={<NotFound />} />` en App.tsx

### HTTPS
- ✓ SSL activo via Vercel

### Performance (SPA)
- ⚠ Bundle principal: 2,628 KB (comprimido: 699 KB). Excede el recomendado de 500 KB.
- ⚠ Sin code splitting para rutas publicas vs dashboard
- ⚠ Sin lazy loading de imagenes (solo 1 imagen en landing)

---

## 8. Content Quality (E-E-A-T)

| Dimension | Score | Evidencia |
|-----------|-------|-----------|
| **Experience** | Present | Los 12 arquetipos son contenido original. Pipeline de humanizacion elimina patrones IA. Brand voice definida. |
| **Expertise** | Present | "50 especialistas" mencionado en landing. FAQ demuestra conocimiento del dominio DISC. Lenguaje probabilistico correcto. |
| **Authoritativeness** | Weak | Sin backlinks visibles. Sin mentions en prensa. Sin sameAs a redes sociales en schema. Sin author bylines en blog. |
| **Trustworthiness** | Present | HTTPS activo. Clarifica "no es test psicologico" (honestidad). Precio visible. Sin terminologia clinica. |

---

## 9. Content Gap Analysis

### Temas que deberian existir (alta oportunidad SEO)

| Tema | Volumen estimado | Competencia | Tipo de contenido | Prioridad |
|------|-----------------|-------------|-------------------|-----------|
| "Test DISC para ninos" | Alto | Media | Landing + blog | 1 |
| "Tipos de personalidad en deportistas" | Alto | Baja | Blog (guia completa) | 1 |
| "Como motivar a un nino en el deporte" | Alto | Alta | Blog (con angulo Argo) | 2 |
| "Perfil conductual deportivo" | Medio | Baja | Blog + landing section | 2 |
| "DISC model youth sports" (EN) | Medio | Baja | Blog (ingles) | 2 |
| "Comunicacion entrenador jugador juvenil" | Medio | Media | Blog serie | 3 |
| "Burnout deportivo infantil" | Medio | Media | Blog (opinion) | 3 |
| "Modelo DISC que es" | Alto | Alta | Blog (intro + diferenciador Argo) | 3 |
| "Psicologia deportiva para padres" | Medio | Media | Blog serie | 4 |
| "Como saber si mi hijo disfruta el deporte" | Bajo | Baja | Blog (long-tail) | 4 |

---

## 10. Featured Snippet Opportunities

El FAQ de la landing ya esta optimizado para snippets. Oportunidades adicionales:

| Query target | Tipo de snippet | Como capturarlo |
|------|------|------|
| "que es el modelo DISC en deportes" | Parrafo | Blog post con H2 = la pregunta + respuesta de 40-60 palabras |
| "cuantos arquetipos deportivos existen" | Parrafo | Blog post mencionando "12 arquetipos" en primer parrafo |
| "como funciona el perfilamiento DISC" | Lista | Blog post con H2 + lista ordenada de pasos |
| "tipos de ninos deportistas" | Tabla | Blog post con tabla de arquetipos (nombre, eje, descripcion) |

---

## 11. Recomendaciones priorizadas

### CRITICO (resolver ya)

| # | Recomendacion | Impacto esperado | Esfuerzo |
|---|------|------|------|
| 1 | **Implementar pre-rendering para paginas publicas** (/, /blog, /blog/:slug, /pricing, /terms, /privacy) | Google indexa correctamente todas las paginas | Alto |
| 2 | **Agregar og:image** a index.html y generar previews sociales | +30-50% CTR en social sharing | Bajo |
| 3 | **Agregar hreflang al sitemap** (server-side, api/sitemap.xml.ts) con links entre versiones ES/EN/PT | Google indexa versiones multilenguaje correctamente | Medio |

### ALTA PRIORIDAD (este mes)

| # | Recomendacion | Impacto esperado | Esfuerzo |
|---|------|------|------|
| 4 | **Acortar title tag** a menos de 60 chars | Google muestra titulo completo en SERPs | 5 minutos |
| 5 | **Acortar meta description** a menos de 160 chars | Google muestra descripcion completa | 5 minutos |
| 6 | **Agregar meta tags a BlogIndex** (title, description, schema) | Pagina de blog indexada correctamente | 30 minutos |
| 7 | **Agregar keywords a headings** de la landing (H2 con "DISC", "perfilamiento", "entrenadores") | Mejor ranking para keywords target | 30 minutos |
| 8 | **Incluir blog posts EN/PT en el sitemap** | Google descubre versiones multilenguaje | 1 hora |
| 9 | **Remover /app del sitemap**, agregar /pricing, /terms, /privacy | Sitemap refleja paginas publicas reales | 30 minutos |
| 10 | **Agregar canonical tags** explicitos en blog posts | Evita contenido duplicado | 30 minutos |

### MEDIA PRIORIDAD (este trimestre)

| # | Recomendacion | Impacto esperado | Esfuerzo |
|---|------|------|------|
| 11 | **Crear pagina 404** con mensaje util y links | Mejor UX, reduce soft 404s en Search Console | 1 hora |
| 12 | **Agregar sameAs** al Organization schema (LinkedIn, Instagram, etc.) | Mejora knowledge panel de Google | 15 minutos |
| 13 | **Crear paginas de categoria** (/blog/category/:cat) | URL clustering, mas paginas indexables | 4 horas |
| 14 | **Agregar "Related Posts"** al final de cada blog post | +internal linking, +time on site | 2 horas |
| 15 | **Agregar link al blog en la landing** (no solo footer) | Blog mas descubrible, mas crawl priority | 15 minutos |
| 16 | **Agregar BreadcrumbList** schema a blog posts | Rich snippets con breadcrumbs en SERPs | 1 hora |
| 17 | **Agregar dateModified** al Article schema | Google prefiere contenido actualizado | 30 minutos |
| 18 | **Implementar code splitting** (lazy routes para dashboard/admin) | Mejor LCP, menor bundle size | 2 horas |

### BAJA PRIORIDAD (cuando haya recursos)

| # | Recomendacion | Impacto esperado | Esfuerzo |
|---|------|------|------|
| 19 | **Agregar author field** a blog posts (persona real, no org) | Mejora E-E-A-T | 2 horas |
| 20 | **Crear RSS feed** (/api/rss.xml) | Distribucion, backlinks | 2 horas |
| 21 | **Agregar featured blog posts** en homepage | Mas internal linking, mas contenido indexable | 3 horas |
| 22 | **Quitar user-scalable=no** del viewport | Mejor accesibilidad score | 5 minutos |
| 23 | **Implementar paginacion** en blog listing | Necesario cuando pasen de 20 posts | 2 horas |

---

## Metricas de referencia

### Que medir despues de implementar

| Metrica | Herramienta | Que buscar |
|---------|-------------|------------|
| Paginas indexadas | Google Search Console > Indexing | Que blog posts aparezcan indexados |
| Impresiones de busqueda | Search Console > Performance | Crecimiento semana a semana |
| CTR promedio | Search Console > Performance | Mejora despues de optimizar titles/descriptions |
| Core Web Vitals | Search Console > Experience | LCP bajo 2.5s, CLS bajo 0.1 |
| Paginas rastreadas | Search Console > Settings > Crawl stats | Mas paginas rastreadas = mejor descubrimiento |
| Rich results | Search Console > Enhancements | FAQ y Article rich results activos |

---

*Generado el 2 de abril de 2026. Auditor: Claude (Argo Project).*
