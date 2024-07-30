import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActaIndexComponent } from './acta-index/acta-index.component';
import { ActaBajaCreateComponent } from './acta-baja-create/acta-baja-create.component';
import { ActaMoverCreateComponent } from './acta-mover-create/acta-mover-create.component';
import { ActaListadoComponent } from './acta-listado/acta-listado.component';

const routes: Routes = [
  { path:'actas', component: ActaIndexComponent},
  { path:'actas/baja', component: ActaBajaCreateComponent},
  { path:'actas/traslado', component: ActaMoverCreateComponent},
  { path:'actas/lista', component: ActaListadoComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ActaRoutingModule { }
