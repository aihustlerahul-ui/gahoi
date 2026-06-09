import { Router, Response } from 'express';
import { authGuard, type AuthRequest } from '../../middleware/auth-guard';
import { getUploadUrl, getGalleryWithSignedUrls, deleteGalleryImage, confirmUpload } from './gallery.service';

export const galleryRouter = Router();

galleryRouter.use(authGuard);

// POST /v1/profile/me/gallery/upload-url
galleryRouter.post('/upload-url', async (req: AuthRequest, res: Response) => {
  try {
    const result = await getUploadUrl(req.userId!);
    res.status(201).json({ success: true, data: result, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate upload URL';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});

// POST /v1/profile/me/gallery/:id/confirm
galleryRouter.post('/:id/confirm', async (req: AuthRequest, res: Response) => {
  try {
    await confirmUpload(req.params.id, req.userId!);
    res.json({ success: true, data: { message: 'Upload confirmed, pending admin review' }, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to confirm upload', meta: {} });
  }
});

// GET /v1/profile/me/gallery
galleryRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const gallery = await getGalleryWithSignedUrls(req.userId!);
    res.json({ success: true, data: gallery, error: null, meta: {} });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch gallery', meta: {} });
  }
});

// DELETE /v1/profile/me/gallery/:id
galleryRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await deleteGalleryImage(req.userId!, req.params.id);
    res.json({ success: true, data: { message: 'Image deleted' }, error: null, meta: {} });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete image';
    res.status(400).json({ success: false, data: null, error: msg, meta: {} });
  }
});
