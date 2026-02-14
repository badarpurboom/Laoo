import React, { useRef, useState } from 'react';
import { restaurantService } from '../../services/api';

interface ImageUploaderProps {
    currentImage?: string;
    onImageUploaded: (url: string) => void;
    label?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ currentImage, onImageUploaded, label = "Upload Image" }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | undefined>(currentImage);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview locally
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const uploadedUrl = await restaurantService.uploadImage(formData);
            onImageUploaded(uploadedUrl);
            setPreview(uploadedUrl);
        } catch (err) {
            console.error("Upload failed", err);
            alert("Image upload failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>
            <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-indigo-300 transition-all group overflow-hidden"
            >
                {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <>
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 group-hover:text-indigo-500 shadow-sm mb-2">
                            <i className="fas fa-cloud-upload-alt text-lg"></i>
                        </div>
                        <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-500">Click to Upload</span>
                        <span className="text-[10px] text-slate-300 mt-1">JPG, PNG, WEBP (Max 5MB)</span>
                    </>
                )}

                {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <i className="fas fa-spinner fa-spin text-white text-2xl"></i>
                    </div>
                )}

                {preview && !isUploading && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white font-bold text-xs"><i className="fas fa-pen"></i> Change Image</span>
                    </div>
                )}
            </div>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
            />
        </div>
    );
};

export default ImageUploader;
