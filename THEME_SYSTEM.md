# MindBloom Theme System

## Overview
MindBloom features a comprehensive, runtime-switchable theme system that allows users to customize the application's appearance. The system supports multiple predefined themes across light and dark modes, with seamless transitions and persistent preferences.

## Features

### 🎨 Multiple Themes
- **7 Predefined Themes** across light and dark modes
- Each theme includes a complete color palette
- Professional color combinations designed for accessibility
- Smooth CSS transitions between themes

### Available Themes

#### Light Themes
1. **Default Light** - Purple gradient (default)
2. **Ocean Blue** - Cool blue tones
3. **Forest Green** - Natural green palette
4. **Sunset Orange** - Warm orange/red tones

#### Dark Themes
1. **Default Dark** - Purple/indigo on dark slate
2. **Midnight Blue** - Deep blue on near-black
3. **Nature Dark** - Green on dark forest tones

### 🖥️ Auto Mode
- Automatically follows system theme preference
- Switches between light/dark based on OS settings
- Real-time updates when system theme changes

### 💾 Persistent Preferences
- Theme selection saved to localStorage
- Preferences restored on page reload
- Separate storage for theme and mode

## Architecture

### ThemeService (`theme.service.ts`)
Main service managing theme state and application.

```typescript
export interface ThemeDefinition {
    id: string;              // Unique identifier
    name: string;            // Display name
    mode: 'light' | 'dark';  // Theme mode
    colors: {
        // Primary colors
        primary: string;
        primaryDark: string;
        primaryLight: string;
        secondary: string;
        accent: string;
        
        // Surface colors
        background: string;
        surface: string;
        surfaceHover: string;
        
        // Text colors
        textPrimary: string;
        textSecondary: string;
        textTertiary: string;
        
        // Borders
        border: string;
        borderLight: string;
        
        // Status colors
        success: string;
        warning: string;
        error: string;
        info: string;
    };
    shadows: {
        sm: string;
        md: string;
        lg: string;
    };
}
```

#### Key Methods
- `setTheme(themeId: string)`: Apply a specific theme
- `setMode(mode: ThemeMode)`: Set light/dark/auto mode
- `getThemesByMode(mode)`: Get all themes for a mode
- `currentTheme`: Signal containing active theme
- `currentMode`: Signal containing active mode

### ThemeSelectorComponent
Dropdown UI component for theme selection.

**Features:**
- Visual theme preview with color swatches
- Grouped by light/dark themes
- Auto mode option with system icon
- Active theme indicator (checkmark)
- Click-outside to close dropdown
- Keyboard accessible

**Location:** `frontend/src/app/shared/components/theme-selector/`

### ClickOutsideDirective
Utility directive for dropdown behavior.

**Usage:**
```html
<div (clickOutside)="closeDropdown()">
    <!-- Dropdown content -->
</div>
```

## CSS Variables
All themes use CSS custom properties for dynamic styling:

### Color Variables
```css
--color-primary
--color-primary-dark
--color-primary-light
--color-secondary
--color-accent
--color-background
--color-surface
--color-surface-hover
--color-text-primary
--color-text-secondary
--color-text-tertiary
--color-border
--color-border-light
--color-success
--color-warning
--color-error
--color-info
```

### Shadow Variables
```css
--shadow-sm
--shadow-md
--shadow-lg
```

### Data Attributes
```html
<html data-theme="light" data-theme-id="ocean-light">
```

## Usage Examples

### In Components (TypeScript)
```typescript
import { ThemeService } from '@core/services/theme.service';

export class MyComponent {
    private themeService = inject(ThemeService);
    
    // Get current theme
    currentTheme = this.themeService.currentTheme;
    
    // Set specific theme
    applyOceanTheme() {
        this.themeService.setTheme('ocean-light');
    }
    
    // Enable auto mode
    enableAutoMode() {
        this.themeService.setMode('auto');
    }
}
```

### In Templates (HTML)
```html
<!-- Use theme selector component -->
<app-theme-selector />

<!-- Current theme name -->
<p>Current: {{ themeService.currentTheme().name }}</p>
```

### In Styles (SCSS/CSS)
```scss
.my-component {
    background: var(--color-surface);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-md);
    
    &:hover {
        background: var(--color-surface-hover);
    }
}

// Mode-specific styles
[data-theme="dark"] {
    .special-element {
        opacity: 0.9;
    }
}

// Theme-specific styles
[data-theme-id="ocean-light"] {
    .ocean-feature {
        display: block;
    }
}
```

