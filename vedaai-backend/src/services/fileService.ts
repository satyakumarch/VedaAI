// ============================================================
// VedaAI Backend - File Upload & Text Extraction Service
// ============================================================
import pdfParse from 'pdf-parse';
import { logger } from '../utils/logger';

const MAX_CONTENT_LENGTH = 8000; // chars to store

export const extractTextFromFile = async (
  buffer: Buffer,
  mimeType: string
): Promise<string> => {
  try {
    if (mimeType === 'application/pdf') {
      const data = await pdfParse(buffer);
      const text = data.text.trim();
      logger.info(`Extracted ${text.length} chars from PDF`);
      return text.slice(0, MAX_CONTENT_LENGTH);
    }

    if (mimeType === 'text/plain') {
      const text = buffer.toString('utf-8').trim();
      logger.info(`Extracted ${text.length} chars from TXT`);
      return text.slice(0, MAX_CONTENT_LENGTH);
    }

    throw new Error(`Unsupported file type: ${mimeType}`);
  } catch (error) {
    logger.error('File extraction error:', error);
    throw new Error('Failed to extract text from uploaded file');
  }
};
