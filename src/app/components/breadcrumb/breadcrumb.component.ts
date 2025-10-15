import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';

export interface Breadcrumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent implements OnInit {
  public breadcrumbs = signal<Breadcrumb[]>([]);

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.breadcrumbs.set(this.createBreadcrumbs(this.activatedRoute.root));
    });
    this.breadcrumbs.set(this.createBreadcrumbs(this.activatedRoute.root));
  }

  private createBreadcrumbs(route: ActivatedRoute, url: string = ''): Breadcrumb[] {
    // MODIFICATION : On initialise un tableau vide au lieu d'ajouter "Home"
    const newBreadcrumbs: Breadcrumb[] = [];

    let currentRoute = route.firstChild;
    while (currentRoute) {
      const routeURL = currentRoute.snapshot.url.map(segment => segment.path).join('/');
      
      const label = currentRoute.snapshot.data['breadcrumb'];
      if (label && routeURL) {
        url += `/${routeURL}`;
        newBreadcrumbs.push({ label, url });
      }

      currentRoute = currentRoute.firstChild;
    }
    return newBreadcrumbs;
  }
}