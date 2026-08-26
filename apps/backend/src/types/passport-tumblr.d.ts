declare module 'passport-tumblr' {
  import { Strategy as PassportStrategy } from 'passport';
  
  export interface StrategyOptions {
    consumerKey: string;
    consumerSecret: string;
    callbackURL: string;
    userProfileURL?: string;
    passReqToCallback?: boolean;
  }

  export class Strategy extends PassportStrategy {
    constructor(
      options: StrategyOptions,
      verify: (
        token: string,
        tokenSecret: string,
        profile: any,
        done: (err: any, user?: any, info?: any) => void
      ) => void
    );
    constructor(
      options: StrategyOptions,
      verify: (
        req: any,
        token: string,
        tokenSecret: string,
        profile: any,
        done: (err: any, user?: any, info?: any) => void
      ) => void
    );
  }
}
