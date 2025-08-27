
'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, User as UserIcon, Camera } from 'lucide-react';
import { ImageCropDialog } from './ImageCropDialog';

export function AvatarUpload() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // State for the crop dialog
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);

  useEffect(() => {
    setDisplayUrl(session?.user?.image || null);
  }, [session?.user?.image]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type and size
    if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid File', description: 'Please select an image file.', variant: 'destructive' });
        return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: 'File Too Large', description: 'Please select an image smaller than 5MB.', variant: 'destructive' });
        return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setCropImageSrc(reader.result as string);
      setIsCropDialogOpen(true);
    });
    reader.readAsDataURL(file);
    
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCroppedImageSave = async (croppedImageBlob: Blob) => {
    setIsCropDialogOpen(false);
    setIsLoading(true);
    
    // Create a new file from the blob to upload
    const croppedFile = new File([croppedImageBlob], "avatar.jpg", { type: "image/jpeg" });
    const originalImageUrl = displayUrl;
    setDisplayUrl(URL.createObjectURL(croppedFile)); // Optimistic UI update with local blob URL

    try {
      // Step 1: Upload file to get the URL
      const formData = new FormData();
      formData.append('file', croppedFile);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok) {
        throw new Error(uploadResult.message || 'Upload failed');
      }
      
      const newImageUrl = uploadResult.qualification.url;

      // Step 2: Send the new URL to save it to the user's profile
      const saveResponse = await fetch('/api/profile/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: newImageUrl }),
      });

      const saveResult = await saveResponse.json();
      if (!saveResponse.ok) {
          throw new Error(saveResult.error || 'Failed to save profile picture.');
      }
      
      // Step 3: Update session and show success
      toast({ title: 'Success!', description: saveResult.message });
      await update({ image: saveResult.newImageUrl });
      setDisplayUrl(saveResult.newImageUrl);

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setDisplayUrl(originalImageUrl); // Revert on error
    } finally {
      setIsLoading(false);
      setCropImageSrc(null); // Clear the source image
    }
  };


  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const user = session?.user;

  return (
    <>
      <div className="flex flex-col items-center gap-4 mt-6">
        <div className="relative">
          <Avatar className="h-32 w-32 border-4 border-primary/20">
            <AvatarImage src={displayUrl || undefined} alt={user?.name || "User"} key={displayUrl || ''} className="object-cover" />
            <AvatarFallback className="text-4xl">
              {isLoading ? <Loader2 className="animate-spin" /> : (user?.name?.charAt(0).toUpperCase() || <UserIcon size={48}/>)}
            </AvatarFallback>
          </Avatar>
          
          <div className="absolute bottom-1 right-1">
            <input
              type="file"
              name="avatar"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp"
              disabled={isLoading}
            />
            <Button
              type="button"
              size="icon"
              className="rounded-full"
              onClick={handleButtonClick}
              disabled={isLoading}
              aria-label="Upload new profile picture"
            >
              {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Camera size={16} />}
            </Button>
          </div>
        </div>
      </div>
      <ImageCropDialog 
        isOpen={isCropDialogOpen}
        onClose={() => setIsCropDialogOpen(false)}
        imageSrc={cropImageSrc}
        onSave={handleCroppedImageSave}
      />
    </>
  );
}
