import { Router, Request, Response } from 'express';
import {
  getOfficerSettings,
  updateOfficerProfile,
  updateOfficerNotifications,
  updateOfficerAiPreferences,
  updateOfficerSettings,
  resetOfficerSettings,
  syncOfficerUser,
} from '../services/govOfficerService.js';

const router = Router();

/**
 * Extract authenticated user ID from headers, query parameters, or request body
 */
const getUserId = (req: Request): string | undefined => {
  return (
    (req.headers['x-user-id'] as string) ||
    (req.query.userId as string) ||
    (req.body && typeof req.body === 'object' && req.body.userId ? String(req.body.userId) : undefined) ||
    undefined
  );
};

/**
 * @route   POST /api/officer/sync
 * @desc    Synchronize or provision Government Officer account from signup/login
 * @access  Public / Government Officer
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { userId, name, phone, location, district } = req.body;
    if (!userId || !name) {
      res.status(400).json({
        status: 'error',
        message: 'userId and name are required to synchronize Government Officer.',
      });
      return;
    }
    const settings = await syncOfficerUser({ userId, name, phone, location, district });
    res.status(200).json({
      status: 'success',
      message: 'Officer profile synced successfully in PostgreSQL.',
      data: settings,
    });
  } catch (error: any) {
    console.error('[Gov Officer API Error - sync]:', error);
    res.status(500).json({
      status: 'error',
      message: error?.message || 'Failed to sync Government Officer record.',
    });
  }
});

/**
 * @route   GET /api/officer/settings or /api/gov/settings
 * @desc    Fetch all Government Officer settings sections and real-time metadata
 * @access  Public / Government Officer
 */
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const settings = await getOfficerSettings(userId);
    res.status(200).json({
      status: 'success',
      data: settings,
    });
  } catch (error: any) {
    console.error('[Gov Officer API Error - getSettings]:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve Government Officer settings.',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
    });
  }
});

/**
 * @route   PATCH /api/officer/settings or PUT /api/officer/settings
 * @desc    Update whole or multiple sections of Government Officer settings
 * @access  Public / Government Officer
 */
const handleUpdateSettings = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const updated = await updateOfficerSettings(req.body, userId);
    res.status(200).json({
      status: 'success',
      message: 'Officer settings updated successfully.',
      data: updated,
    });
  } catch (error: any) {
    console.error('[Gov Officer API Error - updateSettings]:', error);
    res.status(400).json({
      status: 'error',
      message: error?.message || 'Failed to update Government Officer settings.',
    });
  }
};
router.patch('/settings', handleUpdateSettings);
router.put('/settings', handleUpdateSettings);

/**
 * @route   GET /api/officer/profile or /api/gov/profile
 * @desc    Fetch Officer profile & account info
 * @access  Public / Government Officer
 */
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const settings = await getOfficerSettings(userId);
    res.status(200).json({
      status: 'success',
      data: settings.profile,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve officer profile.',
    });
  }
});

/**
 * @route   PATCH /api/officer/profile or PUT /api/officer/profile
 * @desc    Update officer profile details (e.g., from Edit Profile Modal)
 * @access  Public / Government Officer
 */
const handleUpdateProfile = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const profile = await updateOfficerProfile(req.body, userId);
    res.status(200).json({
      status: 'success',
      message: 'Profile contact details updated successfully.',
      data: profile,
    });
  } catch (error: any) {
    res.status(400).json({
      status: 'error',
      message: error?.message || 'Failed to update officer profile.',
    });
  }
};
router.patch('/profile', handleUpdateProfile);
router.put('/profile', handleUpdateProfile);

/**
 * @route   GET /api/officer/notifications
 * @desc    Fetch notification preferences
 */
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const settings = await getOfficerSettings(userId);
    res.status(200).json({
      status: 'success',
      data: settings.notifications,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve notification preferences.',
    });
  }
});

/**
 * @route   PATCH /api/officer/notifications or PUT /api/officer/notifications
 * @desc    Update notification preferences (toggles)
 */
const handleUpdateNotifications = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const notifications = await updateOfficerNotifications(req.body, userId);
    res.status(200).json({
      status: 'success',
      message: 'Notification preferences updated successfully.',
      data: notifications,
    });
  } catch (error: any) {
    res.status(400).json({
      status: 'error',
      message: error?.message || 'Failed to update notification preferences.',
    });
  }
};
router.patch('/notifications', handleUpdateNotifications);
router.put('/notifications', handleUpdateNotifications);

/**
 * @route   GET /api/officer/ai-preferences
 * @desc    Fetch AI recommendation & transparency preferences
 */
router.get('/ai-preferences', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const settings = await getOfficerSettings(userId);
    res.status(200).json({
      status: 'success',
      data: settings.aiPreferences,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve AI preferences.',
    });
  }
});

/**
 * @route   PATCH /api/officer/ai-preferences or PUT /api/officer/ai-preferences
 * @desc    Update AI recommendation & transparency preferences
 */
const handleUpdateAiPreferences = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const aiPreferences = await updateOfficerAiPreferences(req.body, userId);
    res.status(200).json({
      status: 'success',
      message: 'AI preferences updated successfully.',
      data: aiPreferences,
    });
  } catch (error: any) {
    res.status(400).json({
      status: 'error',
      message: error?.message || 'Failed to update AI preferences.',
    });
  }
};
router.patch('/ai-preferences', handleUpdateAiPreferences);
router.put('/ai-preferences', handleUpdateAiPreferences);

/**
 * @route   GET /api/officer/jurisdiction
 * @desc    Fetch assigned administrative area and jurisdiction info
 */
router.get('/jurisdiction', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const settings = await getOfficerSettings(userId);
    res.status(200).json({
      status: 'success',
      data: settings.jurisdiction,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve jurisdiction information.',
    });
  }
});

/**
 * @route   GET /api/officer/security
 * @desc    Fetch security and data clearance status
 */
router.get('/security', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const settings = await getOfficerSettings(userId);
    res.status(200).json({
      status: 'success',
      data: settings.security,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve security settings.',
    });
  }
});

/**
 * @route   POST /api/officer/settings/reset or /api/officer/reset
 * @desc    Reset all settings to official defaults
 */
const handleResetSettings = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const settings = await resetOfficerSettings(userId);
    res.status(200).json({
      status: 'success',
      message: 'Government Officer settings have been reset to defaults.',
      data: settings,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset settings.',
    });
  }
};
router.post('/settings/reset', handleResetSettings);
router.post('/reset', handleResetSettings);

export default router;
