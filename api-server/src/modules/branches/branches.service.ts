import { NotFoundError, BadRequestError } from '../../common/errors';
import { BranchesRepository } from './branches.repository';

export class BranchesService {
  constructor(private repo: BranchesRepository) {}

  async create(shopId: string, data: any) {
    return this.repo.create(shopId, data);
  }

  async getById(id: string, shopId: string) {
    const branch = await this.repo.findById(id, shopId);
    if (!branch) throw new NotFoundError('Branch');
    return branch;
  }

  async list(shopId: string) {
    return this.repo.findAll(shopId);
  }

  async update(id: string, shopId: string, data: any) {
    await this.getById(id, shopId);
    await this.repo.update(id, shopId, data);
    return this.repo.findById(id, shopId);
  }

  async delete(id: string, shopId: string) {
    const branch = await this.getById(id, shopId);
    if (branch.isMain) {
      throw new BadRequestError('Cannot delete the main branch');
    }
    await this.repo.delete(id, shopId);
    return { message: 'Branch deleted' };
  }
}
