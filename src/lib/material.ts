// Import all @material/web components used in the app
// Must be imported only in 'use client' contexts

export async function initMaterial() {
  await Promise.all([
    import('@material/web/all.js'),
  ])
}
