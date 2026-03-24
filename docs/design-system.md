# Argo Method — Dashboard Design System

## Scope
This system applies to the **tenant dashboard** only. The odyssey/game and landing page have their own visual rules.

---

## 1. Color Tokens

### Brand — Violet (primary)
Use for: active navigation, primary buttons, key CTAs, accent highlights.

| Token | Hex | Tailwind class | Usage |
|-------|-----|----------------|-------|
| `violet-50` | `#F9F5FC` | `bg-argo-violet-50` | Hover backgrounds, active nav bg, subtle tints |
| `violet-100` | `#EDE5F5` | `bg-argo-violet-100` | Badge backgrounds, credit box accent |
| `violet-200` | `#D4BCE8` | `border-argo-violet-200` | Active borders, digest card left accent |
| `violet-400` | `#A97BD2` | `text-argo-violet-400` | Hover state text on violet surfaces |
| `violet-500` | `#955FB5` | `bg-argo-violet-500` | Primary buttons, active nav indicator |
| `violet-600` | `#7A4D96` | `bg-argo-violet-600` | Button hover/pressed state |

### Neutrals
Use for: text hierarchy, backgrounds, borders, structure.

| Token | Hex | Tailwind class | Usage |
|-------|-----|----------------|-------|
| `navy` | `#1D1D1F` | `text-argo-navy` | Primary text, headings, key numbers |
| `secondary` | `#424245` | `text-argo-secondary` | Body text, descriptions |
| `grey` | `#86868B` | `text-argo-grey` | Secondary labels, inactive nav |
| `light-grey` | `#AEAEB2` | `text-argo-light` | Micro labels, timestamps, tertiary text |
| `border` | `#E8E8ED` | `border-argo-border` | Card borders (used sparingly), dividers |
| `bg` | `#F8F8FA` | `bg-argo-bg` | Page background |
| `white` | `#FFFFFF` | `bg-white` | Card surfaces |

### Axis Colors (Argo methodology — NOT "DISC")
Use for: axis dots, avatar backgrounds, indicator fills, left-border accents on cards.
Always pair with the Argo name. NEVER show the letter (D/I/S/C) to users.

| Axis name | Color | Light bg | Tailwind prefix |
|-----------|-------|----------|-----------------|
| Impulsor | `#f97316` | `#fff7ed` | `axis-impulsor` |
| Conector | `#f59e0b` | `#fffbeb` | `axis-conector` |
| Sosten | `#22c55e` | `#f0fdf4` | `axis-sosten` |
| Estratega | `#6366f1` | `#eef2ff` | `axis-estratega` |

### Motor Colors
| Motor | Color | Tailwind |
|-------|-------|----------|
| Dinamico | `#f59e0b` | Same as Conector |
| Ritmico | `#6366f1` | Same as Estratega |
| Sereno | `#06b6d4` | Cyan |

---

## 2. Shadows (Elevation)

