import { NotFoundError, ConflictError } from '../../common/errors';
import { CustomersRepository } from './customers.repository';

export class CustomersService {
  constructor(private repo: CustomersRepository) {}

  async create(shopId: string, data: any) {
    const existing = await this.repo.findByPhone(data.phone, shopId);
    if (existing) throw new ConflictError('Customer with this phone already exists');
    return this.repo.create(shopId, data);
  }

  async getById(id: string, shopId: string) {
    const customer = await this.repo.findById(id, shopId);
    if (!customer) throw new NotFoundError('Customer');
    return customer;
  }

  async searchByPhone(phone: string, shopId: string) {
    return this.repo.findByPhone(phone, shopId);
  }

  async search(shopId: string, params: any) {
    return this.repo.search(shopId, params);
  }

  async update(id: string, shopId: string, data: any) {
    await this.getById(id, shopId);
    await this.repo.update(id, shopId, data);
    return this.repo.findById(id, shopId);
  }

  async getPurchaseHistory(customerId: string, shopId: string, page: number, limit: number) {
    await this.getById(customerId, shopId);
    return this.repo.getPurchaseHistory(customerId, shopId, page, limit);
  }
}
