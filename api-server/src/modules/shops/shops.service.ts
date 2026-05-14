import { NotFoundError } from '../../common/errors';
import { ShopsRepository } from './shops.repository';

export class ShopsService {
  constructor(private repo: ShopsRepository) {}

  async getShop(shopId: string) {
    const shop = await this.repo.findById(shopId);
    if (!shop) throw new NotFoundError('Shop');
    return shop;
  }

  async updateShop(shopId: string, data: any) {
    await this.getShop(shopId); // Verify exists
    return this.repo.update(shopId, data);
  }

  async listShops(page: number, limit: number) {
    return this.repo.findAll(page, limit);
  }
}
