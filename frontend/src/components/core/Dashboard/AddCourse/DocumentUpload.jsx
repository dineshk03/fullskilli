import PropTypes from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FiUploadCloud } from "react-icons/fi";
export default function DocumentUpload({
  name,
  label,
  register,
  setValue,
  errors,
  viewData = null,
  editData = null,
  documentType = "pdf" // "pdf" or "ppt"
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewSource, setPreviewSource] = useState("");
  const [previewError, setPreviewError] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const inputRef = useRef(null);

  // Reset upload state
  const resetUploadState = () => {
    setSelectedFile(null);
    setPreviewSource("");
    setPreviewError(null);
    setIsLoadingPreview(false);
  };

  // Handle file drop
  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    console.log("Document selected:", {
      name: file.name,
      type: file.type,
      size: file.size
    });
    if (file) {
      setSelectedFile(file);
      previewFile(file);
    }
  }, []);

  // Get accepted file types based on document type
  const getAcceptedTypes = () => {
    if (documentType === "pdf") {
      return {
        "application/pdf": [".pdf"]
      };
    } else if (documentType === "ppt") {
      return {
        "application/vnd.ms-powerpoint": [".ppt"],
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"]
      };
    }
    return {
      "application/pdf": [".pdf"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"]
    };
  };
  const {
    getRootProps,
    getInputProps,
    isDragActive
  } = useDropzone({
    accept: getAcceptedTypes(),
    onDrop,
    maxSize: 50 * 1024 * 1024,
    // 50MB limit
    noClick: false,
    noKeyboard: true
  });

  // Handle browse button click
  const handleBrowseClick = e => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Browse button clicked for document upload");
    if (inputRef.current) {
      inputRef.current.click();
    } else {
      createTemporaryFileInput();
    }
  };

  // Fallback method to create temporary file input
  const createTemporaryFileInput = () => {
    const tempInput = document.createElement('input');
    tempInput.type = 'file';
    tempInput.accept = documentType === "pdf" ? ".pdf" : documentType === "ppt" ? ".ppt,.pptx" : ".pdf,.ppt,.pptx";
    tempInput.style.display = 'none';
    tempInput.onchange = e => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        console.log("Selected document via temporary input:", {
          name: file.name,
          type: file.type,
          size: file.size
        });
        onDrop([file]);
      }
      document.body.removeChild(tempInput);
    };
    document.body.appendChild(tempInput);
    tempInput.click();
  };
  const previewFile = file => {
    setIsLoadingPreview(true);
    setPreviewError(null);
    try {
      // Create object URL for document preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewSource(objectUrl);
      setIsLoadingPreview(false);

      // Clean up the object URL when component unmounts or file changes
      return () => URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Error creating object URL:", error);
      setPreviewError("Failed to preview document");
      setIsLoadingPreview(false);
    }
  };
  useEffect(() => {
    register(name, {
      required: false
    }); // Make document upload optional
  }, [name, register]);
  useEffect(() => {
    if (selectedFile) {
      setValue(name, selectedFile);
      console.log("Selected document set in form:", {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size
      });
    }
  }, [selectedFile, setValue, name]);

  // Handle initial document URL for edit/view mode
  useEffect(() => {
    const initialDocumentUrl = viewData || editData;
    if (initialDocumentUrl && !selectedFile) {
      console.log("Processing initial document URL:", initialDocumentUrl);
      setPreviewSource(initialDocumentUrl);
      setIsLoadingPreview(false);
    }
  }, [viewData, editData, selectedFile]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewSource && previewSource.startsWith('blob:')) {
        URL.revokeObjectURL(previewSource);
      }
    };
  }, [previewSource]);
  const getDocumentTypeLabel = () => {
    if (documentType === "pdf") return "PDF";
    if (documentType === "ppt") return "PowerPoint";
    return "Document";
  };
  const getFileFormats = () => {
    if (documentType === "pdf") return "PDF";
    if (documentType === "ppt") return "PPT, PPTX";
    return "PDF, PPT, PPTX";
  };
  return <div className="flex flex-col space-y-2">
      <label className="text-sm text-richblack-5" htmlFor={name}>
        {label} <span className="text-xs text-richblack-300 ml-2">(at least one content required)</span>
      </label>

      <div className={`${isDragActive ? "border-yellow-50 bg-richblack-600" : "border-richblack-500 bg-richblack-700"} relative flex min-h-[200px] cursor-pointer items-center justify-center rounded-md border-2 border-dashed transition-all duration-200 hover:border-yellow-50`}>
        {isLoadingPreview ? <div className="flex flex-col items-center justify-center p-4">
            <div className="w-8 h-8 border-2 border-yellow-50 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-sm text-richblack-200">Loading preview...</p>
          </div> : previewError ? <div className="flex flex-col items-center justify-center p-4">
            <p className="text-sm text-pink-200 mb-2">⚠️ {previewError}</p>
            <button type="button" onClick={() => {
          setPreviewError(null);
          setPreviewSource("");
          setSelectedFile(null);
          setValue(name, null);
        }} className="text-sm text-yellow-50 underline hover:text-yellow-100">
              Upload new {getDocumentTypeLabel()}
            </button>
          </div> : previewSource ? <div className="flex w-full flex-col p-4 md:p-6">
            {/* Document Preview */}
            <div className="relative w-full">
              {selectedFile && selectedFile.type === "application/pdf" ?
          // PDF Preview using iframe
          <iframe src={previewSource} className="w-full h-96 rounded-md border border-richblack-600" title="PDF Preview" /> : previewSource.includes('.pdf') || selectedFile && selectedFile.type === "application/pdf" ?
          // PDF Preview for existing files
          <div className="w-full h-96 rounded-md border border-richblack-600 bg-richblack-800 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📄</div>
                    <p className="text-richblack-200">PDF Document</p>
                    <p className="text-xs text-richblack-400 mt-2">
                      {selectedFile ? selectedFile.name : "Existing PDF"}
                    </p>
                    {previewSource.startsWith('http') && <a href={previewSource} target="_blank" rel="noopener noreferrer" className="text-yellow-50 underline text-sm mt-2 inline-block">
                        Open in new tab
                      </a>}
                  </div>
                </div> :
          // PowerPoint or other document preview
          <div className="w-full h-96 rounded-md border border-richblack-600 bg-richblack-800 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-4">
                      {selectedFile?.type?.includes('presentation') || previewSource.includes('.ppt') ? '📊' : '📄'}
                    </div>
                    <p className="text-richblack-200">
                      {selectedFile?.type?.includes('presentation') || previewSource.includes('.ppt') ? 'PowerPoint Presentation' : 'Document'}
                    </p>
                    <p className="text-xs text-richblack-400 mt-2">
                      {selectedFile ? selectedFile.name : "Existing Document"}
                    </p>
                    {previewSource.startsWith('http') && <a href={previewSource} target="_blank" rel="noopener noreferrer" className="text-yellow-50 underline text-sm mt-2 inline-block">
                        Download/View
                      </a>}
                  </div>
                </div>}
              
              {selectedFile && <div className="absolute bottom-2 right-2 rounded bg-richblack-800 px-2 py-1 text-xs text-richblack-50">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </div>}
            </div>

            {!viewData && <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => {
            if (previewSource && previewSource.startsWith('blob:')) {
              URL.revokeObjectURL(previewSource);
            }
            setPreviewSource("");
            setSelectedFile(null);
            setPreviewError(null);
            setValue(name, null);
            resetUploadState();
          }} className="text-sm font-medium text-richblack-400 underline hover:text-yellow-50">
                  {selectedFile ? 'Remove' : 'Replace'} {getDocumentTypeLabel()}
                </button>
              </div>}
          </div> : <div className="flex w-full flex-col items-center p-4 md:p-6" {...getRootProps()}>
            <input {...getInputProps()} />
            <div className="grid aspect-square w-14 place-items-center rounded-full bg-richblack-800 transition-all duration-200 hover:bg-richblack-700">
              <FiUploadCloud className="text-2xl text-yellow-50" />
            </div>
            <p className="mt-2 max-w-[200px] text-center text-sm text-richblack-200">
              Drag and drop a {getDocumentTypeLabel()}, or{" "}
              <span className="font-semibold text-yellow-50 cursor-pointer hover:text-yellow-100 transition-colors" onClick={handleBrowseClick} role="button" tabIndex={0} onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleBrowseClick(e);
            }
          }}>
                browse
              </span>
            </p>
            <ul className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-richblack-200">
              <li className="flex items-center gap-1">
                <span>•</span> Formats: {getFileFormats()}
              </li>
              <li className="flex items-center gap-1">
                <span>•</span> Max size: 50MB
              </li>
              <li className="flex items-center gap-1">
                <span>•</span> Optional attachment
              </li>
            </ul>
          </div>}
      </div>

      {/* File Selection Status */}
      {selectedFile && <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-400 flex items-center gap-2">
            <span>📁</span>
            {getDocumentTypeLabel()} selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
          </p>
          <p className="text-xs text-blue-300 mt-1">
            Document will be uploaded when you save the lecture
          </p>
        </div>}

      {errors[name] && <span className="flex items-center text-xs text-pink-200">
          <span className="mr-1">⚠️</span>
          {label} is required
        </span>}
    </div>;
}
DocumentUpload.propTypes = {
  "name": PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  "label": PropTypes.node,
  "register": PropTypes.func,
  "setValue": PropTypes.func,
  "errors": PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  "viewData": PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  "editData": PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  "documentType": PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};
