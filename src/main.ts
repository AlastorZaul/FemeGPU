import {bootstrapApplication} from '@angular/platform-browser';
import {AppComponent} from './app/app.component';
// IMPORTANT : On importe la config qui contient la Factory et les providers
import {appConfig} from './app/app.config';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
