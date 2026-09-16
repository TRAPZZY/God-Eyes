import { describe, expect, it } from 'vitest'
import { createLocationPopupHtml } from './locationPopup'

describe('createLocationPopupHtml', () => {
  it('escapes a location name before it is passed to Mapbox as HTML', () => {
    const html = createLocationPopupHtml({
      name: '<img src=x onerror=alert(1)>',
      latitude: 40.7128,
      longitude: -74.006,
      isMonitored: true,
    })

    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).not.toContain('<img src=x onerror=alert(1)>')
  })
})
