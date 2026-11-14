import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { FiDownload, FiExternalLink, FiRefreshCw } from "react-icons/fi";
import { toast } from "react-hot-toast";
export default function DocumentViewer({
  pdfUrl,
  pptUrl,
  pptPdfUrl,
  // Converted PDF from PowerPoint
  lectureTitle = "Lecture Materials"
}) {
  // Debug logging
  console.log('DocumentViewer Debug:', {
    pdfUrl,
    pptUrl,
    pptPdfUrl,
    lectureTitle
  });
  const [activeTab, setActiveTab] = useState(pdfUrl ? 'pdf' : pptUrl ? 'ppt' : null);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [, setPptError] = useState(false);
  const [documentLoading, setDocumentLoading] = useState(true);
  const [, setRetryCount] = useState(0);

  // If no documents are available

  const handleDownload = async (url, filename) => {
    try {
      setIsLoading(true);

      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'document';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  const openInNewTab = url => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setPdfError(false);
    setPptError(false);
    setDocumentLoading(true);

    // Add a small delay to show loading state
    setTimeout(() => {
      setDocumentLoading(false);
    }, 1000);
  };

  // Reset loading state when URLs change
  useEffect(() => {
    setActiveTab(current => current === 'pdf' && pdfUrl ? 'pdf' : current === 'ppt' && pptUrl ? 'ppt' : pdfUrl ? 'pdf' : pptUrl ? 'ppt' : null);
    setDocumentLoading(true);
    setPdfError(false);
    setPptError(false);
    const timer = setTimeout(() => {
      setDocumentLoading(false);
    }, 2000); // 2 second initial loading

    return () => clearTimeout(timer);
  }, [pdfUrl, pptUrl, pptPdfUrl]);
  if (!pdfUrl && !pptUrl) return null;
  return <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-slate-600/50 overflow-hidden shadow-2xl backdrop-blur-sm">
      {/* Enhanced Header with Animation */}
      <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 px-6 py-4 border-b border-slate-600/50 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
              <span className="text-white text-2xl">📚</span>
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Course Materials
              </h3>
              <p className="text-sm text-slate-400">Interactive learning resources</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium border border-green-500/30">
              ✓ Available
            </div>
            {documentLoading && <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium border border-blue-500/30 animate-pulse">
                Loading...
              </div>}
          </div>
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      {pdfUrl && pptUrl && <div className="flex bg-slate-800/50 backdrop-blur-sm border-b border-slate-600/50">
          <button onClick={() => setActiveTab('pdf')} className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-3 relative group ${activeTab === 'pdf' ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-white shadow-lg border-b-2 border-blue-400' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${activeTab === 'pdf' ? 'bg-blue-500 shadow-lg' : 'bg-slate-600 group-hover:bg-blue-500/50'}`}>
              <span className="text-white text-lg">📄</span>
            </div>
            <span>PDF Document</span>
            {activeTab === 'pdf' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 animate-pulse"></div>}
          </button>
          <button onClick={() => setActiveTab('ppt')} className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-3 relative group ${activeTab === 'ppt' ? 'bg-gradient-to-r from-orange-500/30 to-red-500/30 text-white shadow-lg border-b-2 border-orange-400' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${activeTab === 'ppt' ? 'bg-gradient-to-r from-orange-500 to-red-500 shadow-lg' : 'bg-slate-600 group-hover:bg-orange-500/50'}`}>
              <span className="text-white text-lg">📊</span>
            </div>
            <span>PowerPoint</span>
            {activeTab === 'ppt' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 to-red-400 animate-pulse"></div>}
          </button>
        </div>}

      {/* Enhanced Content Area */}
      <div className="p-6 bg-gradient-to-br from-slate-800/30 to-slate-900/30">
        {/* PDF Viewer - Blue Theme */}
        {activeTab === 'pdf' && pdfUrl && <div className="space-y-4">
            {/* Enhanced PDF Header */}
            <div className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-600/10 rounded-2xl p-6 border border-blue-500/20 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-2xl">📄</span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800 animate-pulse"></div>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-1">PDF Document</h4>
                    <p className="text-sm text-slate-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Interactive document viewer
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => openInNewTab(pdfUrl)} className="group flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform">
                    <FiExternalLink size={16} className="group-hover:rotate-12 transition-transform" />
                    <span className="font-medium">Open in New Tab</span>
                  </button>
                  <button onClick={() => handleDownload(pdfUrl, `${lectureTitle}.pdf`)} disabled={isLoading} className="group flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform disabled:opacity-50 disabled:scale-100">
                    <FiDownload size={16} className="group-hover:animate-bounce" />
                    <span className="font-medium">{isLoading ? 'Downloading...' : 'Download PDF'}</span>
                  </button>
                  <button onClick={handleRetry} className="group flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white text-sm rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform">
                    <FiRefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                    <span className="font-medium">Retry</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Enhanced PDF Viewer */}
            <div className="relative w-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-blue-500/30 shadow-2xl" style={{
          aspectRatio: '16/9',
          minHeight: '500px'
        }}>
              {documentLoading && <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-slate-900/50 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white font-medium">Loading PDF Document...</p>
                    <p className="text-slate-300 text-sm mt-1">Please wait while we prepare your document</p>
                  </div>
                </div>}
              {!pdfError ? <iframe src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=page-fit&view=FitH`} className="w-full h-full border-0 rounded-2xl" title="PDF Document" loading="lazy" onError={() => setPdfError(true)} onLoad={() => {
            setPdfError(false);
            setDocumentLoading(false);
          }} style={{
            minHeight: '500px'
          }} /> : <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-2xl">📄</span>
                    </div>
                    <p className="text-blue-900 dark:text-blue-100 text-lg font-semibold mb-2">PDF Preview Unavailable</p>
                    <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">Click the button below to view the PDF in a new tab</p>
                    <button onClick={() => openInNewTab(pdfUrl)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-lg">
                      Open PDF in New Tab
                    </button>
                  </div>
                </div>}
            </div>
            
            {/* Enhanced PDF Footer */}
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl p-4 border border-blue-500/20 backdrop-blur-sm">
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-blue-400">🔍</span>
                  <span>Zoom & Search</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-green-400">📱</span>
                  <span>Mobile Friendly</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-purple-400">⚙️</span>
                  <span>Full Controls</span>
                </div>
              </div>
            </div>
          </div>}

        {/* PPT Viewer - Orange/Red Theme */}
        {activeTab === 'ppt' && pptUrl && <div className="space-y-4">
            {/* PPT Header with Orange Theme */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-800/30 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl">📊</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-orange-900 dark:text-orange-100">PowerPoint Presentation</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">Interactive presentation viewer</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openInNewTab(pptUrl)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-sm rounded-lg transition-all duration-200 shadow-md hover:shadow-lg">
                    <FiExternalLink size={16} />
                    Open Original
                  </button>
                  <button onClick={() => handleDownload(pptUrl, `${lectureTitle}.pptx`)} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50">
                    <FiDownload size={16} />
                    {isLoading ? 'Downloading...' : 'Download PPT'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Show converted PDF if available, otherwise show PPT interface */}
            {pptPdfUrl ? <div className="space-y-4">
                {/* PDF Conversion Notice with Orange Theme */}
                <div className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-800/30 border border-orange-300 dark:border-orange-600 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">📄</span>
                    </div>
                    <div>
                      <p className="text-orange-900 dark:text-orange-100 font-medium text-sm">
                        <strong>PDF Preview Available</strong>
                      </p>
                      <p className="text-orange-700 dark:text-orange-300 text-xs">
                        Your PowerPoint has been converted to PDF for seamless viewing below
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* PDF Embed for converted PowerPoint with Orange Border */}
                <div className="relative w-full bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-800/20 rounded-xl overflow-hidden border-2 border-orange-300 dark:border-orange-600 shadow-xl" style={{
            aspectRatio: '16/9'
          }}>
                  {!pdfError ? <iframe src={`${pptPdfUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=page-fit&view=FitH`} className="w-full h-full border-0 rounded-xl" title="PowerPoint PDF Preview" loading="lazy" onError={() => setPdfError(true)} onLoad={() => setPdfError(false)} style={{
              minHeight: '400px'
            }} /> : <div className="flex items-center justify-center h-full bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/40 dark:to-amber-800/40">
                      <div className="text-center p-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-white text-2xl">📊</span>
                        </div>
                        <p className="text-orange-900 dark:text-orange-100 text-lg font-semibold mb-2">PDF Preview Unavailable</p>
                        <p className="text-orange-700 dark:text-orange-300 text-sm mb-4">Use the buttons above to view or download the presentation</p>
                      </div>
                    </div>}
                </div>
              </div> : (/* Original PPT Interface when no PDF conversion available */
        <div className="relative w-full bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-800/20 rounded-xl overflow-hidden border-2 border-orange-300 dark:border-orange-600 shadow-xl" style={{
          aspectRatio: '16/9'
        }}>
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-6 p-8">
                    <div className="w-20 h-20 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <span className="text-white text-3xl">📊</span>
                    </div>
                    <div>
                      <h5 className="text-2xl font-bold text-orange-900 dark:text-orange-100 mb-3">PowerPoint Presentation</h5>
                      <p className="text-orange-700 dark:text-orange-300 mb-6 max-w-lg mx-auto leading-relaxed">
                        Ready to view your presentation? Click below to open it in your browser or download it to your device.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button onClick={() => openInNewTab(pptUrl)} className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105">
                          <FiExternalLink size={20} />
                          Open Presentation
                        </button>
                        <button onClick={() => handleDownload(pptUrl, `${lectureTitle}.pptx`)} disabled={isLoading} className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none">
                          <FiDownload size={20} />
                          {isLoading ? 'Downloading...' : 'Download File'}
                        </button>
                      </div>
                      <div className="mt-8 p-4 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-600 rounded-lg">
                        <p className="text-orange-800 dark:text-orange-200 text-sm font-medium mb-2">💡 Best Viewing Experience:</p>
                        <ul className="text-orange-700 dark:text-orange-300 text-xs space-y-1 text-left max-w-md mx-auto">
                          <li>• Microsoft PowerPoint (Desktop/Online)</li>
                          <li>• Google Slides (Browser)</li>
                          <li>• LibreOffice Impress (Free alternative)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>)}
            
            {/* PPT Footer */}
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-700">
              <p className="text-xs text-orange-700 dark:text-orange-300 text-center flex items-center justify-center gap-2">
                <span>🎯</span>
                <span>PowerPoint presentations support animations, transitions, and interactive elements</span>
              </p>
            </div>
          </div>}

        {/* Single PDF Document View - Blue Theme */}
        {!activeTab && pdfUrl && !pptUrl && <div className="space-y-4">
            {/* Single PDF Header */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl">📄</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">PDF Document</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Interactive document viewer</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openInNewTab(pdfUrl)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all duration-200 shadow-md hover:shadow-lg">
                    <FiExternalLink size={16} />
                    Open in New Tab
                  </button>
                  <button onClick={() => handleDownload(pdfUrl, `${lectureTitle}.pdf`)} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50">
                    <FiDownload size={16} />
                    {isLoading ? 'Downloading...' : 'Download PDF'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Single PDF Viewer */}
            <div className="relative w-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl overflow-hidden border-2 border-blue-300 dark:border-blue-600 shadow-xl" style={{
          aspectRatio: '16/9'
        }}>
              {!pdfError ? <iframe src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=page-fit&view=FitH`} className="w-full h-full border-0 rounded-xl" title="PDF Document" loading="lazy" onError={() => setPdfError(true)} onLoad={() => setPdfError(false)} style={{
            minHeight: '400px'
          }} /> : <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-2xl">📄</span>
                    </div>
                    <p className="text-blue-900 dark:text-blue-100 text-lg font-semibold mb-2">PDF Preview Unavailable</p>
                    <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">Click the button below to view the PDF in a new tab</p>
                    <button onClick={() => openInNewTab(pdfUrl)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-lg">
                      Open PDF in New Tab
                    </button>
                  </div>
                </div>}
            </div>

            {/* Single PDF Footer */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
              <p className="text-xs text-blue-700 dark:text-blue-300 text-center flex items-center justify-center gap-2">
                <span>📖</span>
                <span>PDF documents support zooming, searching, and navigation controls</span>
              </p>
            </div>
          </div>}

        {/* Single PowerPoint Document View - Orange Theme */}
        {!activeTab && pptUrl && !pdfUrl && <div className="space-y-4">
            {/* Single PPT Header */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-800/30 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl">📊</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-orange-900 dark:text-orange-100">PowerPoint Presentation</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">Interactive presentation viewer</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openInNewTab(pptUrl)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-sm rounded-lg transition-all duration-200 shadow-md hover:shadow-lg">
                    <FiExternalLink size={16} />
                    View Online
                  </button>
                  <button onClick={() => handleDownload(pptUrl, `${lectureTitle}.pptx`)} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50">
                    <FiDownload size={16} />
                    {isLoading ? 'Downloading...' : 'Download PPT'}
                  </button>
                </div>
              </div>
            </div>
                
                {/* Single PPT Viewer */}
                <div className="relative w-full bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-800/20 rounded-xl overflow-hidden border-2 border-orange-300 dark:border-orange-600 shadow-xl" style={{
          aspectRatio: '16/9'
        }}>
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-6 p-8">
                      <div className="w-20 h-20 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="text-white text-3xl">📊</span>
                      </div>
                      <div>
                        <h5 className="text-2xl font-bold text-orange-900 dark:text-orange-100 mb-3">PowerPoint Presentation</h5>
                        <p className="text-orange-700 dark:text-orange-300 mb-6 max-w-lg mx-auto leading-relaxed">
                          Ready to view your presentation? Click below to open it in your browser or download it to your device.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                          <button onClick={() => openInNewTab(pptUrl)} className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105">
                            <FiExternalLink size={20} />
                            Open Presentation
                          </button>
                          <button onClick={() => handleDownload(pptUrl, `${lectureTitle}.pptx`)} disabled={isLoading} className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none">
                            <FiDownload size={20} />
                            {isLoading ? 'Downloading...' : 'Download File'}
                          </button>
                        </div>
                        <div className="mt-8 p-4 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-600 rounded-lg">
                          <p className="text-orange-800 dark:text-orange-200 text-sm font-medium mb-2">💡 Best Viewing Experience:</p>
                          <ul className="text-orange-700 dark:text-orange-300 text-xs space-y-1 text-left max-w-md mx-auto">
                            <li>• Microsoft PowerPoint (Desktop/Online)</li>
                            <li>• Google Slides (Browser)</li>
                            <li>• LibreOffice Impress (Free alternative)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Single PPT Footer */}
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-700">
                  <p className="text-xs text-orange-700 dark:text-orange-300 text-center flex items-center justify-center gap-2">
                    <span>🎯</span>
                    <span>PowerPoint presentations support animations, transitions, and interactive elements</span>
                  </p>
                </div>
              </div>}
            
            {/* Single PDF Document View - Blue Theme */}
            {!activeTab && pdfUrl && !pptUrl && <div className="space-y-4">
                {/* Single PDF Header */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xl">📄</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">PDF Document</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">Interactive document viewer</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openInNewTab(pdfUrl)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all duration-200 shadow-md hover:shadow-lg">
                        <FiExternalLink size={16} />
                        Open in New Tab
                      </button>
                      <button onClick={() => handleDownload(pdfUrl, `${lectureTitle}.pdf`)} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50">
                        <FiDownload size={16} />
                        {isLoading ? 'Downloading...' : 'Download PDF'}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Single PDF Viewer */}
                <div className="relative w-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl overflow-hidden border-2 border-blue-300 dark:border-blue-600 shadow-xl" style={{
          aspectRatio: '16/9'
        }}>
                  {!pdfError ? <iframe src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=page-fit&view=FitH`} className="w-full h-full border-0 rounded-xl" title="PDF Document" loading="lazy" onError={() => setPdfError(true)} onLoad={() => setPdfError(false)} style={{
            minHeight: '400px'
          }} /> : <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40">
                      <div className="text-center p-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-white text-2xl">📄</span>
                        </div>
                        <p className="text-blue-900 dark:text-blue-100 text-lg font-semibold mb-2">PDF Preview Unavailable</p>
                        <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">Click the button below to view the PDF in a new tab</p>
                        <button onClick={() => openInNewTab(pdfUrl)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-lg">
                          Open PDF in New Tab
                        </button>
                      </div>
                    </div>}
                </div>

                {/* Single PDF Footer */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                  <p className="text-xs text-blue-700 dark:text-blue-300 text-center flex items-center justify-center gap-2">
                    <span>📖</span>
                    <span>PDF documents support zooming, searching, and navigation controls</span>
                  </p>
                </div>
              </div>}

            {!activeTab && pptUrl && !pdfUrl && <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-richblack-100">📊 PowerPoint Presentation</h4>
                  <div className="flex gap-2">
                    <button onClick={() => openInNewTab(pptUrl)} className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-md transition-colors">
                      <FiExternalLink size={14} />
                      Open in New Tab
                    </button>
                    <button onClick={() => handleDownload(pptUrl, `${lectureTitle}.pptx`)} disabled={isLoading} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors disabled:opacity-50">
                      <FiDownload size={14} />
                      {isLoading ? 'Downloading...' : 'Download'}
                    </button>
                  </div>
                </div>
                
                <div className="relative w-full bg-richblack-900 rounded-lg overflow-hidden border border-richblack-600" style={{
          aspectRatio: '16/9'
        }}>
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-6 p-8">
                      <div className="text-7xl mb-4">📊</div>
                      <div>
                        <h5 className="text-2xl font-bold text-richblack-100 mb-3">PowerPoint Presentation</h5>
                        <p className="text-richblack-300 mb-6 max-w-lg mx-auto leading-relaxed">
                          Ready to view your presentation? Click below to open it in your browser or download it to your device.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                          <button onClick={() => openInNewTab(pptUrl)} className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105">
                            <FiExternalLink size={20} />
                            Open Presentation
                          </button>
                          <button onClick={() => handleDownload(pptUrl, `${lectureTitle}.pptx`)} disabled={isLoading} className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none">
                            <FiDownload size={20} />
                            {isLoading ? 'Downloading...' : 'Download File'}
                          </button>
                        </div>
                        <div className="mt-8 p-4 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-600 rounded-lg">
                          <p className="text-orange-800 dark:text-orange-200 text-sm font-medium mb-2">💡 Best Viewing Experience:</p>
                          <ul className="text-orange-700 dark:text-orange-300 text-xs space-y-1 text-left max-w-md mx-auto">
                            <li>• Microsoft PowerPoint (Desktop/Online)</li>
                            <li>• Google Slides (Browser)</li>
                            <li>• LibreOffice Impress (Free alternative)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Single PPT Footer */}
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-700">
                  <p className="text-xs text-orange-700 dark:text-orange-300 text-center flex items-center justify-center gap-2">
                    <span>🎯</span>
                    <span>PowerPoint presentations support animations, transitions, and interactive elements</span>
                  </p>
                </div>
          </div>}
      </div>
    </div>;
}
DocumentViewer.propTypes = {
  "pdfUrl": PropTypes.string,
  "pptUrl": PropTypes.string,
  "pptPdfUrl": PropTypes.string,
  "lectureTitle": PropTypes.string
};
