import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../common/helpers';
import { BranchesService } from './branches.service';
import { BranchesRepository } from './branches.repository';

const service = new BranchesService(new BranchesRepository());

export class BranchesController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const branch = await service.create(req.user!.shopId, req.body);
      sendSuccess(res, branch, 'Branch created', 201);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const branch = await service.getById(req.params.id, req.user!.shopId);
      sendSuccess(res, branch, 'Branch details');
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const branches = await service.list(req.user!.shopId);
      sendSuccess(res, branches, 'Branches list');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const branch = await service.update(req.params.id, req.user!.shopId, req.body);
      sendSuccess(res, branch, 'Branch updated');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.delete(req.params.id, req.user!.shopId);
      sendSuccess(res, result, 'Branch deleted');
    } catch (error) {
      next(error);
    }
  }
}
