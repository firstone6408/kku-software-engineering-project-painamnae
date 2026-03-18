import { Router } from 'express';
import * as emergencyContactController from '../controllers/emergencyContact.controller';
import { protect } from '../middlewares/auth';

const router = Router();

router.post('/', protect, emergencyContactController.createContact);
router.get('/me', protect, emergencyContactController.getMyContacts);
router.get('/:id', protect, emergencyContactController.getContactById);
router.put('/:id', protect, emergencyContactController.updateContact);
router.delete('/:id', protect, emergencyContactController.deleteContact);

export default router;
