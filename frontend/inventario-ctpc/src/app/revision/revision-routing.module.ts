import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RevisionIndexComponent } from './revision-index/revision-index.component';
import { RevisionAulaComponent } from './revision-aula/revision-aula.component';
import { RevisionAdminComponent } from './revision-admin/revision-admin.component';

const routes: Routes = [

  { path:'revision', component: RevisionIndexComponent} ,
  { path:'revision/aula', component: RevisionAulaComponent} ,
  { path:'revision/admin', component: RevisionAdminComponent} 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RevisionRoutingModule { }
