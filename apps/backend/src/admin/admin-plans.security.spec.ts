import { AdminController } from './admin.controller';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/roles.enum';

describe('AdminController - Plans endpoints security', () => {
  it('GET /admin/plans endpoint should require super_admin role', () => {
    const metadata = Reflect.getMetadata(
      ROLES_KEY,
      AdminController.prototype.getPlans,
    );
    expect(metadata).toBeDefined();
    expect(metadata).toContain(UserRole.SUPER_ADMIN);
  });

  it('PATCH /admin/plans/:id endpoint should require super_admin role', () => {
    const metadata = Reflect.getMetadata(
      ROLES_KEY,
      AdminController.prototype.updatePlan,
    );
    expect(metadata).toBeDefined();
    expect(metadata).toContain(UserRole.SUPER_ADMIN);
  });
});
