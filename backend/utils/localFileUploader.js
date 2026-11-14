const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Create uploads directory if it doesn't exist
const createUploadsDirectory = () => {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const documentsDir = path.join(uploadsDir, 'documents');
    
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('📁 Created uploads directory:', uploadsDir);
    }
    
    if (!fs.existsSync(documentsDir)) {
        fs.mkdirSync(documentsDir, { recursive: true });
        console.log('📁 Created documents directory:', documentsDir);
    }
    
    return { uploadsDir, documentsDir };
};

// Generate unique filename
const generateUniqueFilename = (originalName) => {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName).toLowerCase();
    const baseName = path.basename(originalName, extension).replace(/[^a-zA-Z0-9]/g, '_');
    
    return `${baseName}_${timestamp}_${randomString}${extension}`;
};

// Save file locally
const saveFileLocally = async (file, folder = 'documents') => {
    try {
        console.log('💾 Starting local file save...');
        
        // Validate file
        if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
            throw new Error('Invalid file buffer');
        }

        // Create directories
        const { uploadsDir } = createUploadsDirectory();
        const targetDir = path.join(uploadsDir, folder);
        
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Generate unique filename
        const filename = generateUniqueFilename(file.originalname);
        const filePath = path.join(targetDir, filename);
        
        // Save file to local storage
        fs.writeFileSync(filePath, file.buffer);
        
        // Generate URL for accessing the file
        // Use dynamic base URL that works in both development and production
        const baseUrl = process.env.BASE_URL || 
                       (process.env.NODE_ENV === 'production' 
                         ? `http://${process.env.PUBLIC_IP || 'localhost'}:${process.env.PORT || 5001}`
                         : 'http://localhost:5001');
        const fileUrl = `${baseUrl}/uploads/${folder}/${filename}`;
        
        console.log('✅ File saved locally:', filePath);
        console.log('🔗 File URL:', fileUrl);
        
        return {
            secure_url: fileUrl,
            local_path: filePath,
            filename: filename,
            original_filename: file.originalname,
            size: file.buffer.length,
            mimetype: file.mimetype,
            folder: folder
        };

    } catch (error) {
        console.error('❌ Local file save failed:', error);
        throw new Error(`Failed to save file locally: ${error.message}`);
    }
};

// Delete local file
const deleteLocalFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('✅ Local file deleted:', filePath);
            return true;
        } else {
            console.warn('⚠️ File not found for deletion:', filePath);
            return false;
        }
    } catch (error) {
        console.error('❌ Failed to delete local file:', error);
        return false;
    }
};

// Get file info from URL
const getFileInfoFromUrl = (url) => {
    try {
        // Use dynamic base URL that works in both development and production
        const baseUrl = process.env.BASE_URL || 
                       (process.env.NODE_ENV === 'production' 
                         ? `http://${process.env.PUBLIC_IP || 'localhost'}:${process.env.PORT || 5001}`
                         : 'http://localhost:5001');
        if (url.startsWith(baseUrl + '/uploads/')) {
            const relativePath = url.replace(baseUrl + '/uploads/', '');
            const fullPath = path.join(__dirname, '..', 'uploads', relativePath);
            
            return {
                exists: fs.existsSync(fullPath),
                path: fullPath,
                relativePath: relativePath
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting file info:', error);
        return null;
    }
};

module.exports = {
    saveFileLocally,
    deleteLocalFile,
    getFileInfoFromUrl,
    createUploadsDirectory,
    generateUniqueFilename
};
