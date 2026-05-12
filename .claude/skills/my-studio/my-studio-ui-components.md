# Skill: my-studio-ui-components

## Triggers
- "component", "UI", "page", "design", "frontend", "button", "form", "layout", "style"

## Purpose
Enforces MY STUDIO design system and component patterns for all frontend work.

---

## Design System (FIXED — NEVER CHANGE)

### Colors

```css
/* Backgrounds */
--bg:         #080808;    /* Page background */
--surface-1:  #111111;    /* Cards, panels */
--surface-2:  #1a1a1a;    /* Elevated surfaces, hover states */
--border:     #2a2a2a;    /* All borders */

/* Brand */
--primary:    #6366f1;    /* Buttons, links, active states (indigo-500) */
--secondary:  #8b5cf6;    /* Secondary actions (violet-500) */

/* Status */
--success:    #10b981;    /* Success, "Active" badges (emerald-500) */
--warning:    #f59e0b;    /* "Coming Soon", warnings (amber-500) */
--error:      #ef4444;    /* Errors, destructive actions (red-500) */

/* Text */
--text-primary:   #f9fafb;  /* Main text (gray-50) */
--text-secondary: #9ca3af;  /* Muted text, labels (gray-400) */
```

### Tailwind Config Mapping

```typescript
// tailwind.config.ts
colors: {
  bg: '#080808',
  surface: { 1: '#111111', 2: '#1a1a1a' },
  border: '#2a2a2a',
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  'text-primary': '#f9fafb',
  'text-secondary': '#9ca3af',
}
```

### Typography
- **Font:** Inter (all weights: 400, 500, 600, 700)
- **Import:** `next/font/google`

### Spacing & Sizing
- **Mobile-first:** 375px minimum width
- **Cards:** `rounded-xl` border radius
- **Padding:** `p-4` (mobile) → `p-6` (desktop)
- **Gap:** `gap-4` (mobile) → `gap-6` (desktop)

---

## Component Rules

### Named Exports Only

```typescript
// CORRECT
export function Button({ children, ...props }: ButtonProps) { ... }

// WRONG
export default function Button() { ... }
```

### No `any` Types

```typescript
// CORRECT
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}

// WRONG
function Button(props: any) { ... }
```

### Framer Motion for Animations

```typescript
import { motion } from 'framer-motion';

// Hover + tap on interactive elements
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.15 }}
>

// Entrance animations
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
```

### Lucide React for Icons (NEVER emojis)

```typescript
import { Lock, Play, Download, Check, X, Loader2 } from 'lucide-react';

// CORRECT
<Lock className="h-5 w-5 text-text-secondary" />

// WRONG — never use emojis as icons
<span>🔒</span>
```

---

## Standard Component Patterns

### Button Component

```typescript
// Variants
primary:   bg-primary text-white hover:bg-primary/90
secondary: bg-secondary text-white hover:bg-secondary/90
ghost:     bg-transparent text-text-primary hover:bg-surface-2
danger:    bg-error text-white hover:bg-error/90
outline:   border border-border text-text-primary hover:bg-surface-2

// Sizes
xs: h-7  px-2 text-xs
sm: h-8  px-3 text-sm
md: h-10 px-4 text-sm
lg: h-12 px-6 text-base

// Loading state
isLoading: show Loader2 spinner, disable clicks
```

### Card Component

```typescript
<div className="rounded-xl border border-border bg-surface-1 p-4 md:p-6">
  {children}
</div>
```

### ComingSoon Component

```typescript
// Props: module, description
<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
  <Lock className="h-12 w-12 text-text-secondary mb-4" />
  <h2 className="text-xl font-semibold text-text-primary mb-2">{module}</h2>
  <p className="text-text-secondary mb-6">This module is coming soon.</p>
  <Button variant="outline" size="md">Get notified when ready</Button>
</div>
```

### StepProgress Component

```typescript
// Steps with status: pending | active | complete | error
// Active: pulse animation in primary color
// Complete: green check with fade-in
// Error: red X with shake animation
// Time elapsed counter on active step
```

---

## Page Layout Pattern

```typescript
export function ModulePage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Module Name</h1>
        <p className="text-text-secondary mt-1">Module description.</p>
      </div>

      {/* Main content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Input section */}
        <Card>...</Card>

        {/* Settings section */}
        <Card>...</Card>
      </div>

      {/* Action */}
      <Button variant="primary" size="lg" fullWidth>
        Generate
      </Button>

      {/* Results */}
      {result && <ResultSection />}
    </div>
  );
}
```

---

## Mobile-First Responsive

```typescript
// Always start with mobile layout, add breakpoints for larger screens
className="
  grid grid-cols-1        // mobile: single column
  md:grid-cols-2          // tablet: two columns
  lg:grid-cols-3          // desktop: three columns
  gap-4 md:gap-6          // smaller gaps on mobile
  p-4 md:p-6              // smaller padding on mobile
"
```

---

## Loading & Error States

Every async action needs:

```typescript
// Loading
{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}

// Error
{error && (
  <div className="rounded-lg bg-error/10 border border-error/20 p-3 text-error text-sm">
    {error}
  </div>
)}

// Empty state
{items.length === 0 && (
  <div className="text-center text-text-secondary py-12">
    No items yet.
  </div>
)}
```

---

## Anti-Patterns (NEVER DO)

1. No emojis as icons — use Lucide React
2. No light backgrounds — always dark theme
3. No excessive gradients — keep it clean
4. No slow animations — max 300ms transitions
5. No `export default` — named exports only
6. No class components — functional only
7. No inline styles — use Tailwind classes
8. No hardcoded colors — use design tokens
9. No `any` types — define proper interfaces
10. No `index.tsx` naming — use descriptive names
