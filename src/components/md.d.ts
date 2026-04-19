import type { HTMLAttributes } from 'react'

type MDProps = HTMLAttributes<HTMLElement> & {
  [key: string]: unknown
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'md-top-app-bar': MDProps
      'md-icon-button': MDProps
      'md-icon': MDProps
      'md-filled-button': MDProps
      'md-outlined-button': MDProps
      'md-text-button': MDProps
      'md-card': MDProps
      'md-elevated-card': MDProps
      'md-filled-card': MDProps
      'md-outlined-card': MDProps
      'md-list': MDProps
      'md-list-item': MDProps
      'md-divider': MDProps
      'md-chip-set': MDProps
      'md-filter-chip': MDProps
      'md-assist-chip': MDProps
      'md-text-field': MDProps
      'md-filled-text-field': MDProps
      'md-outlined-text-field': MDProps
      'md-circular-progress': MDProps
      'md-linear-progress': MDProps
      'md-fab': MDProps
      'md-navigation-bar': MDProps
      'md-navigation-tab': MDProps
      'md-dialog': MDProps
      'md-badge': MDProps
      'md-ripple': MDProps
      'md-checkbox': MDProps
      'md-select': MDProps
      'md-filled-select': MDProps
      'md-select-option': MDProps
    }
  }
}
export {}
