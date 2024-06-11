import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeIndexComponent } from './home-index/home-index.component';

const routes: Routes = [
  { path:'index', component: HomeIndexComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule { }
