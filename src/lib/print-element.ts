'use client'

/**
 * Prints a specific DOM element cleanly inside an isolated hidden iframe so that
 * complex parent flex/overflow layouts or browser CSS `:has()` quirks never
 * cause blank pages when printing receipts or labels.
 */
export function printElement(element: HTMLElement | null, title = 'ใบแจ้งซ่อม') {
  if (!element || typeof window === 'undefined') {
    if (typeof window !== 'undefined') window.print()
    return
  }

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.setAttribute('aria-hidden', 'true')
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc || !iframe.contentWindow) {
    document.body.removeChild(iframe)
    window.print()
    return
  }

  // Copy all active stylesheets and inline style tags from the main document
  const styleNodes = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]')
  )
    .map(node => node.outerHTML)
    .join('\n')

  const printOverrideStyles = `
    <style>
      @page { size: A4 portrait; margin: 10mm 12mm; }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #1e293b !important;
        font-family: var(--font-sarabun), 'Sarabun', sans-serif !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .print-area {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 4mm !important;
        box-sizing: border-box !important;
      }
      .info-row {
        display: flex !important;
        justify-content: space-between !important;
        gap: 12px !important;
        font-size: 13px !important;
        padding: 6px 0 !important;
        border-bottom: 1px solid #e2e8f0 !important;
      }
      .info-row:last-child {
        border-bottom: none !important;
      }
      .info-label {
        color: #64748b !important;
        flex-shrink: 0 !important;
      }
      .sub-mute {
        font-size: 11px !important;
        color: #64748b !important;
      }
      .no-print {
        display: none !important;
      }
    </style>
  `

  doc.open()
  doc.write(`<!DOCTYPE html>
<html lang="th" class="${document.documentElement.className}">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  ${styleNodes}
  ${printOverrideStyles}
</head>
<body class="${document.body.className}">
  ${element.outerHTML}
</body>
</html>`)
  doc.close()

  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch {
      window.print()
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe)
        }
      }, 1500)
    }
  }

  // Wait for any images (e.g., QR code data URL) and fonts inside iframe to settle
  const images = Array.from(doc.images)
  if (images.length === 0 || images.every(img => img.complete)) {
    setTimeout(triggerPrint, 150)
  } else {
    let loaded = 0
    const checkDone = () => {
      loaded += 1
      if (loaded >= images.length) {
        setTimeout(triggerPrint, 100)
      }
    }
    images.forEach(img => {
      if (img.complete) {
        checkDone()
      } else {
        img.addEventListener('load', checkDone, { once: true })
        img.addEventListener('error', checkDone, { once: true })
      }
    })
  }
}
