import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { DiscordController } from './discord.controller';
import { DiscordService } from './discord.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

describe('DiscordController', () => {
  let controller: DiscordController;
  let mockDiscordService: Partial<DiscordService>;
  let mockConfigService: Partial<ConfigService>;

  const mockUser = { userId: 'usr-1234-abcd' };

  beforeEach(async () => {
    mockDiscordService = {
      generateStateJwt: jest.fn().mockResolvedValue('mock.jwt.state'),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'discord.clientId') return undefined;
        if (key === 'discord.redirectUri') return 'http://localhost:4000/api/channels/discord/callback';
        return undefined;
      }),
    };

    delete process.env.DISCORD_CLIENT_ID;
    delete process.env.DISCORD_REDIRECT_URI;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiscordController],
      providers: [
        { provide: DiscordService, useValue: mockDiscordService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DiscordController>(DiscordController);
  });

  describe('connect', () => {
    it('should throw InternalServerErrorException when DISCORD_CLIENT_ID is missing', async () => {
      await expect(controller.connect(mockUser)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(controller.connect(mockUser)).rejects.toThrow(
        'Discord OAuth is not configured on this server. Missing DISCORD_CLIENT_ID.',
      );
    });

    it('should throw InternalServerErrorException when DISCORD_CLIENT_ID is whitespace or quotes', async () => {
      (mockConfigService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'discord.clientId') return '   ""   ';
        if (key === 'discord.redirectUri') return 'http://localhost:4000/api/channels/discord/callback';
        return undefined;
      });

      await expect(controller.connect(mockUser)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should return authUrl containing non-empty client_id when DISCORD_CLIENT_ID is configured', async () => {
      const testClientId = '123456789012345678';
      (mockConfigService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'discord.clientId') return testClientId;
        if (key === 'discord.redirectUri') return 'http://localhost:4000/api/channels/discord/callback';
        return undefined;
      });

      const result = await controller.connect(mockUser);

      expect(result).toBeDefined();
      expect(result.authUrl).toBeDefined();

      const parsedUrl = new URL(result.authUrl);
      expect(parsedUrl.origin).toBe('https://discord.com');
      expect(parsedUrl.pathname).toBe('/oauth2/authorize');

      const params = parsedUrl.searchParams;
      expect(params.get('client_id')).toBe(testClientId);
      expect(params.get('client_id')).not.toBe('');
      expect(params.get('response_type')).toBe('code');
      expect(params.get('redirect_uri')).toBe('http://localhost:4000/api/channels/discord/callback');
      expect(params.get('scope')).toBe('identify guilds bot applications.commands');
      expect(params.get('permissions')).toBe('2048');
      expect(params.get('state')).toBe('mock.jwt.state');
    });
  });
});
