---
name: Warm Parchment Editorial
colors:
  surface: '#fcf9f2'
  surface-dim: '#dcdad3'
  surface-bright: '#fcf9f2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ec'
  surface-container: '#f0eee7'
  surface-container-high: '#ebe8e1'
  surface-container-highest: '#e5e2db'
  on-surface: '#1c1c18'
  on-surface-variant: '#444748'
  inverse-surface: '#31312c'
  inverse-on-surface: '#f3f0e9'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#010101'
  on-primary: '#ffffff'
  primary-container: '#1c1c1c'
  on-primary-container: '#858484'
  inverse-primary: '#c8c6c5'
  secondary: '#615e57'
  on-secondary: '#ffffff'
  secondary-container: '#e7e2d9'
  on-secondary-container: '#67645d'
  tertiary: '#010101'
  on-tertiary: '#ffffff'
  tertiary-container: '#1d1c1b'
  on-tertiary-container: '#878482'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#e7e2d9'
  secondary-fixed-dim: '#cbc6be'
  on-secondary-fixed: '#1d1c16'
  on-secondary-fixed-variant: '#494740'
  tertiary-fixed: '#e6e2df'
  tertiary-fixed-dim: '#cac6c4'
  on-tertiary-fixed: '#1c1b1a'
  on-tertiary-fixed-variant: '#484645'
  background: '#fcf9f2'
  on-background: '#1c1c18'
  surface-variant: '#e5e2db'
  surface-parchment: '#f7f4ed'
  surface-card: '#ffffff'
  border-subtle: '#eceae4'
  border-strong: rgba(28, 28, 28, 0.4)
  ink-primary: '#1c1c1c'
  ink-secondary: rgba(28, 28, 28, 0.65)
  ink-tertiary: rgba(28, 28, 28, 0.40)
  ink-quaternary: rgba(28, 28, 28, 0.20)
  accent-warm: '#d97706'
typography:
  headline-xl:
    fontFamily: Be Vietnam Pro
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4.5rem
  container-padding-mobile: 1rem
  container-padding-tablet: 1.5rem
  container-padding-desktop: 2.5rem
  gutter: 1.25rem
---

# Design System Inspired by Lovable

## 1. Visual Theme & Atmosphere
Lovable's website radiates warmth through restraint. The entire page sits on a creamy, parchment-toned background (`#f7f4ed`) that immediately separates it from the cold-white conventions of most developer tool sites.
Near-black text (`#1c1c1c`) against this warm cream creates sharp readability with humanist warmth.
The opacity-driven depth model modulates `#1c1c1c` at varying opacities.
Border system: `1px solid #eceae4` for subtle divisions and `1px solid rgba(28, 28, 28, 0.4)` for stronger interactive boundaries.

Key Characteristics:
- Warm parchment background (`#f7f4ed`)
- Camera Plain Variable or humanist clean sans-serif with slight negative tracking on headings
- Opacity-driven neutral scale: all grays derived from `#1c1c1c`
- Inset shadow technique on dark buttons: `rgba(255,255,255,0.2) 0px 0.5px 0px 0px inset, rgba(0,0,0,0.2) 0px 0px 0px 0.5px inset, rgba(0,0,0,0.05) 0px 1px 2px 0px`
- Warm neutral borders: `#eceae4`
- Full-pill radius (`9999px`) for action chips, category filters, and icon buttons
- Card radius: 12px to 16px with `1px solid #eceae4`
- Vietnamese real estate rental platform ("Thuê Nhà / Bất Động Sản")
