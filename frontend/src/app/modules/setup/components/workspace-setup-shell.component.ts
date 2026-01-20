import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ClassesSectionsFacade } from '../pages/tenant-workspace-setup/classes-sections/classes-sections.facade';
import { TenantWorkspaceSetupFacade } from '../pages/tenant-workspace-setup/tenant-workspace-setup.facade';

@Component({
  selector: 'app-workspace-setup-shell',
  standalone: true,
  imports: [RouterModule],
  providers: [TenantWorkspaceSetupFacade, ClassesSectionsFacade],
  template: `
    <div class="workspace-setup-shell">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .workspace-setup-shell {
      min-height: 100%;
      width: 100%;
    }
  `]
})
export class WorkspaceSetupShellComponent implements OnInit {
  private readonly facade = inject(TenantWorkspaceSetupFacade);

  ngOnInit(): void {
    this.facade.init();
  }
}
