import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { FiChevronLeft, FiChevronRight, FiDownload, FiExternalLink, FiMaximize2 } from "react-icons/fi";
export default function SlideViewer({
  slides = [],
  // Array of slide image URLs
  pptUrl,
  lectureTitle = "Presentation"
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    if (!slides?.length) return undefined;
    const handleKeyPress = event => {
      if (event.key === 'ArrowLeft') setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
      if (event.key === 'ArrowRight') setCurrentSlide(prev => (prev + 1) % slides.length);
      if (event.key === 'Escape') setIsFullscreen(false);
      if (event.key.toLowerCase() === 'f') setIsFullscreen(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [slides?.length]);

  // If no slides available, show fallback
  if (!slides || slides.length === 0) {
    return <div className="relative w-full bg-richblack-900 rounded-lg overflow-hidden border border-richblack-600" style={{
      aspectRatio: '16/9'
    }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4 p-8">
            <div className="text-6xl mb-4">📊</div>
            <h5 className="text-xl font-semibold text-richblack-200 mb-3">PowerPoint Presentation</h5>
            <p className="text-sm text-richblack-400 mb-4">
              Slide preview not available. Use the buttons below to view the presentation.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => window.open(pptUrl, '_blank')} className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors">
                <FiExternalLink size={16} />
                Open Presentation
              </button>
              <button onClick={() => {
              const link = document.createElement('a');
              link.href = pptUrl;
              link.download = `${lectureTitle}.pptx`;
              link.click();
            }} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
                <FiDownload size={16} />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>;
  }
  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
  };
  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  };
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  return <>
      <div className={`relative w-full bg-richblack-900 rounded-lg overflow-hidden border border-richblack-600 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`} style={!isFullscreen ? {
      aspectRatio: '16/9'
    } : {}}>
        
        {/* Slide Image */}
        <div className="relative w-full h-full flex items-center justify-center bg-white">
          <img src={slides[currentSlide]} alt={`Slide ${currentSlide + 1}`} className="max-w-full max-h-full object-contain" loading="lazy" />
          
          {/* Loading overlay */}
          <div className="absolute inset-0 bg-richblack-900 flex items-center justify-center opacity-0 transition-opacity duration-200" id={`loading-${currentSlide}`}>
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-50"></div>
          </div>
        </div>

        {/* Controls Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 opacity-0 hover:opacity-100 transition-opacity duration-200">
          
          {/* Top Controls */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
              <span className="text-white text-sm font-medium">
                {currentSlide + 1} / {slides.length}
              </span>
            </div>
            
            <div className="flex gap-2">
              <button onClick={toggleFullscreen} className="bg-black/70 backdrop-blur-sm hover:bg-black/90 text-white p-2 rounded-lg transition-colors" title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                <FiMaximize2 size={18} />
              </button>
              
              {pptUrl && <>
                  <button onClick={() => window.open(pptUrl, '_blank')} className="bg-black/70 backdrop-blur-sm hover:bg-black/90 text-white p-2 rounded-lg transition-colors" title="Open Original">
                    <FiExternalLink size={18} />
                  </button>
                  
                  <button onClick={() => {
                const link = document.createElement('a');
                link.href = pptUrl;
                link.download = `${lectureTitle}.pptx`;
                link.click();
              }} className="bg-black/70 backdrop-blur-sm hover:bg-black/90 text-white p-2 rounded-lg transition-colors" title="Download">
                    <FiDownload size={18} />
                  </button>
                </>}
            </div>
          </div>

          {/* Navigation Controls */}
          {slides.length > 1 && <>
              <button onClick={prevSlide} className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/70 backdrop-blur-sm hover:bg-black/90 text-white p-3 rounded-full transition-colors" disabled={currentSlide === 0}>
                <FiChevronLeft size={24} />
              </button>
              
              <button onClick={nextSlide} className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/70 backdrop-blur-sm hover:bg-black/90 text-white p-3 rounded-full transition-colors" disabled={currentSlide === slides.length - 1}>
                <FiChevronRight size={24} />
              </button>
            </>}
        </div>

        {/* Slide Thumbnails */}
        {slides.length > 1 && <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex gap-2 bg-black/70 backdrop-blur-sm rounded-lg p-2 max-w-md overflow-x-auto">
              {slides.map((slide, index) => <button key={index} onClick={() => setCurrentSlide(index)} className={`flex-shrink-0 w-12 h-8 rounded border-2 transition-colors ${index === currentSlide ? 'border-yellow-50' : 'border-transparent hover:border-white/50'}`}>
                  <img src={slide} alt={`Slide ${index + 1}`} className="w-full h-full object-cover rounded" />
                </button>)}
            </div>
          </div>}

        {/* Keyboard Navigation Hint */}
        <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-xs opacity-0 hover:opacity-100 transition-opacity">
          Use ← → keys to navigate
        </div>
      </div>


    </>;
}
SlideViewer.propTypes = {
  "slides": PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  "pptUrl": PropTypes.string,
  "lectureTitle": PropTypes.string
};
