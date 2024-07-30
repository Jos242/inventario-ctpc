import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActivoIndexComponent } from './activo-index/activo-index.component';
import { ActivoDetailComponent } from './activo-detail/activo-detail.component';
import { ActivoCreateComponent } from './activo-create/activo-create.component';
import { ActaIndexComponent } from '../acta/acta-index/acta-index.component';
import { ActivoScanComponent } from './activo-scan/activo-scan.component';
import { ActivoUpdateComponent } from './activo-update/activo-update.component';

const routes: Routes = [
  { path:'activos', component: ActivoIndexComponent},
  { path:'activos/crear', component: ActivoCreateComponent },
  { path:'activos/scan', component: ActivoScanComponent },
  // { path:'actas', component: ActaIndexComponent},

  { path:'activos/:id', component: ActivoDetailComponent }
  { path:'activos/:id/edit', component: ActivoUpdateComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ActivoRoutingModule { }
