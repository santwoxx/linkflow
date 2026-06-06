import { MP_CHECKOUT_URL } from '../types';

export type CheckoutSource =
  | 'services_discovery'
  | 'pro_sales'
  | 'pro_promo_banner'
  | 'professional_profile';

export function getProCheckoutUrl(source: CheckoutSource): string {
  try {
    const url = new URL(MP_CHECKOUT_URL);
    url.searchParams.set('utm_source', 'linkflow');
    url.searchParams.set('utm_medium', 'services_tab');
    url.searchParams.set('utm_campaign', 'pro_signup');
    url.searchParams.set('utm_content', source);
    return url.toString();
  } catch {
    const sep = MP_CHECKOUT_URL.includes('?') ? '&' : '?';
    return `${MP_CHECKOUT_URL}${sep}utm_source=linkflow&utm_medium=services_tab&utm_campaign=pro_signup&utm_content=${source}`;
  }
}
