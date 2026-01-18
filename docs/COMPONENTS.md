# GATEMATE UI Components Documentation

## 📦 Available Components

Import from `@/components/ui`:

```tsx
import { 
  Button, Input, Card, CardHeader, CardTitle, CardContent,
  Icon, Icons, Badge, ToastProvider, useToast,
  Skeleton, SkeletonCard, SkeletonList, SkeletonDashboard
} from '@/components/ui'
```

---

## Button

Reusable button with variants, loading state, and accessibility.

```tsx
<Button variant="primary" size="md" isLoading={false}>
  Click Me
</Button>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` | Style variant |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| isLoading | `boolean` | `false` | Show loading spinner |
| leftIcon | `ReactNode` | - | Icon before text |
| rightIcon | `ReactNode` | - | Icon after text |
| fullWidth | `boolean` | `false` | Full width button |

---

## Input

Form input with label, error state, and icons.

```tsx
<Input
  label="Email"
  error="Invalid email"
  leftIcon={<Icon name="mail" />}
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | - | Input label |
| error | `string` | - | Error message |
| hint | `string` | - | Helper text |
| leftIcon | `ReactNode` | - | Left icon |
| rightIcon | `ReactNode` | - | Right icon |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | Input size |

---

## Card

Container with variants and subcomponents.

```tsx
<Card variant="bordered" padding="md">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

---

## Icon

Material Symbols wrapper with presets.

```tsx
<Icon name="settings" size="lg" filled />
<Icon name={Icons.gate} />
```

**Presets:** `Icons.home`, `Icons.gate`, `Icons.lock`, `Icons.success`, etc.

---

## Badge

Status indicator with dot option.

```tsx
<Badge variant="success" dot>Online</Badge>
<Badge variant="danger">Offline</Badge>
```

---

## Toast

Notification system with context.

```tsx
// In component
const { showToast } = useToast()
showToast('success', 'Gate opened!')
showToast('error', 'Connection failed')
```

---

## Skeleton

Loading placeholders.

```tsx
<Skeleton variant="text" />
<SkeletonCard />
<SkeletonDashboard />
```

---

## CSS Animations

Available classes:
- `animate-fade-in` - Fade in
- `animate-fade-in-up` - Fade in with slide up
- `animate-scale-in` - Scale in
- `animate-glow` - Subtle pulse glow
- `animate-shimmer` - Skeleton shimmer

Stagger delays: `animate-delay-1` through `animate-delay-5`
