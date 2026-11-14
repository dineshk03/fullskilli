const fs = require('fs');
const path = require('path');
const NodeCache = require('node-cache');

// Create cache with 1 hour TTL and check period of 10 minutes
const fileCache = new NodeCache({ 
    stdTTL: 3600, // 1 hour
    checkperiod: 600, // 10 minutes
    useClones: false // Don't clone cached objects for better performance
});

// Cache for file stats to avoid repeated fs.stat calls
const statsCache = new NodeCache({ 
    stdTTL: 300, // 5 minutes
    checkperiod: 120 // 2 minutes
});

/**
 * Enhanced static file middleware with caching and concurrent access support
 */
const createCachedStaticMiddleware = (staticPath) => {
    return async (req, res, next) => {
        try {
            const filePath = path.join(staticPath, req.path);
            const cacheKey = `file_${req.path}`;
            const statsCacheKey = `stats_${req.path}`;
            
            // Check if file exists and get stats
            let fileStats = statsCache.get(statsCacheKey);
            if (!fileStats) {
                try {
                    fileStats = await fs.promises.stat(filePath);
                    statsCache.set(statsCacheKey, fileStats);
                } catch (error) {
                    if (error.code === 'ENOENT') {
                        return next(); // File not found, let Express handle 404
                    }
                    throw error;
                }
            }
            
            // Set appropriate headers for better caching
            const ext = path.extname(filePath).toLowerCase();
            let contentType = 'application/octet-stream';
            
            switch (ext) {
                case '.pdf':
                    contentType = 'application/pdf';
                    break;
                case '.ppt':
                case '.pptx':
                    contentType = 'application/vnd.ms-powerpoint';
                    break;
                case '.doc':
                case '.docx':
                    contentType = 'application/msword';
                    break;
                case '.jpg':
                case '.jpeg':
                    contentType = 'image/jpeg';
                    break;
                case '.png':
                    contentType = 'image/png';
                    break;
                case '.mp4':
                    contentType = 'video/mp4';
                    break;
            }
            
            // Set caching headers
            res.set({
                'Content-Type': contentType,
                'Content-Length': fileStats.size,
                'Last-Modified': fileStats.mtime.toUTCString(),
                'ETag': `"${fileStats.mtime.getTime()}-${fileStats.size}"`,
                'Cache-Control': 'public, max-age=3600', // 1 hour browser cache
                'Accept-Ranges': 'bytes'
            });
            
            // Check if client has cached version
            const clientETag = req.headers['if-none-match'];
            const serverETag = `"${fileStats.mtime.getTime()}-${fileStats.size}"`;
            
            if (clientETag === serverETag) {
                return res.status(304).end(); // Not modified
            }
            
            // Handle range requests for large files (videos, large PDFs)
            const range = req.headers.range;
            if (range && fileStats.size > 1024 * 1024) { // Only for files > 1MB
                return handleRangeRequest(filePath, fileStats, range, res);
            }
            
            // For smaller files or documents, try to serve from cache
            if (fileStats.size <= 10 * 1024 * 1024) { // Cache files <= 10MB
                let fileBuffer = fileCache.get(cacheKey);
                
                if (!fileBuffer) {
                    console.log(`📁 Loading file into cache: ${req.path}`);
                    fileBuffer = await fs.promises.readFile(filePath);
                    fileCache.set(cacheKey, fileBuffer);
                } else {
                    console.log(`⚡ Serving from cache: ${req.path}`);
                }
                
                return res.send(fileBuffer);
            } else {
                // For large files, stream directly without caching
                console.log(`📤 Streaming large file: ${req.path}`);
                const stream = fs.createReadStream(filePath);
                stream.pipe(res);
                
                stream.on('error', (error) => {
                    console.error('Stream error:', error);
                    if (!res.headersSent) {
                        res.status(500).json({ error: 'Error streaming file' });
                    }
                });
            }
            
        } catch (error) {
            console.error('File serving error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error serving file' });
            }
        }
    };
};

/**
 * Handle HTTP range requests for partial content delivery
 */
const handleRangeRequest = (filePath, fileStats, range, res) => {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileStats.size - 1;
    const chunksize = (end - start) + 1;
    
    if (start >= fileStats.size || end >= fileStats.size) {
        res.status(416).set({
            'Content-Range': `bytes */${fileStats.size}`
        });
        return res.end();
    }
    
    res.status(206).set({
        'Content-Range': `bytes ${start}-${end}/${fileStats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
    });
    
    const stream = fs.createReadStream(filePath, { start, end });
    stream.pipe(res);
    
    stream.on('error', (error) => {
        console.error('Range stream error:', error);
        if (!res.headersSent) {
            res.status(500).end();
        }
    });
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
    return {
        fileCache: {
            keys: fileCache.keys().length,
            stats: fileCache.getStats()
        },
        statsCache: {
            keys: statsCache.keys().length,
            stats: statsCache.getStats()
        }
    };
};

/**
 * Clear cache manually
 */
const clearCache = () => {
    fileCache.flushAll();
    statsCache.flushAll();
    console.log('📁 File cache cleared');
};

module.exports = {
    createCachedStaticMiddleware,
    getCacheStats,
    clearCache
};
