import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class TumblrAuthGuard extends AuthGuard('tumblr') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.userId || req.query?.userId;
    const baseCallbackURL = process.env.TUMBLR_CALLBACK_URL;
    if (userId && baseCallbackURL) {
      return {
        callbackURL: `${baseCallbackURL}?userId=${userId}`,
      };
    }
    return {};
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext, status?: any) {
    const req = context.switchToHttp().getRequest();
    const isCallback = req.path.includes('/callback') || !!req.query?.oauth_token;

    if (isCallback && (err || !user)) {
      const res = context.switchToHttp().getResponse();
      res.redirect('http://localhost:5173/settings/accounts?tumblr=error');
      return null;
    }

    return super.handleRequest(err, user, info, context, status);
  }
}
