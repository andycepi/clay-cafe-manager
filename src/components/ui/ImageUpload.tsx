import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { supabaseStorage } from '../../utils/supabaseStorage';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageChange: (imageUrl: string | null) => void;
  pieceId?: string; // Required for Supabase uploads
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImageUrl,
  onImageChange,
  pieceId,
  className = ''
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Prefer back camera on mobile
      });
      setStream(mediaStream);
      setIsCapturing(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions or try file upload instead.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !pieceId) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    stopCamera();
    
    // Upload to Supabase Storage
    setIsUploading(true);
    try {
      const result = await supabaseStorage.uploadImageFromDataUrl(dataUrl, pieceId);
      if (result.error) {
        alert(`Upload failed: ${result.error}`);
        onImageChange(dataUrl); // Fallback to data URL
      } else {
        onImageChange(result.url);
      }
    } catch (error) {
      console.error('Upload error:', error);
      onImageChange(dataUrl); // Fallback to data URL
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && pieceId) {
      setIsUploading(true);
      try {
        const result = await supabaseStorage.uploadImage(file, pieceId);
        if (result.error) {
          alert(`Upload failed: ${result.error}`);
          // Fallback to data URL
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            onImageChange(result);
            setIsUploading(false);
          };
          reader.readAsDataURL(file);
        } else {
          onImageChange(result.url);
          setIsUploading(false);
        }
      } catch (error) {
        console.error('Upload error:', error);
        setIsUploading(false);
        // Fallback to data URL
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          onImageChange(result);
        };
        reader.readAsDataURL(file);
      }
    } else if (file && !pieceId) {
      // No piece ID, use data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    onImageChange(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {currentImageUrl && !isCapturing && (
        <div className="relative">
          <img 
            src={currentImageUrl} 
            alt="Piece" 
            className="w-full h-48 object-cover rounded-lg border border-gray-300"
          />
          <Button
            variant="danger"
            size="sm"
            onClick={removeImage}
            className="absolute top-2 right-2 p-1"
          >
            <X size={16} />
          </Button>
        </div>
      )}

      {isCapturing && (
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full h-48 object-cover rounded-lg border border-gray-300"
            autoPlay
            playsInline
          />
          <div className="flex justify-center space-x-2 mt-2">
            <Button
              variant="primary"
              onClick={capturePhoto}
              className="flex items-center space-x-1"
            >
              <Camera size={16} />
              <span>Capture</span>
            </Button>
            <Button
              variant="outline"
              onClick={stopCamera}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {!currentImageUrl && !isCapturing && (
        <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-lg">
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="animate-spin" size={32} />
              <span className="text-sm text-gray-600">Uploading image...</span>
            </div>
          ) : (
            <>
              <div className="flex space-x-2 mb-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={startCamera}
                  className="flex items-center space-x-1"
                  disabled={!pieceId}
                >
                  <Camera size={16} />
                  <span>Camera</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-1"
                >
                  <Upload size={16} />
                  <span>Upload</span>
                </Button>
              </div>
              <div className="flex items-center space-x-2 text-gray-500">
                <ImageIcon size={20} />
                <span className="text-sm">Add a photo of your piece</span>
              </div>
              {!pieceId && (
                <span className="text-xs text-amber-600 mt-2">
                  Save piece first to upload to cloud storage
                </span>
              )}
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};