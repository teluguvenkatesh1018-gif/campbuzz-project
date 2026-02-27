const cloudinary = require('cloudinary').v2;

// Development mode - mock cloudinary if not configured
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your-cloud-name') {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('✅ Cloudinary configured successfully');
} else {
  console.log('🔧 Cloudinary running in development mode');
  // Mock methods for development
  cloudinary.uploader = {
    upload: async (filePath, options) => {
      console.log('📁 DEVELOPMENT: File would be uploaded to Cloudinary');
      console.log('File:', filePath);
      return {
        secure_url: `/uploads/${filePath.split('/').pop()}`,
        public_id: 'dev-' + Date.now()
      };
    }
  };
}

module.exports = cloudinary;