import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .then(() => {
    console.log('Application started successfully');
  })
  .catch((err) => {
    console.error('Application bootstrap failed:', err);
  });