Only 2 levels. Keep it minimal.

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-argo` | `0 1px 3px rgba(0,0,0,0.04)` | Default card state |
| `shadow-argo-hover` | `0 2px 12px rgba(0,0,0,0.06)` | Hover state, modals |

---

## 3. Typography

Font: **Inter** (all weights). No other fonts in the dashboard.

| Role | Classes | Example |
|------|---------|---------|
| Page title | `text-2xl font-bold text-argo-navy tracking-tight` | "Inicio" |
| Section title | `text-[15px] font-semibold text-argo-navy` | "Ultimas sesiones" |
| Card title | `text-[13px] font-semibold text-argo-navy` | "Acciones rapidas" |
| Body | `text-sm text-argo-secondary leading-relaxed` | Descriptions, digest text |
| Caption | `text-xs text-argo-grey` | Session metadata |
| Micro label | `text-[10px] font-semibold text-argo-light uppercase tracking-[0.1em]` | Section labels, nav groups |
| Stat number | `text-[32px] font-bold text-argo-navy tracking-tight tabular-nums` | "197" |
| Stat sub | `text-[11px] text-argo-light` | "completadas" |

---

## 4. Spacing

Base: **8px grid**. All padding/margin in multiples of 4 or 8.

| Context | Value |
|---------|-------|
| Card padding | `20px 24px` (p-5 px-6) |
| Section gap | `40px` (mb-10) between major sections |
| Card gap in grid | `20px` (gap-5) |
| Inner element gap | `14px` (gap-3.5) for items in a list |
| Tight gap | `6-8px` (gap-1.5 to gap-2) for chips, badges |

---

## 5. Border Radius

| Element | Value |
|---------|-------|
| Cards | `14px` (rounded-[14px]) |
| Buttons | `8px` (rounded-lg) |
| Badges/chips | `6-8px` (rounded-md) |
| Avatars | `12px` (rounded-xl) for square, `50%` for round |
| Inputs | `8px` (rounded-lg) |
| Indicators/bars | `2-4px` (rounded-sm) |

---

## 6. Component Patterns

### Sidebar
- Background: white with right border `argo-border`
- Active item: text `argo-violet-500` + bg `argo-violet-50` + left bar indicator (3px, violet-500)
- Inactive: text `argo-grey`, hover → text navy + bg `argo-bg`
- Grouped with micro labels ("Principal", "Configuracion")
- Credits box at bottom: bg `argo-bg`, number large, label small
- User section: initials avatar (violet-100 bg, violet-500 text) + name

### Cards
- Background: white. NO visible border by default — only `shadow-argo`.
- Hover: `shadow-argo-hover` + optional `translateY(-1px)`.
- Header pattern: title left, optional action link right (violet-500 text).
- Internal dividers: `border-argo-border` (1px), only between list items.

### Session/Player Row
- Left accent: 8px dot in axis color (NOT a full left border — just a dot).
- Name: `text-[13px] font-semibold`
- Meta: `text-xs text-argo-grey`
- Right side: archetype pill in `text-argo-violet-500` (text only, no background)

### Axis Badge
- Neutral background: `bg-argo-bg` (grey, not colored)
- Small dot (6px) in axis color + axis NAME (never letter)
- Font: `text-[11px] font-semibold`
- Border-radius: `6px`

### Motor Display
- Text only: `text-[10px] font-semibold text-argo-light`
- No background, no chip — just the word (Dinamico/Ritmico/Sereno)

### Archetype Pill
- Text only in `text-argo-violet-500`, `text-xs font-medium`
- No background pill — the text color IS the distinction

### Bridge Word Chips
- Background: `argo-bg`
- Border: `1px solid argo-border`
- Text: `text-xs text-argo-secondary`
- Hover: border → `argo-violet-100`, bg → `argo-violet-50`, text → `argo-violet-500`

### Buttons
- **Primary:** `bg-argo-violet-500 text-white` → hover `argo-violet-400`
- **Secondary:** `bg-transparent border border-argo-border text-argo-secondary` → hover `argo-violet-50 border-argo-violet-100`
- Border-radius: `8px`
- Padding: `8px 16px`
- Font: `text-xs font-semibold`

### Indicator Bars
- Thin track: `4px` height, `bg-argo-border`
- Fill: axis color with `opacity: 0.7`
- Label left, percentage right
- No colored background on the row — keep it clean

### Digest Pattern (progressive disclosure)
- Always-visible "coach summary": plain language in a tinted box (`bg-argo-bg`, `border-left: 2px solid argo-violet-100`)
- Expandable "technical detail" below: toggle link in `text-argo-violet-500`

### Modals/Sheets
- Backdrop: `bg-black/25 backdrop-blur-sm`
- Card: white, `rounded-[14px]`, `shadow-argo-hover`
- Mobile: bottom sheet with `rounded-t-[20px]`

---

## 7. Animations (Framer Motion)

| Interaction | Config |
|-------------|--------|
| Page mount | `opacity: 0→1, y: 8→0, duration: 0.25` |
| Card hover | `translateY: -1px, shadow transition, duration: 0.2` |
| Button press | `scale: 0.97, duration: 0.1` |
| Collapsible | `height: 0→auto, opacity: 0→1, duration: 0.25, ease: easeOut` |
| List stagger | `each item delay: 40ms` |
| Bar fill | `width: 0→n%, duration: 0.6, ease: easeOut` |
| Chip select | `background transition, duration: 0.15` |

---

## 8. Iconography

Library: **Lucide React** (`lucide-react`). Already installed. Stroke-based, 24px viewbox, 1.5-2px stroke.

### Icon rules
- Size: `16px` in nav and inline, `18px` in card headers, `20px` in empty states
- Color: `currentColor` — inherits from parent text color (usually `argo-grey` or `argo-navy`)
- Weight: default stroke (2px). Never fill, never bold.
- Never colorful standalone — icons follow the text color hierarchy

### Navigation icons
| Section | Icon | Lucide import |
|---------|------|---------------|
| Inicio | `LayoutDashboard` | `LayoutDashboard` |
| Jugadores | `Users` | `Users` |
| Grupos | `Layers` | `Layers` |
| Guia situacional | `Compass` | `Compass` |
| Chat | `MessageCircle` | `MessageCircle` |
| Mi link | `Link2` | `Link2` |
| Ajustes | `Settings` | `Settings` |
| Cerrar sesion | `LogOut` | `LogOut` |

### Stat card icons
| Metric | Icon | Lucide import |
|--------|------|---------------|
| Creditos | `Coins` | `Coins` |
| Sesiones | `Activity` | `Activity` |
| Jugadores | `Users` | `Users` |
| Grupos | `Layers` | `Layers` |

### Action icons
| Action | Icon | Lucide import |
|--------|------|---------------|
| Copiar | `Copy` | `Copy` |
| Compartir | `Share2` | `Share2` |
| Buscar | `Search` | `Search` |
| Agregar | `Plus` | `Plus` |
| Eliminar | `Trash2` | `Trash2` |
| Editar | `Pencil` | `Pencil` |
| Expandir/colapsar | `ChevronDown` | `ChevronDown` |
| Volver | `ArrowLeft` | `ArrowLeft` |
| Enviar | `Send` | `Send` |
| Filtrar | `SlidersHorizontal` | `SlidersHorizontal` |

### Contextual icons
| Context | Icon | Lucide import |
|---------|------|---------------|
| Re-perfilamiento | `Clock` | `Clock` |
| Alerta suave | `Info` | `Info` |
| Exito | `Check` | `Check` |
| Error | `AlertCircle` | `AlertCircle` |
| Link externo | `ExternalLink` | `ExternalLink` |
| Descarga | `Download` | `Download` |

### In stat cards
Icons go inside a `36x36` rounded-xl (`10px`) container with `bg-argo-bg` and `text-argo-grey`. On hover, the container tints slightly to `argo-violet-50` and icon to `argo-violet-400`.

---

## 9. Naming Convention

### In code (internal)
Use `D`, `I`, `S`, `C` for axis identification in TypeScript, database, API responses.

### In UI (user-facing)
| Code | UI display (es) | UI display (en) | UI display (pt) |
|------|-----------------|-----------------|-----------------|
| `D` | Impulsor | Driver | Impulsionador |
| `I` | Conector | Connector | Conector |
| `S` | Sosten | Sustainer | Sustentador |
| `C` | Estratega | Strategist | Estrategista |

NEVER show "DISC" in the dashboard. Use "los 4 ejes" or "la metodologia Argo" when referring to the framework.

Replace "Diversidad DISC" → "Diversidad de estilos"
Replace "Distribucion DISC" → "Distribucion de estilos"

---

## 9. Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| Desktop (>1024px) | Sidebar visible, content grid 2 columns, stats 4 columns |
| Tablet (768-1024px) | Sidebar collapsed to icons, content 1 column, stats 2 columns |
| Mobile (<768px) | Sidebar hidden (hamburger), single column, stats stacked |

---

## 10. Rules

1. **No emojis.** Ever.
2. **No red.** The axis system uses orange, amber, green, violet. No red anywhere.
3. **No dashes (—, –, -) in copy.** Use periods, commas, parentheses, or restructure the sentence instead.
4. **Color with restraint.** 90% of the UI is neutral. Color appears only in: axis dots, the violet accent, and indicator fills.
5. **Always digest.** Technical information is accompanied by a plain-language version for coaches.
6. **Argo names, not DISC letters.** The user sees "Impulsor", never "D".
7. **All text through i18n.** No hardcoded strings in any language.
8. **Mobile-first.** Design for mobile, enhance for desktop.

---

*Design system for Argo Method Dashboard. Updated March 2026.*
