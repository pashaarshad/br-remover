"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type AppState = "idle" | "processing" | "done" | "error";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const processImage = useCallback(async (file: File) => {
    setAppState("processing");
    setProgress(0);
    setErrorMessage("");

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setFileName(file.name);
    setFileSize(formatFileSize(file.size));

    try {
      // Simulate initial loading progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return prev + Math.random() * 8 + 2;
        });
      }, 300);

      // Dynamically import the library (it's heavy, only load when needed)
      const { removeBackground } = await import("@imgly/background-removal");

      const blob = await removeBackground(file, {
        publicPath: window.location.origin + "/imgly/",
        progress: (key: string, current: number, total: number) => {
          if (total > 0) {
            const pct = Math.min((current / total) * 100, 99);
            setProgress(pct);
          }
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
      setAppState("done");
      setSliderPos(50);
      showToast("Background removed successfully!", "success");
    } catch (err) {
      console.error("Background removal error:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while processing your image."
      );
      setAppState("error");
      showToast("Failed to process image", "error");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showToast("Please upload a valid image file", "error");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        showToast("File size must be under 20MB", "error");
        return;
      }
      processImage(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showToast("Please drop a valid image file", "error");
        return;
      }
      processImage(file);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const a = document.createElement("a");
    a.href = processedImage;
    const baseName = fileName.replace(/\.[^/.]+$/, "");
    a.download = `${baseName}-no-bg.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("Image downloaded!", "success");
  };

  const handleReset = () => {
    setAppState("idle");
    setOriginalImage(null);
    setProcessedImage(null);
    setFileName("");
    setFileSize("");
    setErrorMessage("");
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ===== Comparison slider logic ===== */
  const handleSliderMove = useCallback(
    (clientX: number) => {
      if (!comparisonRef.current) return;
      const rect = comparisonRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPos(pct);
    },
    []
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => handleSliderMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => handleSliderMove(e.touches[0].clientX);
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [isDragging, handleSliderMove]);

  return (
    <>
      {/* Background Effects */}
      <div className="bg-mesh" />
      <div className="noise-overlay" />

      <div className="app-container">
        {/* Header */}
        <header className="app-header">
          <div className="app-logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </div>
            <span className="logo-text">BG Remover</span>
          </div>
          <h1 className="app-title">Remove Backgrounds Instantly</h1>
          <p className="app-subtitle">
            Upload any image and watch AI <span className="highlight">erase the background</span> in seconds.
            100% free, runs entirely in your browser — no uploads to servers.
          </p>
        </header>

        <main className="main-content">
          {/* ===== IDLE STATE: Upload Zone ===== */}
          {appState === "idle" && (
            <div
              className={`glass-card upload-zone ${dragOver ? "drag-over" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              id="upload-zone"
            >
              <div className="upload-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <h2 className="upload-title">Drop your image here</h2>
              <p className="upload-desc">or click to browse your files</p>
              <button className="upload-btn" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Choose Image
              </button>
              <p className="upload-formats">Supports PNG, JPG, JPEG, WebP — up to 20MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileSelect}
                style={{ display: "none" }}
                id="file-input"
              />
            </div>
          )}

          {/* ===== PROCESSING STATE ===== */}
          {appState === "processing" && (
            <div className="glass-card">
              {fileName && (
                <div className="file-info">
                  <div className="file-info-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <div className="file-info-details">
                    <div className="file-info-name">{fileName}</div>
                    <div className="file-info-meta">{fileSize}</div>
                  </div>
                </div>
              )}
              <div className="processing-overlay">
                <div className="spinner">
                  <div className="spinner-ring" />
                  <div className="spinner-ring" />
                  <div className="spinner-ring" />
                  <div className="spinner-core" />
                </div>
                <p className="processing-text">Removing Background...</p>
                <p className="processing-sub">
                  AI is analyzing your image and separating the subject from the background. This may take a moment.
                </p>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  {Math.round(progress)}%
                </p>
              </div>
            </div>
          )}

          {/* ===== DONE STATE ===== */}
          {appState === "done" && originalImage && processedImage && (
            <>
              {/* File Info */}
              <div className="glass-card">
                <div className="file-info">
                  <div className="file-info-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <div className="file-info-details">
                    <div className="file-info-name">{fileName}</div>
                    <div className="file-info-meta">{fileSize} • Background removed</div>
                  </div>
                </div>
              </div>

              {/* Side by side panels */}
              <div className="results-section">
                {/* Original */}
                <div className="glass-card image-panel">
                  <div className="panel-header">
                    <div className="panel-label">
                      <span className="dot" />
                      Original
                    </div>
                  </div>
                  <div className="panel-image-container">
                    <img src={originalImage} alt="Original uploaded image" />
                  </div>
                </div>

                {/* Processed */}
                <div className="glass-card image-panel">
                  <div className="panel-header">
                    <div className="panel-label">
                      <span className="dot green" />
                      Background Removed
                    </div>
                  </div>
                  <div className="panel-image-container checkered-bg">
                    <img src={processedImage} alt="Image with background removed" />
                  </div>
                </div>
              </div>

              {/* Comparison Slider */}
              <div className="glass-card comparison-container">
                <div className="panel-header">
                  <div className="panel-label">
                    <span className="dot" />
                    Compare — Drag to Slide
                  </div>
                </div>
                <div
                  className="comparison-wrapper"
                  ref={comparisonRef}
                  onMouseDown={(e) => {
                    setIsDragging(true);
                    handleSliderMove(e.clientX);
                  }}
                  onTouchStart={(e) => {
                    setIsDragging(true);
                    handleSliderMove(e.touches[0].clientX);
                  }}
                  style={{ padding: "1.5rem" }}
                >
                  <div className="comparison-original" style={{ position: "relative" }}>
                    <img src={originalImage} alt="Original" style={{ width: "100%", borderRadius: "12px" }} />
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: `${sliderPos}%`,
                        height: "100%",
                        overflow: "hidden",
                        borderRadius: "12px",
                      }}
                    >
                      <img
                        src={processedImage}
                        alt="Processed"
                        style={{
                          width: comparisonRef.current ? `${comparisonRef.current.offsetWidth - 48}px` : "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "12px",
                        }}
                      />
                    </div>
                    {/* Slider line */}
                    <div
                      className="comparison-slider-line"
                      style={{ left: `${sliderPos}%` }}
                    />
                    {/* Slider handle */}
                    <div
                      className="comparison-slider-handle"
                      style={{ left: `${sliderPos}%`, top: "50%", position: "absolute" }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                        <polyline points="9 18 15 12 9 6" transform="translate(6, 0)" />
                      </svg>
                    </div>
                    <span className="comparison-label right">Original</span>
                    <span className="comparison-label left">No BG</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="glass-card actions-bar">
                <button className="btn btn-primary" onClick={handleDownload} id="download-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download PNG
                </button>
                <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} id="new-image-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  New Image
                </button>
                <button className="btn btn-danger" onClick={handleReset} id="reset-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Clear
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
              </div>
            </>
          )}

          {/* ===== ERROR STATE ===== */}
          {appState === "error" && (
            <div className="glass-card error-state">
              <div className="error-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <h3 className="error-title">Processing Failed</h3>
              <p className="error-message">{errorMessage}</p>
              <button className="btn btn-primary" onClick={handleReset} id="try-again-btn" style={{ marginTop: "0.5rem" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Try Again
              </button>
            </div>
          )}
        </main>

        {/* Features Section */}
        <div className="features-grid">
          <div className="glass-card feature-card">
            <div className="feature-icon purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3 className="feature-title">AI-Powered</h3>
            <p className="feature-desc">
              State-of-the-art machine learning model runs directly in your browser for precise background detection and removal.
            </p>
          </div>
          <div className="glass-card feature-card">
            <div className="feature-icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="feature-title">100% Private</h3>
            <p className="feature-desc">
              Your images never leave your device. All processing happens locally in your browser — zero server uploads.
            </p>
          </div>
          <div className="glass-card feature-card">
            <div className="feature-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3 className="feature-title">Instant Results</h3>
            <p className="feature-desc">
              Get clean, transparent PNG results in seconds. Download immediately and use in your designs.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="app-footer">
          <p>Built with ❤️ using Next.js &amp; @imgly/background-removal</p>
        </footer>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`toast show ${toast.type}`}>
          {toast.type === "success" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" style={{ color: "var(--success)" }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" style={{ color: "var(--error)" }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          {toast.message}
        </div>
      )}
    </>
  );
}
