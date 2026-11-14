const Section = require('../models/section');
const SubSection = require('../models/subSection');
const Course = require('../models/course');
const Quiz = require('../models/quiz');
const path = require('path');
const { uploadFileToS3 } = require('../utils/s3Uploader');
const { saveFileLocally } = require('../utils/localFileUploader');
const { convertPptToPdf } = require('../utils/pptToPdfConverter');
const { createNewContentNotification } = require('./notification');
const { handleNewContentAddition } = require('../utils/certificateRegeneration');

// Helper function to get error suggestions
const getSuggestionForError = (statusCode, fileSize) => {
    switch (statusCode) {
        case 413:
            return 'Please compress your video or split it into smaller parts.';
        case 408:
            return 'Upload timed out. Try with a smaller file or check your internet connection.';
        case 400:
            return 'Please check the video format and ensure it\'s a valid video file.';
        case 503:
            return 'Service temporarily unavailable. Please try again later.';
        case 507:
            return 'Server storage full. Please try with a smaller file or contact support.';
        default:
            if (fileSize > 1024 * 1024 * 1024) { // > 1GB
                return 'Large file detected. Please ensure stable internet connection and try again.';
            }
            return 'Please try uploading again or contact support if the issue persists.';
    }
};

// ================ Update SubSection ================
exports.updateSubSection = async (req, res) => {
    try {
        console.log('=== UPDATE SUBSECTION DEBUG ===');
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);
        if (req.files) {
            Object.keys(req.files).forEach(key => {
                const file = req.files[key][0];
                console.log(`File ${key}:`, {
                    originalname: file.originalname,
                    size: file.size,
                    mimetype: file.mimetype,
                    fieldname: file.fieldname,
                    hasBuffer: !!file.buffer,
                    hasLocation: !!file.location,
                    location: file.location
                });
            });
        }
        console.log('=== END DEBUG ===');
        
        const { sectionId, subSectionId, title, description, questions, videoUrl, pdfUrl, pptUrl } = req.body;

        // validation
        if (!subSectionId) {
            return res.status(400).json({
                success: false,
                message: 'subSection ID is required to update'
            });
        }

        // find in DB
        const subSection = await SubSection.findById(subSectionId);

        if (!subSection) {
            return res.status(404).json({
                success: false,
                message: "SubSection not found",
            });
        }

        // add data
        if (title) {
            subSection.title = title;
        }

        if (description) {
            subSection.description = description;
        }

        // Handle video upload
        if (videoUrl) {
            // Use direct upload URL
            console.log('Using direct upload URL for video (update):', videoUrl);
            subSection.videoUrl = videoUrl;
            subSection.timeDuration = 0; // Duration will be extracted later if needed
        } else if (req.files && req.files.videoFile && req.files.videoFile[0]) {
            try {
                const video = req.files.videoFile[0];
                console.log('Processing video file (update):', video.originalname);
                console.log('Video file size:', (video.size / (1024 * 1024)).toFixed(2) + 'MB');

                // Check if file was already uploaded to S3 by multer-s3
                if (video.location) {
                    // File already uploaded to S3 by multer-s3
                    console.log('✅ Video already uploaded to S3 by multer-s3:', video.location);
                    subSection.videoUrl = video.location;
                    subSection.timeDuration = 0; // Duration will be set to 0 for now, can be extracted later
                    console.log('Video URL set from multer-s3:', video.location);
                } else if (video.buffer) {
                    // File is in buffer, needs to be uploaded manually
                    console.log('Uploading video file manually to S3...');
                    
                    const fileSize = video.size;
                    const isLargeFile = fileSize > 500 * 1024 * 1024; // 500MB
                    const timeoutDuration = isLargeFile ? 7200000 : 3600000; // 2 hours for large files, 1 hour for others

                    console.log(`Setting upload timeout to ${timeoutDuration / 60000} minutes for file size: ${(fileSize / (1024 * 1024)).toFixed(2)}MB`);

                    const uploadTimeout = setTimeout(() => {
                        throw new Error('Upload timeout exceeded - file may be too large or connection too slow');
                    }, timeoutDuration);

                    try {
                        const uploadDetails = await uploadFileToS3(video, 'videos');
                        console.log('✅ Video uploaded to S3:', uploadDetails.secure_url);

                        // Clear the timeout as upload succeeded
                        clearTimeout(uploadTimeout);

                        console.log('Video duration (update):', uploadDetails.duration);
                        console.log('Upload method:', uploadDetails.size > 25 * 1024 * 1024 ? 'Chunked Upload' : 'Direct Upload');
                        subSection.videoUrl = uploadDetails.secure_url;

                        // Ensure duration is properly set
                        const duration = uploadDetails.duration || 0;
                        subSection.timeDuration = duration;

                        console.log('Video uploaded successfully:', uploadDetails.secure_url);
                        console.log('Setting timeDuration to (update):', subSection.timeDuration);

                        // Validate that duration was set
                        if (duration === 0) {
                            console.warn('⚠️ Video duration is 0 - this may cause course duration calculation issues');
                        }
                    } catch (uploadError) {
                        // Clear the timeout as upload failed
                        clearTimeout(uploadTimeout);
                        throw uploadError;
                    }
                } else {
                    throw new Error('Video file has no buffer or location - invalid file upload');
                }
            } catch (uploadError) {
                console.error('Video upload failed (update):', uploadError);

                // Provide more detailed error messages based on error type
                let errorMessage = 'Video upload failed';
                let statusCode = 500;

                if (uploadError.message.includes('timeout')) {
                    errorMessage = 'Video upload timed out. Large videos may take longer to process. Please try again or use a smaller file.';
                    statusCode = 408;
                } else if (uploadError.message.includes('chunk')) {
                    errorMessage = 'Error during chunked upload process. This may be due to network issues or server load. Please try again.';
                    statusCode = 500;
                } else if (uploadError.message.includes('file size') || uploadError.message.includes('exceeds maximum limit')) {
                    errorMessage = 'Video file is too large. Maximum supported size is 2GB.';
                    statusCode = 413;
                } else if (uploadError.message.includes('Invalid video file') || uploadError.message.includes('format')) {
                    errorMessage = 'Invalid video format. Please use MP4, WebM, OGG, AVI, MKV, or MOV formats.';
                    statusCode = 400;
                } else if (uploadError.message.includes('network') || uploadError.message.includes('connection')) {
                    errorMessage = 'Network error during upload. Please check your connection and try again.';
                    statusCode = 503;
                } else if (uploadError.message.includes('validation failed')) {
                    errorMessage = uploadError.message;
                    statusCode = 400;
                } else if (uploadError.message.includes('storage')) {
                    errorMessage = 'Storage service error. Please try again later or contact support.';
                    statusCode = 503;
                } else if (uploadError.message.includes('memory') || uploadError.message.includes('heap')) {
                    errorMessage = 'Server memory error processing large file. Please try a smaller file or contact support.';
                    statusCode = 507;
                }

                return res.status(statusCode).json({
                    success: false,
                    message: errorMessage,
                    error: uploadError.message,
                    details: {
                        fileName: req.file ? req.file.originalname : 'unknown',
                        fileSize: req.file ? req.file.size : 0,
                        fileSizeMB: req.file ? (req.file.size / (1024 * 1024)).toFixed(2) + 'MB' : '0MB',
                        mimeType: req.file ? req.file.mimetype : 'unknown',
                        errorType: uploadError.name,
                        timestamp: new Date().toISOString(),
                        suggestion: getSuggestionForError(statusCode, req.file ? req.file.size : 0),
                        supportInfo: 'If this error persists, please contact support with the error details above.'
                    }
                });
            }
        }

        // Handle PDF upload
        if (pdfUrl) {
            console.log('Using direct upload URL for PDF (update):', pdfUrl);
            subSection.pdfUrl = pdfUrl;
        } else if (req.files && req.files.pdfFile && req.files.pdfFile[0]) {
            try {
                const pdfFile = req.files.pdfFile[0];
                console.log('Saving PDF file locally (update):', pdfFile.originalname);
                console.log('PDF file size:', (pdfFile.size / (1024 * 1024)).toFixed(2) + 'MB');

                const pdfUploadDetails = await saveFileLocally(pdfFile, 'documents');
                console.log('✅ PDF saved locally:', pdfUploadDetails.secure_url);

                subSection.pdfUrl = pdfUploadDetails.secure_url;
                console.log('PDF saved successfully:', pdfUploadDetails.secure_url);
            } catch (uploadError) {
                console.error('PDF save failed (update):', uploadError);
                return res.status(500).json({
                    success: false,
                    message: 'PDF save failed: ' + uploadError.message,
                    error: uploadError.message
                });
            }
        }

        // Handle PPT upload and conversion
        if (pptUrl) {
            console.log('Using direct upload URL for PPT (update):', pptUrl);
            subSection.pptUrl = pptUrl;
        } else if (req.files && req.files.pptFile && req.files.pptFile[0]) {
            try {
                const pptFile = req.files.pptFile[0];
                console.log('Saving PPT file locally (update):', pptFile.originalname);
                console.log('PPT file size:', (pptFile.size / (1024 * 1024)).toFixed(2) + 'MB');

                // Save original PPT file
                const pptUploadDetails = await saveFileLocally(pptFile, 'documents');
                console.log('✅ PPT saved locally:', pptUploadDetails.secure_url);
                subSection.pptUrl = pptUploadDetails.secure_url;

                // Convert PPT to PDF for better viewing
                try {
                    console.log('🔄 Converting PPT to PDF (update)...');
                    const pdfPath = await convertPptToPdf(pptUploadDetails.local_path, path.dirname(pptUploadDetails.local_path));

                    if (pdfPath && require('fs').existsSync(pdfPath)) {
                        // Generate URL for converted PDF
                        const pdfFilename = path.basename(pdfPath);
                        // Use dynamic base URL that works in both development and production
                        const baseUrl = process.env.BASE_URL ||
                            (process.env.NODE_ENV === 'production'
                                ? `http://${process.env.PUBLIC_IP || 'localhost'}:${process.env.PORT || 5001}`
                                : 'http://localhost:5001');
                        const convertedPdfUrl = `${baseUrl}/uploads/documents/${pdfFilename}`;
                        subSection.pptPdfUrl = convertedPdfUrl;
                        console.log('✅ PPT converted to PDF (update):', convertedPdfUrl);
                    }
                } catch (conversionError) {
                    console.warn('⚠️ PPT to PDF conversion failed (update), keeping original PPT:', conversionError.message);
                    // Continue without PDF conversion - not a fatal error
                }

                console.log('PPT processing completed successfully (update)');
            } catch (uploadError) {
                console.error('PPT save failed (update):', uploadError);
                return res.status(500).json({
                    success: false,
                    message: 'PPT save failed: ' + uploadError.message,
                    error: uploadError.message
                });
            }
        }

        // Handle quiz attachment
        if (req.body.quiz !== undefined) {
            if (req.body.quiz === '' || req.body.quiz === null) {
                // Remove quiz reference
                subSection.quiz = null;
            } else {
                // Attach existing quiz
                const quizExists = await Quiz.findById(req.body.quiz);
                if (quizExists) {
                    subSection.quiz = req.body.quiz;
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Quiz not found'
                    });
                }
            }
        }

        // save data to DB
        await subSection.save();

        const updatedSection = await Section.findById(sectionId).populate("subSection");

        // Handle certificate regeneration if content was modified
        if (title || description || req.file || req.body.quiz !== undefined) {
            // Find the course that contains this section
            const course = await Course.findOne({
                courseContent: sectionId
            });

            if (course) {
                try {
                    await handleNewContentAddition(
                        course._id,
                        'lecture_update',
                        {
                            sectionId,
                            subSectionId,
                            title: subSection.title,
                            hasVideo: !!subSection.videoUrl,
                            hasQuiz: !!subSection.quiz,
                            updateType: 'modification'
                        }
                    );
                } catch (certError) {
                    console.error('Error handling certificate regeneration:', certError);
                    // Don't fail the subsection update if certificate regeneration fails
                }
            }
        }

        return res.json({
            success: true,
            data: updatedSection,
            message: "Section updated successfully",
        });
    } catch (error) {
        console.error('=== DETAILED ERROR LOGGING ===');
        console.error('Error while updating the section');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Request body:', req.body);
        console.error('Request files:', req.files ? Object.keys(req.files) : 'No files');
        console.error('=== END ERROR LOGGING ===');
        
        return res.status(500).json({
            success: false,
            error: error.message,
            message: "Error while updating the section",
            details: {
                errorName: error.name,
                errorMessage: error.message,
                stack: error.stack,
                requestBody: req.body,
                hasFiles: !!req.files,
                fileKeys: req.files ? Object.keys(req.files) : []
            }
        });
    }
};


