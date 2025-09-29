import {bootstrapApplication} from '@angular/platform-browser';
import {appConfig} from './app/app.config';
// On s'assure de bien démarrer avec AppComponent
import {AppComponent} from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
