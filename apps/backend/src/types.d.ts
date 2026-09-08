declare module '@nestjs/platform-express' {
  export { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
  export { FileFieldsInterceptor } from '@nestjs/platform-express/multer/interceptors/file-fields.interceptor';
  export { MulterModule } from '@nestjs/platform-express/multer/multer.module';
}

declare module '@nestjs/platform-express/multer/interceptors/file.interceptor' {
  import { NestInterceptor } from '@nestjs/common';
  export function FileInterceptor(fieldName: string, options?: any): ClassDecorator;
}

declare module '@nestjs/platform-express/multer/interceptors/file-fields.interceptor' {
  export function FileFieldsInterceptor(fields: any[], options?: any): ClassDecorator;
}

declare module '@nestjs/platform-express/multer/multer.module' {
  import { DynamicModule } from '@nestjs/common';
  export class MulterModule {
    static register(options?: any): DynamicModule;
  }
}

declare module '@nestjs/throttler' {
  import { DynamicModule } from '@nestjs/common';
  export class ThrottlerModule {
    static forRoot(options?: any): DynamicModule;
    static register(options?: any): DynamicModule;
  }
  export class ThrottlerGuard {}
}

declare module '@nestjs/config' {
  import { DynamicModule } from '@nestjs/common';
  export class ConfigModule {
    static forRoot(options?: any): DynamicModule;
    static forRootAsync(options?: any): DynamicModule;
  }
  export class ConfigService {
    get<T = any>(key: string, defaultValue?: T): T;
  }
}

declare module 'postgres' {
  function postgres(connString: string, options?: any): any;
  export default postgres;
}
