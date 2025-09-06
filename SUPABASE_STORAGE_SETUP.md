# Supabase Storage Setup Guide

## Storage Bucket Creation Error Fix

If you're seeing an error like `"new row violates row-level security policy"` when the app tries to create storage buckets, this is because Supabase requires specific permissions and setup for storage operations.

## Manual Bucket Setup (Recommended)

### Step 1: Create the Storage Bucket
1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"Create a new bucket"**
4. Use these settings:
   - **Name**: `piece-images`
   - **Public bucket**: `Yes` (checked)
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`

### Step 2: Set Up Row Level Security (RLS) Policies

After creating the bucket, you need to set up RLS policies for proper access control:

1. Go to **Authentication** > **Policies** in your Supabase dashboard
2. Find the `storage.objects` table
3. Create the following policies:

#### Policy 1: Allow Public Uploads
```sql
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'piece-images');
```

#### Policy 2: Allow Public Downloads
```sql
CREATE POLICY "Allow public downloads" ON storage.objects
FOR SELECT USING (bucket_id = 'piece-images');
```

#### Policy 3: Allow Public Updates
```sql
CREATE POLICY "Allow public updates" ON storage.objects
FOR UPDATE USING (bucket_id = 'piece-images');
```

#### Policy 4: Allow Public Deletes
```sql
CREATE POLICY "Allow public deletes" ON storage.objects
FOR DELETE USING (bucket_id = 'piece-images');
```

### Alternative: More Restrictive Policies (Optional)

If you want more security, you can create policies that require authentication:

```sql
-- Only authenticated users can upload
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'piece-images' AND auth.role() = 'authenticated');

-- Only authenticated users can download
CREATE POLICY "Authenticated users can download" ON storage.objects
FOR SELECT USING (bucket_id = 'piece-images' AND auth.role() = 'authenticated');
```

## Verification

After setting up the bucket and policies:

1. Refresh your Clay Cafe application
2. Try uploading an image for a piece
3. Check the browser console - you should see: `"Bucket piece-images is accessible"`
4. If you still see warnings, verify your bucket name matches exactly: `piece-images`

## Environment Variables

Make sure your `.env` file has the correct Supabase credentials:

```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Troubleshooting

### Error: "Storage bucket 'piece-images' not found"
- **Solution**: Create the bucket manually using the steps above

### Error: "Storage permissions error" 
- **Solution**: Set up the RLS policies as described above

### Error: "new row violates row-level security policy"
- **Solution**: This usually means RLS policies aren't set up correctly. Follow the RLS policy setup steps above

### Still having issues?
- Check the Supabase dashboard logs for more detailed error messages
- Ensure your project has storage enabled
- Verify that your environment variables are correct
- Make sure you're using the correct bucket name: `piece-images`

## Security Notes

- The public policies above allow anyone to upload/download images. This is suitable for a pottery studio app where images aren't sensitive.
- If you need more security, implement authentication and use the authenticated user policies instead.
- Consider implementing file size limits and MIME type restrictions in your policies if needed.

## Code Changes Made

The app now handles storage errors more gracefully:
- ✅ Better error messages for common issues
- ✅ Fallback behavior when bucket creation fails
- ✅ Helpful console warnings with setup instructions
- ✅ No more app crashes due to RLS policy errors