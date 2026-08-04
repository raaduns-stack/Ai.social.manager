import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { SocialProvider } from '../../common/enums/social-provider.enum';

export class CreateSocialAccountDto {
  @ApiProperty({
    description: 'Social platform of the account',
    enum: SocialProvider,
    example: SocialProvider.FACEBOOK,
  })
  @IsEnum(SocialProvider)
  platform: SocialProvider;

  @ApiProperty({
    description: 'Username or page name on the social platform',
    example: 'mybrandpage',
  })
  @IsString()
  accountHandle: string;
}
