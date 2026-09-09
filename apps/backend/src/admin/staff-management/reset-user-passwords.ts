export interface PasswordResetOptions {
  userId: string;
  newPassword?: string;
  requirePasswordChangeOnNextLogin?: boolean;
}

export interface PasswordResetResult {
  userId: string;
  temporaryPassword?: string;
  resetAt: Date;
}

export interface PasswordResetProviders {
  findUserById(userId: string): Promise<{ id: string; email: string; name: string } | null>;
  hashPassword(password: string): Promise<string>;
  generateRandomPassword(): string;
  updatePassword(userId: string, hashedPassword: string, forceChange: boolean): Promise<void>;
  sendPasswordResetNotification(email: string, tempPassword?: string): Promise<void>;
}

export class ResetUserPasswordService {
  constructor(private readonly providers: PasswordResetProviders) {}

  async resetPassword(options: PasswordResetOptions): Promise<PasswordResetResult> {
    const user = await this.providers.findUserById(options.userId);
    if (!user) {
      throw new Error(`User with ID ${options.userId} does not exist.`);
    }

    let rawPassword = options.newPassword;
    let isTemporary = false;

    if (!rawPassword) {
      rawPassword = this.providers.generateRandomPassword();
      isTemporary = true;
    }

    const hashedPassword = await this.providers.hashPassword(rawPassword);
    const forceChange = options.requirePasswordChangeOnNextLogin ?? isTemporary;

    await this.providers.updatePassword(options.userId, hashedPassword, forceChange);
    await this.providers.sendPasswordResetNotification(user.email, isTemporary ? rawPassword : undefined);

    return {
      userId: user.id,
      temporaryPassword: isTemporary ? rawPassword : undefined,
      resetAt: new Date(),
    };
  }
}