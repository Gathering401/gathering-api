import { Router } from 'express';
import { isAuthenticated } from '../common/middleware';
import { getAutocomplete, getDetails } from './controller';

const router = Router();

router.get('/autocomplete', isAuthenticated, getAutocomplete);
router.get('/details', isAuthenticated, getDetails);

export default router;
