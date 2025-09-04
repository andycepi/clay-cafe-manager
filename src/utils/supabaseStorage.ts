import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UploadResult {
  url: string;
  path: string;
  error: null;
}

export interface UploadError {
  url: null;
  path: null;
  error: string;
}

export type UploadResponse = UploadResult | UploadError;

const BUCKET_NAME = 'piece-images';

export const supabaseStorage = {
  async uploadImage(file: File, pieceId: string): Promise<UploadResponse> {
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${pieceId}-${Date.now()}.${fileExt}`;
      const filePath = `pieces/${fileName}`;

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { url: null, path: null, error: uploadError.message };
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        path: filePath,
        error: null
      };
    } catch (error) {
      console.error('Storage upload error:', error);
      return { 
        url: null, 
        path: null, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  },

  async uploadImageFromDataUrl(dataUrl: string, pieceId: string): Promise<UploadResponse> {
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Create a file from the blob
      const file = new File([blob], `piece-${pieceId}.jpg`, { type: 'image/jpeg' });
      
      return await this.uploadImage(file, pieceId);
    } catch (error) {
      console.error('Data URL conversion error:', error);
      return { 
        url: null, 
        path: null, 
        error: error instanceof Error ? error.message : 'Failed to convert image' 
      };
    }
  },

  async deleteImage(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Storage delete error:', error);
      return false;
    }
  },

  async createBucketIfNotExists(): Promise<void> {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        return;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
      
      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        });

        if (createError) {
          console.error('Error creating bucket:', createError);
        } else {
          console.log(`Created bucket: ${BUCKET_NAME}`);
        }
      }
    } catch (error) {
      console.error('Error managing bucket:', error);
    }
  }
};

// Initialize bucket on load
supabaseStorage.createBucketIfNotExists();