## Adding New Themes

To add a new theme, edit `theme.service.ts`:

```typescript
{
    id: 'my-theme-light',
    name: 'My Custom Theme',
    mode: 'light',
    colors: {
        primary: '#yourcolor',
        // ... complete color palette
    },
    shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.07)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)'
    }
}
```

Add the theme object to the `themes` array in ThemeService.

---

## Retro Noir (Refinement notes)

`Retro Noir` is our premium dark theme tuned for Host / enterprise surfaces. Key design goals:

- Warm, premium surfaces with high depth and subtle glow on CTAs
- Clear contrast for body and headings to ensure readability across large admin screens
- Accented CTAs (cyan / gold) for instant visual hierarchy

Tokens you can rely on (automatically derived by ThemeService):

- `--host-surface-elevated` — elevated card/background surface (derived from `--color-surface`)
- `--host-surface-muted` — subtle surface used for hover/alternate rows
- `--host-text-color` / `--host-heading-color` — text colors optimized for readability on surfaces
- `--host-muted-color` — computed using `color-mix(in srgb, var(--color-text-primary) 68%, var(--color-surface) 32%)` to ensure legibility
- `--host-border-subtle` — border color tuned per theme mode (slightly stronger on dark themes for clarity)
- `--host-primary-glow` — soft glow for primary CTAs (reduced opacity for dark themes)
- `--btn-primary-text` — automatically chosen (white or dark) based on best contrast against primary

Design guidance:
- Use `var(--host-accent)` for tabs, active states and minor highlights.
- Prefer `--host-surface-elevated` for cards and `--host-surface-muted` for table hover/rows.
- Prefer `--host-muted-color` for secondary metadata; it always maintains sufficient contrast against surfaces.

If anything reads poorly in specific components, tag the component and I’ll adjust tokens or micro-adjust contrast there for the best combination.

## Storage Keys

- `mindbloom_theme`: Stores selected theme ID
- `mindbloom_theme_mode`: Stores mode ('light'|'dark'|'auto')

## Browser Compatibility

- All modern browsers (Chrome, Firefox, Safari, Edge)
- CSS custom properties support required
- LocalStorage for persistence
- MediaQuery API for system preference detection

## Accessibility

- All themes meet WCAG AA contrast requirements
- Semantic color naming (success, warning, error, info)
- System preference support for reduced motion
- Keyboard navigation support in theme selector
- ARIA labels on theme controls

## Performance

- Instant theme switching (CSS variables)
- No page reload required
- Minimal DOM manipulation
- Efficient signal-based reactivity
- LocalStorage caching

## Migration from Old System

The previous system had only light/dark toggle buttons. The new system:

✅ **Maintains compatibility:**
- Same CSS variable names
- Same data attributes
- Existing components work without changes

✅ **Additions:**
- Multiple theme options
- Dropdown selector UI
- Theme preview swatches
- Improved auto mode handling

## Future Enhancements

Potential improvements:
- [ ] Custom theme creator
- [ ] Theme import/export
- [ ] Per-tenant theme customization
- [ ] Theme scheduling (time-based switching)
- [ ] Accessibility mode (high contrast)
- [ ] Color blind friendly themes
- [ ] Theme marketplace

## Testing

### Manual Testing
1. Open application
2. Click theme selector in toolbar
3. Select different themes
4. Verify color changes
5. Reload page - theme should persist
6. Test auto mode with system theme
7. Verify all components render correctly

### Automated Testing
```typescript
describe('ThemeService', () => {
    it('should apply theme correctly', () => {
        service.setTheme('ocean-light');
        expect(service.currentTheme().id).toBe('ocean-light');
    });
    
    it('should persist theme to localStorage', () => {
        service.setTheme('forest-light');
        expect(localStorage.getItem('mindbloom_theme')).toBe('forest-light');
    });
});
```

## Troubleshooting

### Theme not applying
- Check localStorage for saved theme
- Verify CSS variables in DevTools
- Check console for errors

### Theme not persisting
- Verify localStorage is enabled
- Check browser privacy settings
- Clear cache and try again

### Colors look wrong
- Verify theme definition is complete
- Check for CSS specificity issues
- Ensure all color variables are set

## Support

For issues or questions about the theme system:
1. Check this documentation
2. Review theme.service.ts code
3. Test in different browsers
4. Check browser console for errors
5. Verify localStorage permissions

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Status:** Production Ready
