import { useEffect, useState } from 'react';

export const useFacebookSDK = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if SDK is already loaded
    if (window.FB) {
      setIsLoaded(true);
      console.log('✅ Facebook SDK already loaded');
      return;
    }

    // Initialize Facebook SDK
    window.fbAsyncInit = function() {
      const fbAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
      
      if (!fbAppId) {
        console.error('❌ VITE_FACEBOOK_APP_ID not set in environment variables');
        console.log('Please add VITE_FACEBOOK_APP_ID to your .env file');
        return;
      }

      console.log('🔄 Initializing Facebook SDK...');
      
      window.FB.init({
        appId      : fbAppId,
        cookie     : true,
        xfbml      : true,
        version    : 'v18.0'
      });
      
      setIsLoaded(true);
      console.log('✅ Facebook SDK initialized successfully');
    };

    // Load the SDK script
    if (!document.getElementById('facebook-jssdk')) {
      console.log('📥 Loading Facebook SDK script...');
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      
      script.onerror = () => {
        console.error('❌ Failed to load Facebook SDK script');
      };
      
      script.onload = () => {
        console.log('✅ Facebook SDK script loaded');
      };
      
      document.body.appendChild(script);
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  return isLoaded;
};
