import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../common/helpers';
import { AiService } from './ai.service';
import { BadRequestError } from '../../common/errors';

const aiService = new AiService();

export class AiController {
  
  async forecast(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.body;
      if (!productId) throw new BadRequestError('productId is required');

      const result = await aiService.forecast(req.user!.shopId, productId);
      sendSuccess(res, result, 'Demand forecast retrieved successfully');
    } catch (error) { next(error); }
  }

  async creditRisk(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId } = req.body;
      if (!customerId) throw new BadRequestError('customerId is required');

      const result = await aiService.creditRisk(req.user!.shopId, customerId);
      sendSuccess(res, result, 'Credit risk analysis completed');
    } catch (error) { next(error); }
  }

  async anomaly(req: Request, res: Response, next: NextFunction) {
    try {
      const { logs } = req.body;
      if (!logs || !Array.isArray(logs)) throw new BadRequestError('logs array is required');

      const result = await aiService.detectAnomaly(req.user!.shopId, logs);
      sendSuccess(res, result, 'Anomaly detection completed');
    } catch (error) { next(error); }
  }

  async shelfScan(req: Request, res: Response, next: NextFunction) {
    try {
      const { imageUrl } = req.body;
      if (!imageUrl) throw new BadRequestError('imageUrl is required');

      const result = await aiService.shelfScan(req.user!.shopId, imageUrl);
      sendSuccess(res, result, 'Shelf scan analysis completed');
    } catch (error) { next(error); }
  }

  async getPredictions(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, limit } = req.query;
      const result = await aiService.getPredictions(
        req.user!.shopId, 
        type as string, 
        limit ? parseInt(limit as string) : 50
      );
      sendSuccess(res, result, 'Historical predictions retrieved successfully');
    } catch (error) { next(error); }
  }

}
