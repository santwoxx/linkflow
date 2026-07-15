import { useEffect, useRef, useCallback } from 'react'

const GA_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{8,12}$/i

declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}

function isValidMeasurementId(id: string): boolean {
  return GA_MEASUREMENT_ID_PATTERN.test(id.trim())
}

function isGtagLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function'
}

function loadGtagScript(measurementId: string): Promise<void> {
  return new Promise((resolve) => {
    if (isGtagLoaded()) {
      resolve()
      return
    }

    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag(...args: any[]) {
      window.dataLayer.push(args)
    }
    window.gtag('js', new Date())
    window.gtag('config', measurementId, {
      send_page_view: false,
      anonymize_ip: true,
    })

    const script = document.createElement('script')
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => resolve()
    document.head.appendChild(script)
  })
}

export interface AnalyticsEventParams {
  page_id?: string
  button_id?: string
  button_name?: string
  button_type?: string
  destination_url?: string
  timestamp?: string
  [key: string]: string | number | boolean | undefined
}

export function useAnalytics(measurementId?: string, enabled?: boolean) {
  const injectedRef = useRef(false)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!measurementId || !enabled) return
    if (!isValidMeasurementId(measurementId)) return
    if (injectedRef.current) return

    injectedRef.current = true

    loadGtagScript(measurementId.trim()).then(() => {
      initializedRef.current = true
    })

    return () => {
      injectedRef.current = false
    }
  }, [measurementId, enabled])

  const trackEvent = useCallback(
    (eventName: string, params?: AnalyticsEventParams) => {
      if (!enabled || !measurementId || !initializedRef.current) return
      try {
        window.gtag?.('event', eventName, {
          ...params,
          timestamp: params?.timestamp || new Date().toISOString(),
        })
      } catch {
        // Silently fail — analytics should never break the app
      }
    },
    [enabled, measurementId]
  )

  const trackPageView = useCallback(
    (pagePath?: string) => {
      if (!enabled || !measurementId || !initializedRef.current) return
      try {
        window.gtag?.('event', 'page_view', {
          page_path: pagePath || window.location.pathname,
          page_title: document.title,
          page_location: window.location.href,
        })
      } catch {
        // Silently fail
      }
    },
    [enabled, measurementId]
  )

  const trackLinkClick = useCallback(
    (
      linkType: string,
      buttonId: string,
      buttonName: string,
      destinationUrl?: string
    ) => {
      const eventMap: Record<string, string> = {
        whatsapp: 'track_whatsapp_click',
        instagram: 'track_instagram_click',
        facebook: 'track_facebook_click',
        telegram: 'track_telegram_click',
        email: 'track_email_click',
        phone: 'track_phone_click',
        link: 'track_button_click',
        scheduling: 'track_conversion',
        products: 'track_button_click',
        gallery: 'track_button_click',
        services: 'track_button_click',
        promo_banner: 'track_button_click',
        send_resume: 'track_conversion',
        testimonials: 'track_button_click',
      }

      const eventName = eventMap[linkType] || 'track_button_click'

      trackEvent(eventName, {
        page_id: window.location.pathname,
        button_id: buttonId,
        button_name: buttonName,
        button_type: linkType,
        destination_url: destinationUrl || '',
      })
    },
    [trackEvent]
  )

  return { trackEvent, trackPageView, trackLinkClick, isReady: initializedRef.current }
}

export { isValidMeasurementId }
