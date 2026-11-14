// Facebook SDK Initialization
window.fbAsyncInit = function() {
  // Get Facebook App ID from meta tag (set by Vite)
  const fbAppId = document.querySelector('meta[name="facebook-app-id"]')?.content || '';
  
  if (fbAppId) {
    window.FB.init({
      appId      : fbAppId,
      cookie     : true,
      xfbml      : true,
      version    : 'v18.0'
    });
    
    console.log('✅ Facebook SDK initialized');
  } else {
    console.warn('⚠️ Facebook App ID not found. Facebook login will not work.');
  }
};

// Load the SDK asynchronously
(function(d, s, id){
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement(s); js.id = id;
  js.src = "https://connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
