import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActivoIndexComponent } from './activo-index/activo-index.component';

const routes: Routes = [
  { path:'activos', component: ActivoIndexComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ActivoRoutingModule { }
