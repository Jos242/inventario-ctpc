import { Routes } from '@angular/router';
import { PageNotFoundComponent } from './core/page-not-found/page-not-found.component';
import { authGuard } from './share/guards/auth.guard';
import { ActivoIndexComponent } from './activo/activo-index/activo-index.component';
import { HomeIndexComponent } from './home/home-index/home-index.component';
import { ActivoDetailComponent } from './activo/activo-detail/activo-detail.component';
import { ActivoCreateComponent } from './activo/activo-create/activo-create.component';


export const routes: Routes = [
    { path:'activos', component: ActivoIndexComponent},
    { path:'index', component: HomeIndexComponent},
    
    { path:'activos/crear', component: ActivoCreateComponent},
    { path:'activos/:id', component: ActivoDetailComponent },

    //en caso de que el link no tenga nada, se redirige a /home
    { path:'', redirectTo:'/index' ,pathMatch:'full'},
    //en caso de que no se encuentre el link, se redirige a pagina no encontrada
    { path:'**',component:PageNotFoundComponent},
];
