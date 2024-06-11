import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActaIndexComponent } from './acta-index/acta-index.component';

const routes: Routes = [
  { path:'actas', component: ActaIndexComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ActaRoutingModule { }
