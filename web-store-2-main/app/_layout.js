import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider } from '../context/store';
import { Provider as PaperProvider } from 'react-native-paper';
import { trackEvent } from '../lib/trackEvent';
import { getLocationInfo } from '../lib/trackEvent';
import HomeBanner from './components/HomeBanner';
import Header from './components/Header';

import CookieConsentBanner from './components/CookieConsentBanner';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Inject meta tags for SEO and social previews
      if (!document.querySelector('meta[name="description"]')) {
        const metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        metaDesc.content = 'Discover stunning heart and charm jewellery at Rare Collectables. Shop affordable luxury necklaces, bracelets, and earrings designed to make every moment special. Free shipping & exclusive offers!';
        document.head.appendChild(metaDesc);
      }
      if (!document.querySelector('meta[property="og:title"]')) {
        const ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        ogTitle.content = 'Rare Collectables | Affordable Luxury';
        document.head.appendChild(ogTitle);
      }
      if (!document.querySelector('meta[property="og:description"]')) {
        const ogDesc = document.createElement('meta');
        ogDesc.setAttribute('property', 'og:description');
        ogDesc.content = 'Discover stunning heart and charm jewellery at Rare Collectables. Shop affordable luxury necklaces, bracelets, and earrings designed to make every moment special. Free shipping & exclusive offers!';
        document.head.appendChild(ogDesc);
      }
      if (!document.querySelector('meta[property="og:image"]')) {
        const ogImg = document.createElement('meta');
        ogImg.setAttribute('property', 'og:image');
        ogImg.content = 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/products/Necklaces/1-2-Necklace.avif'; // <-- Using a necklace product image
        document.head.appendChild(ogImg);
      }
      if (!document.querySelector('meta[property="og:type"]')) {
        const ogType = document.createElement('meta');
        ogType.setAttribute('property', 'og:type');
        ogType.content = 'website';
        document.head.appendChild(ogType);
      }
      // Inject Microsoft Clarity
      if (!document.getElementById('clarity-script')) {
        const script = document.createElement('script');
        script.id = 'clarity-script';
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = `
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "qydxxehxd0");
        `;
        document.head.appendChild(script);
      }
      // Inject Google Tag Manager
      if (!document.getElementById('gtm-script')) {
        const gtmScript = document.createElement('script');
        gtmScript.id = 'gtm-script';
        gtmScript.innerHTML = `
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-KN8NBVPW');
        `;
        document.head.appendChild(gtmScript);
      }
      
      // Inject Google Analytics 4 (gtag.js)
      if (!document.getElementById('ga4-gtag-js')) {
        const gaScript = document.createElement('script');
        gaScript.id = 'ga4-gtag-js';
        gaScript.async = true;
        gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-PX5Q4F56NV';
        document.head.appendChild(gaScript);
      }
      if (!document.getElementById('ga4-inline')) {
        const inlineScript = document.createElement('script');
        inlineScript.id = 'ga4-inline';
        inlineScript.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-PX5Q4F56NV');
          gtag('config', 'G-KQ67K3HC7N'); 
          gtag('config', 'G-CSMXSKT0QH'); 
        `;
        document.head.appendChild(inlineScript);
      }
    }
  }, []);

  // Print country and track home page visit
  useEffect(() => {
    (async () => {
      // Try to get location info and print country
      let country = null;
      try {
        await getLocationInfo(); // Optionally keep this if you want to fetch location, but do not log
      } catch (err) {
        // Optionally handle error silently
      }
      trackEvent({ eventType: 'home_page_visit' });
    })();
  }, []);

  return (
    <PaperProvider>
      <StoreProvider>
        <SafeAreaProvider>
          {Platform.OS === 'web' && (
            <div 
              dangerouslySetInnerHTML={{
                __html: `
                  <!-- Google Tag Manager (noscript) -->
                  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KN8NBVPW"
                  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
                  <!-- End Google Tag Manager (noscript) -->
                `
              }}
            />
          )}
          <CookieConsentBanner />
          <HomeBanner />
          <Header />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="product/[id]"
              options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="cart"
              options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="checkout"
              options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="checkout-success"
              options={{ presentation: 'card', animation: 'fade' }}
            />
            <Stack.Screen
              name="chat"
              options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }}
            />
          </Stack>
        </SafeAreaProvider>
      </StoreProvider>
    </PaperProvider>
  );
}
