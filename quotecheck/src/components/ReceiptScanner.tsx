"use client";

import { useState, useRef, useCallback } from "react";
import { createWorker } from "tesseract.js";
import { Camera, Upload, Loader2, X, RotateCcw, Sparkles } from "lucide-react";

interface ReceiptScannerProps {
  onTextExtracted: (text: string) => void;
}

export default function ReceiptScanner({ onTextExtracted }: ReceiptScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(
    async (file: File) => {
      setError("");
      setScanning(true);
      setProgress(0);

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      try {
        const worker = await createWorker("eng", 1, {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setProgress(Math.round(m.progress * 100));
            }
          },
        });

        const {
          data: { text },
        } = await worker.recognize(file);

        await worker.terminate();

        if (text.trim().length < 10) {
          setError(
            "Could not read enough text from this image. Try a clearer photo or paste the text manually."
          );
          setScanning(false);
          return;
        }

        onTextExtracted(text.trim());
        setScanning(false);
      } catch {
        setError("Failed to scan the image. Please try again or paste the text manually.");
        setScanning(false);
      }
    },
    [onTextExtracted]
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Image is too large. Please use an image under 10MB.");
        return;
      }
      processImage(file);
    }
  }

  function reset() {
    setPreview(null);
    setScanning(false);
    setProgress(0);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  return (
    <div className="space-y-4">
      {!preview ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-primary/40 transition">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                Scan a Receipt or Quote
              </h3>
              <p className="text-sm text-muted max-w-xs mx-auto">
                Take a photo or upload an image of your quote, receipt, or estimate.
                Our AI will extract the text automatically.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition"
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 border border-gray-200 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-primary hover:text-primary transition"
              >
                <Upload className="w-4 h-4" />
                Upload Image
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <img
            src={preview}
            alt="Scanned receipt"
            className="w-full max-h-64 object-contain bg-gray-50"
          />

          {scanning && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white rounded-xl p-6 text-center max-w-xs">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                <p className="font-semibold text-foreground mb-1">
                  Scanning Receipt...
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted">
                  {progress < 30
                    ? "Loading OCR engine..."
                    : progress < 80
                    ? "Reading text from image..."
                    : "Almost done..."}
                </p>
              </div>
            </div>
          )}

          {!scanning && (
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                type="button"
                onClick={reset}
                className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition"
                title="Remove image"
              >
                <X className="w-4 h-4 text-muted" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition"
                title="Scan different image"
              >
                <RotateCcw className="w-4 h-4 text-muted" />
              </button>
            </div>
          )}
        </div>
      )}

      {!scanning && preview && !error && (
        <div className="flex items-center gap-2 text-sm text-accent">
          <Sparkles className="w-4 h-4" />
          Text extracted successfully! Review it below and click &quot;Check This Quote&quot;.
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-500 bg-red-50 p-3 rounded-lg">
          <X className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p>{error}</p>
            <button
              type="button"
              onClick={reset}
              className="text-primary font-medium hover:underline mt-1"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
