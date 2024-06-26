import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActivoIndexComponent } from './activo-index/activo-index.component';
import { ActivoDetailComponent } from './activo-detail/activo-detail.component';
import { ActivoCreateComponent } from './activo-create/activo-create.component';
import { ActaIndexComponent } from '../acta/acta-index/acta-index.component';

const routes: Routes = [
  { path:'activos', component: ActivoIndexComponent},
  { path:'activos/crear', component: ActivoCreateComponent },
  { path:'actas', component: ActaIndexComponent},

  { path:'activos/:id', component: ActivoDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ActivoRoutingModule { }
