import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { HttpHandler, HttpHandlerFn, HttpRequest, provideHttpClient, withInterceptors } from '@angular/common/http';
import { tap } from 'rxjs';

// function AuthInterseptor(req:HttpRequest<any>,next:HttpHandlerFn){
//    const token = localStorage.getItem('jwt');
//        let modifiedReq = req;
//         if (token) {
//       modifiedReq = req.clone({
//         setHeaders: {
//           Authorization: `Bearer ${token}`
//         }
//       });
//     }
//      return next.handle(modifiedReq).pipe(
//       tap((event: any) => {

//         // If backend sends a new token inside response headers or body:
//         if (event?.body?.newToken) {
//           localStorage.setItem('jwt', event.body.newToken);
//           console.log('Token updated in localStorage');
//         }
//       })
//     );
// }


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    
  ]
};
