
import { fileService } from './file.service.js';

// Legacy compatibility export: imports that still reference fileServices
// now use the MongoDB-oriented global file service.
const fileServices = fileService;

export default fileServices;