// ================ create SubSection ================
exports.createSubSection = async (req, res) => {
    try {
        // extract data
        const { title, description, sectionId, questions, videoUrl, pdfUrl, pptUrl } = req.body;

        // Debug logging
        console.log('📝 CREATE SUBSECTION - Request body:', req.body);
        console.log('📝 CREATE SUBSECTION - Request files:', req.files);

        // extract files - multer.fields() puts files in req.files
        const videoFile = req.files && req.files.video ? req.files.video[0] : null;
        const pdfFile = req.files && req.files.pdf ? req.files.pdf[0] : null;
        const pptFile = req.files && req.files.ppt ? req.files.ppt[0] : null;

        console.log('📝 CREATE SUBSECTION - Final videoFile:', videoFile ? {
            fieldname: videoFile.fieldname,
            originalname: videoFile.originalname,
            size: videoFile.size
        } : 'No video file found');
        console.log('📝 CREATE SUBSECTION - Final pdfFile:', pdfFile ? {
            fieldname: pdfFile.fieldname,
            originalname: pdfFile.originalname,
            size: pdfFile.size
        } : 'No PDF file found');
        console.log('📝 CREATE SUBSECTION - Final pptFile:', pptFile ? {
            fieldname: pptFile.fieldname,
            originalname: pptFile.originalname,
            size: pptFile.size
        } : 'No PPT file found');
        console.log('📝 CREATE SUBSECTION - videoUrl:', videoUrl);

        // validation
        if (!title || !description || !sectionId) {
            console.error('❌ VALIDATION FAILED:', {
                title: title || 'MISSING',
                description: description || 'MISSING',
                sectionId: sectionId || 'MISSING'
            });
            return res.status(400).json({
                success: false,
                message: 'Title, description, and sectionId are required',
                received: {
                    title: title || null,
                    description: description || null,
                    sectionId: sectionId || null
                }
            });
        }

        // Check if at least one file type is provided (video, PDF, or PPT)
        const hasVideo = videoUrl || videoFile;
        const hasPdf = pdfUrl || pdfFile;
        const hasPpt = pptUrl || pptFile;

        if (!hasVideo && !hasPdf && !hasPpt) {
            console.error('❌ CONTENT VALIDATION FAILED: No content files provided');
            return res.status(400).json({
                success: false,
                message: 'At least one content file is required (Video, PDF, or PowerPoint)',
                details: {
                    hasVideo: !!hasVideo,
                    hasPdf: !!hasPdf,
                    hasPpt: !!hasPpt,
                    suggestion: 'Please upload at least one of: Video file, PDF document, or PowerPoint presentation'
                }
            });
        }

        console.log('✅ Content validation passed:', {
            hasVideo: !!hasVideo,
            hasPdf: !!hasPdf,
            hasPpt: !!hasPpt
        });

        // Validate section exists
        const section = await Section.findById(sectionId);
        if (!section) {
            return res.status(404).json({
                success: false,
                message: 'Section not found'
            });
        }

        let finalVideoUrl = '';
        let timeDuration = 0;

        if (videoUrl) {
            // Use direct upload URL
            console.log('Using direct upload URL for video:', videoUrl);
            finalVideoUrl = videoUrl;
            timeDuration = 0; // Duration will be extracted later if needed
        } else if (videoFile) {
            try {
                // Check if file was already uploaded to S3 by multer-s3
                if (videoFile.location) {
                    // File already uploaded to S3 by multer-s3
                    console.log('✅ Video already uploaded to S3 by multer-s3:', videoFile.location);
                    finalVideoUrl = videoFile.location;
                    timeDuration = 0; // Duration will be set to 0 for now, can be extracted later
                } else {
                    // File is in buffer, needs to be uploaded
                    console.log('Starting video upload to S3...');
                    console.log('Video file details:', {
                        originalname: videoFile.originalname,
                        mimetype: videoFile.mimetype,
                        size: videoFile.size,
                        sizeInMB: (videoFile.size / (1024 * 1024)).toFixed(2) + 'MB'
                    });

                    // Set a timeout for the entire upload process (extended for large files)
                    const fileSize = videoFile.size;
                    const isLargeFile = fileSize > 500 * 1024 * 1024; // 500MB
                    const timeoutDuration = isLargeFile ? 7200000 : 3600000; // 2 hours for large files, 1 hour for others

                    console.log(`Setting upload timeout to ${timeoutDuration / 60000} minutes for file size: ${(fileSize / (1024 * 1024)).toFixed(2)}MB`);

                    const uploadTimeout = setTimeout(() => {
                        throw new Error('Upload timeout exceeded - file may be too large or connection too slow');
                    }, timeoutDuration);

                    try {
                        // Upload video to S3 (will automatically use chunked upload for large files)
                        console.log('🚀 Starting video upload process...');
                        const videoFileDetails = await uploadFileToS3(videoFile, 'videos');
                        console.log('✅ Video uploaded to S3:', videoFileDetails.secure_url);

                        // Clear the timeout as upload succeeded
                        clearTimeout(uploadTimeout);

                        console.log('Video upload completed successfully:', {
                            url: videoFileDetails.secure_url,
                            duration: videoFileDetails.duration,
                            size: videoFileDetails.size,
                            isChunked: videoFileDetails.isChunked || false,
                            uploadMethod: videoFileDetails.size > 50 * 1024 * 1024 ? 'Chunked Upload' : 'Direct Upload'
                        });

                        finalVideoUrl = videoFileDetails.secure_url;
                        // Duration in seconds
                        timeDuration = videoFileDetails.duration || 0;

                        console.log('Setting timeDuration to:', timeDuration);

                        // Validate that duration was set
                        if (timeDuration === 0) {
                            console.warn('⚠️ Video duration is 0 - this may cause course duration calculation issues');
                            console.warn('This could be due to video processing or metadata extraction issues');
                        }
                    } catch (uploadError) {
                        // Clear the timeout as upload failed
                        clearTimeout(uploadTimeout);

                        // Enhanced error logging for debugging
                        console.error('❌ Video upload failed with detailed error:', {
                            message: uploadError.message,
                            stack: uploadError.stack,
                            fileName: videoFile.originalname,
                            fileSize: videoFile.size,
                            fileSizeMB: (videoFile.size / (1024 * 1024)).toFixed(2) + 'MB',
                            mimeType: videoFile.mimetype
                        });

                        throw uploadError;
                    }
                }
            } catch (uploadError) {
                console.error('Video upload failed:', uploadError);

                // Provide more detailed error messages based on error type
                let errorMessage = 'Video upload failed';
                let statusCode = 500;

                if (uploadError.message.includes('timeout')) {
                    errorMessage = 'Video upload timed out. Large videos may take longer to process. Please try again or use a smaller file.';
                    statusCode = 408;
                } else if (uploadError.message.includes('chunk')) {
                    errorMessage = 'Error during chunked upload process. This may be due to network issues or server load. Please try again.';
                    statusCode = 500;
                } else if (uploadError.message.includes('file size') || uploadError.message.includes('exceeds maximum limit')) {
                    errorMessage = 'Video file is too large. Maximum supported size is 2GB.';
                    statusCode = 413;
                } else if (uploadError.message.includes('Invalid video file') || uploadError.message.includes('format')) {
                    errorMessage = 'Invalid video format. Please use MP4, WebM, OGG, AVI, MKV, or MOV formats.';
                    statusCode = 400;
                } else if (uploadError.message.includes('network') || uploadError.message.includes('connection')) {
                    errorMessage = 'Network error during upload. Please check your connection and try again.';
                    statusCode = 503;
                } else if (uploadError.message.includes('validation failed')) {
                    errorMessage = uploadError.message;
                    statusCode = 400;
                } else if (uploadError.message.includes('storage')) {
                    errorMessage = 'Storage service error. Please try again later or contact support.';
                    statusCode = 503;
                } else if (uploadError.message.includes('memory') || uploadError.message.includes('heap')) {
                    errorMessage = 'Server memory error processing large file. Please try a smaller file or contact support.';
                    statusCode = 507;
                }

                return res.status(statusCode).json({
                    success: false,
                    message: errorMessage,
                    error: uploadError.message,
                    details: {
                        fileName: videoFile.originalname,
                        fileSize: videoFile.size,
                        fileSizeMB: (videoFile.size / (1024 * 1024)).toFixed(2) + 'MB',
                        mimeType: videoFile.mimetype,
                        errorType: uploadError.name,
                        timestamp: new Date().toISOString(),
                        suggestion: getSuggestionForError(statusCode, videoFile.size),
                        supportInfo: 'If this error persists, please contact support with the error details above.'
                    }
                });
            }
        } else {
            console.log('No video file or URL provided, creating subsection without video');
            finalVideoUrl = null; // No video URL when no file is provided
        }

        // Handle PDF upload
        let finalPdfUrl = null;
        if (pdfUrl) {
            console.log('Using direct upload URL for PDF:', pdfUrl);
            finalPdfUrl = pdfUrl;
        } else if (pdfFile) {
            try {
                // If multer-s3 has already uploaded the PDF, use its S3 URL
                if (pdfFile.location) {
                    console.log('✅ PDF already uploaded to S3 by multer-s3:', pdfFile.location);
                    finalPdfUrl = pdfFile.location;
                } else {
                    console.log('Starting PDF save locally...');
                    console.log('PDF file details:', {
                        originalname: pdfFile.originalname,
                        mimetype: pdfFile.mimetype,
                        size: pdfFile.size,
                        sizeInMB: (pdfFile.size / (1024 * 1024)).toFixed(2) + 'MB'
                    });

                    const pdfUploadDetails = await saveFileLocally(pdfFile, 'documents');
                    console.log('✅ PDF saved locally:', pdfUploadDetails.secure_url);

                    finalPdfUrl = pdfUploadDetails.secure_url;
                    console.log('PDF save completed successfully:', finalPdfUrl);
                }
            } catch (uploadError) {
                console.error('PDF save failed:', uploadError);
                return res.status(500).json({
                    success: false,
                    message: 'PDF save failed: ' + uploadError.message,
                    error: uploadError.message
                });
            }
        } else {
            console.log('No PDF file or URL provided');
        }

        // Handle PPT upload and conversion
        let finalPptUrl = null;
        let convertedPdfUrl = null;
        if (pptUrl) {
            console.log('Using direct upload URL for PPT:', pptUrl);
            finalPptUrl = pptUrl;
        } else if (pptFile) {
            try {
                // If multer-s3 has already uploaded the PPT, use its S3 URL directly
                if (pptFile.location) {
                    console.log('✅ PPT already uploaded to S3 by multer-s3:', pptFile.location);
                    finalPptUrl = pptFile.location;
                    // Skip local save and PPT->PDF conversion when using S3 URL
                } else {
                    console.log('Starting PPT save and conversion...');
                    console.log('PPT file details:', {
                        originalname: pptFile.originalname,
                        mimetype: pptFile.mimetype,
                        size: pptFile.size,
                        sizeInMB: (pptFile.size / (1024 * 1024)).toFixed(2) + 'MB'
                    });

                    // Save original PPT file
                    const pptUploadDetails = await saveFileLocally(pptFile, 'documents');
                    console.log('✅ PPT saved locally:', pptUploadDetails.secure_url);
                    finalPptUrl = pptUploadDetails.secure_url;

                    // Convert PPT to PDF for better viewing
                    try {
                        console.log('🔄 Converting PPT to PDF...');
                        const pdfPath = await convertPptToPdf(pptUploadDetails.local_path, path.dirname(pptUploadDetails.local_path));

                        if (pdfPath && require('fs').existsSync(pdfPath)) {
                            // Generate URL for converted PDF
                            const pdfFilename = path.basename(pdfPath);
                            // Use dynamic base URL that works in both development and production
                            const baseUrl = process.env.BASE_URL ||
                                (process.env.NODE_ENV === 'production'
                                    ? `http://${process.env.PUBLIC_IP || 'localhost'}:${process.env.PORT || 5001}`
                                    : 'http://localhost:5001');
                            convertedPdfUrl = `${baseUrl}/uploads/documents/${pdfFilename}`;
                            console.log('✅ PPT converted to PDF:', convertedPdfUrl);
                        }
                    } catch (conversionError) {
                        console.warn('⚠️ PPT to PDF conversion failed, keeping original PPT:', conversionError.message);
                        // Continue without PDF conversion - not a fatal error
                    }

                    console.log('PPT processing completed successfully');
                }
            } catch (uploadError) {
                console.error('PPT save failed:', uploadError);
                return res.status(500).json({
                    success: false,
                    message: 'PPT save failed: ' + uploadError.message,
                    error: uploadError.message
                });
            }
        } else {
            console.log('No PPT file or URL provided');
        }

        // create entry in DB
        const SubSectionDetails = await SubSection.create({
            title,
            timeDuration,
            description,
            videoUrl: finalVideoUrl,
            pdfUrl: finalPdfUrl,
            pptUrl: finalPptUrl,
            pptPdfUrl: convertedPdfUrl,
            section: sectionId  // Add the section reference
        });

        // Handle quiz attachment
        if (req.body.quiz) {
            const quizExists = await Quiz.findById(req.body.quiz);
            if (quizExists) {
                SubSectionDetails.quiz = req.body.quiz;
                await SubSectionDetails.save();
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Quiz not found'
                });
            }
        }

        // link subsection id to section
        // Update the corresponding section with the newly created sub-section
        const updatedSection = await Section.findByIdAndUpdate(
            { _id: sectionId },
            { $push: { subSection: SubSectionDetails._id } },
            { new: true }
        ).populate("subSection");

        // Find the course that contains this section to notify students
        const course = await Course.findOne({
            courseContent: sectionId
        });

        if (course) {
            // Notify enrolled students about new content
            await createNewContentNotification(
                course._id,
                sectionId,
                SubSectionDetails._id
            );

            // Handle certificate regeneration for students who completed the course
            try {
                await handleNewContentAddition(
                    course._id,
                    'lecture',
                    {
                        sectionId,
                        subSectionId: SubSectionDetails._id,
                        title: SubSectionDetails.title,
                        hasVideo: !!finalVideoUrl
                    }
                );
            } catch (certError) {
                console.error('Error handling certificate regeneration:', certError);
                // Don't fail the subsection creation if certificate regeneration fails
            }
        }

        // return response
        res.status(200).json({
            success: true,
            data: updatedSection,
            message: 'SubSection created successfully'
        });
    }
    catch (error) {
        console.log('Error while creating SubSection');
        console.log(error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while creating SubSection',
            details: {
                stack: error.stack,
                name: error.name
            }
        });
    }
}

// ================ Delete SubSection ================
exports.deleteSubSection = async (req, res) => {
    try {
        const { subSectionId, sectionId } = req.body
        await Section.findByIdAndUpdate(
            { _id: sectionId },
            {
                $pull: {
                    subSection: subSectionId,
                },
            }
        )

        // delete from DB
        const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })

        if (!subSection) {
            return res
                .status(404)
                .json({ success: false, message: "SubSection not found" })
        }

        const updatedSection = await Section.findById(sectionId).populate('subSection')

        // In frontned we have to take care - when subsection is deleted we are sending ,
        // only section data not full course details as we do in others 

        // success response
        return res.json({
            success: true,
            data: updatedSection,
            message: "SubSection deleted successfully",
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            error: error.message,
            message: "An error occurred while deleting the SubSection",
        })
    }
}
