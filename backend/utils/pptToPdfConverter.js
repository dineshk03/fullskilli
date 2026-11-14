const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Convert PowerPoint to PDF using LibreOffice (free solution)
const convertPptToPdf = async (pptFilePath, outputDir) => {
    try {
        console.log('🔄 Converting PPT to PDF:', pptFilePath);
        
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // LibreOffice command to convert PPT to PDF
        const command = `libreoffice --headless --convert-to pdf --outdir "${outputDir}" "${pptFilePath}"`;
        
        const { stdout, stderr } = await execPromise(command);
        
        if (stderr && !stderr.includes('Warning')) {
            throw new Error(`LibreOffice conversion error: ${stderr}`);
        }
        
        // Generate PDF filename
        const pptBasename = path.basename(pptFilePath, path.extname(pptFilePath));
        const pdfPath = path.join(outputDir, `${pptBasename}.pdf`);
        
        // Check if PDF was created
        if (fs.existsSync(pdfPath)) {
            console.log('✅ PPT converted to PDF successfully:', pdfPath);
            return pdfPath;
        } else {
            throw new Error('PDF file was not created');
        }
        
    } catch (error) {
        console.error('❌ PPT to PDF conversion failed:', error);
        throw error;
    }
};

// Alternative: Convert using online service (requires internet)
const convertPptToPdfOnline = async (pptBuffer, originalName) => {
    try {
        // This would use services like CloudConvert API
        // Implementation depends on chosen service
        console.log('🌐 Converting PPT to PDF using online service...');
        
        // Placeholder for online conversion
        // You would implement API calls to services like:
        // - CloudConvert
        // - ConvertAPI
        // - ILovePDF API
        
        throw new Error('Online conversion not implemented yet');
        
    } catch (error) {
        console.error('❌ Online PPT conversion failed:', error);
        throw error;
    }
};

// Convert PPT to images (slides as PNG/JPG)
const convertPptToImages = async (pptFilePath, outputDir) => {
    try {
        console.log('🖼️ Converting PPT to images:', pptFilePath);
        
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // LibreOffice command to convert PPT to images
        const command = `libreoffice --headless --convert-to png --outdir "${outputDir}" "${pptFilePath}"`;
        
        const { stdout, stderr } = await execPromise(command);
        
        if (stderr && !stderr.includes('Warning')) {
            throw new Error(`LibreOffice image conversion error: ${stderr}`);
        }
        
        // Find generated images
        const pptBasename = path.basename(pptFilePath, path.extname(pptFilePath));
        const imageFiles = fs.readdirSync(outputDir)
            .filter(file => file.startsWith(pptBasename) && file.endsWith('.png'))
            .sort();
        
        if (imageFiles.length > 0) {
            console.log(`✅ PPT converted to ${imageFiles.length} images`);
            return imageFiles.map(file => path.join(outputDir, file));
        } else {
            throw new Error('No image files were created');
        }
        
    } catch (error) {
        console.error('❌ PPT to images conversion failed:', error);
        throw error;
    }
};

module.exports = {
    convertPptToPdf,
    convertPptToPdfOnline,
    convertPptToImages
};
