type PopupLocation = {
  name: string
  latitude: number
  longitude: number
  isMonitored: boolean
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    }

    return entities[character]
  })
}

export function createLocationPopupHtml(location: PopupLocation): string {
  const name = escapeHtml(location.name)
  const monitoringStatus = location.isMonitored ? 'Monitored' : 'Idle'

  return `
    <div style="font-family: 'Inter', sans-serif; padding: 4px; color: #f1f5f9; background: #0f172a; border-radius: 6px;">
      <p style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">${name}</p>
      <p style="font-size: 11px; color: #94a3b8; font-family: monospace;">${location.latitude}, ${location.longitude}</p>
      <p style="font-size: 11px; color: #64748b; margin-top: 2px;">${monitoringStatus}</p>
    </div>
  `
}
