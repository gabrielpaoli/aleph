// src/config.js

const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'https://aleph.ddev.site',
  useDummyData: import.meta.env.VITE_USE_DUMMY_DATA === 'true',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// Log de configuración en desarrollo
if (config.isDevelopment) {
  console.log('⚙️ Application Configuration:');
  console.log('   API URL:', config.apiUrl);
  console.log('   Use Dummy Data:', config.useDummyData);
  console.log('   Environment:', config.isDevelopment ? 'Development' : 'Production');
}

export default config;
