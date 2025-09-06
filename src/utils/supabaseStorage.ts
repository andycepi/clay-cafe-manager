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
        
        // Provide more helpful error messages based on common issues
        let errorMessage = uploadError.message;
        if (uploadError.message.includes('bucket') || uploadError.message.includes('not found')) {
          errorMessage = `Storage bucket '${BUCKET_NAME}' not found. Please create it in your Supabase project.`;
        } else if (uploadError.message.includes('policy') || uploadError.message.includes('RLS')) {
          errorMessage = `Storage permissions error. Please check your RLS policies for the '${BUCKET_NAME}' bucket.`;
        }
        
        return { url: null, path: null, error: errorMessage };
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
      // First, try to check if we can access the bucket by attempting a simple operation
      // This is safer than trying to list all buckets which may require admin permissions
      const { data, error: testError } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', { limit: 1 });

      if (!testError) {
        // Bucket exists and is accessible
        console.log(`Bucket ${BUCKET_NAME} is accessible`);
        return;
      }

      // If we can't access the bucket, check if it exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.warn('Cannot list buckets (may require admin permissions):', listError.message);
        // If we can't list buckets, assume the bucket should be created manually
        // and provide helpful error message
        console.warn(`Please ensure the '${BUCKET_NAME}' bucket exists in your Supabase project storage.`);
        return;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
      
      if (!bucketExists) {
        // Attempt to create bucket - this may fail due to RLS policies
        const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        });

        if (createError) {
          console.warn('Cannot create bucket automatically (may require admin permissions):', createError.message);
          console.warn(`Please manually create a bucket named '${BUCKET_NAME}' in your Supabase project storage with the following settings:`);
          console.warn('- Public: Yes');
          console.warn('- Allowed MIME types: image/jpeg, image/png, image/webp');
          console.warn('- File size limit: 5MB');
        } else {
          console.log(`Successfully created bucket: ${BUCKET_NAME}`);
        }
      } else {
        console.log(`Bucket ${BUCKET_NAME} already exists`);
      }
    } catch (error) {
      console.warn('Error managing bucket (this is usually fine if the bucket already exists):', error);
      console.warn(`If image uploads fail, please ensure the '${BUCKET_NAME}' bucket exists in your Supabase project.`);
    }
  }
};

// Initialize bucket on load
supabaseStorage.createBucketIfNotExists();