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
        video: { 
          facingMode: 'environment', // Prefer back camera on mobile
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      setStream(mediaStream);
      setIsCapturing(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Ensure video loads and plays
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error('Error playing video:', e));
        };
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

    if (!context || !video.videoWidth || !video.videoHeight) {
      console.error('Video not ready for capture');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Flip the image back to normal orientation (since we mirrored the video)
    context.scale(-1, 1);
    context.drawImage(video, -video.videoWidth, 0);
    context.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

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
        <div className="relative group">
          <img 
            src={currentImageUrl} 
            alt="Piece" 
            className="w-full h-48 object-cover rounded-2xl border-2 border-gray-200/50 shadow-lg group-hover:shadow-xl transition-all duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
          <Button
            variant="danger"
            size="sm"
            onClick={removeImage}
            className="absolute top-3 right-3 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-lg"
          >
            <X size={16} />
          </Button>
        </div>
      )}

      {isCapturing && (
        <div className="relative group">
          <video
            ref={videoRef}
            className="w-full h-48 object-cover rounded-2xl border-2 border-gray-200/50 bg-gradient-to-br from-gray-900 to-black shadow-lg"
            autoPlay
            playsInline
            muted
            style={{ transform: 'scaleX(-1)' }} // Mirror the video for better UX
          />
          <div className="flex justify-center space-x-3 mt-4">
            <Button
              variant="primary"
              onClick={capturePhoto}
              className="flex items-center space-x-1"
              disabled={!videoRef.current?.videoWidth}
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
        <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300/60 rounded-2xl bg-gradient-to-br from-gray-50/80 to-white backdrop-blur-sm hover:border-gray-400/60 transition-all duration-300">
          {isUploading ? (
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <Loader2 className="animate-spin text-blue-500" size={36} />
                <div className="absolute inset-0 animate-pulse bg-blue-100/50 rounded-full blur-xl" />
              </div>
              <span className="text-sm font-medium text-gray-700">Uploading image...</span>
            </div>
          ) : (
            <>
              <div className="flex space-x-3 mb-6">
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
              <div className="flex items-center space-x-3 text-gray-600">
                <div className="p-2 bg-gray-100/80 rounded-xl">
                  <ImageIcon size={24} className="text-gray-500" />
                </div>
                <span className="text-sm font-medium">Add a photo of your piece</span>
              </div>
              {!pieceId && (
                <div className="flex items-center space-x-2 mt-3 p-2 bg-amber-50/80 rounded-xl border border-amber-200/50">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  <span className="text-xs text-amber-700 font-medium">
                  Save piece first to upload to cloud storage
                  </span>
                </div>
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