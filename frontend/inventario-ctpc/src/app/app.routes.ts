import { Routes } from '@angular/router';
import { PageNotFoundComponent } from './core/page-not-found/page-not-found.component';
import { authGuard } from './share/guards/auth.guard';
import { ActivoIndexComponent } from './activo/activo-index/activo-index.component';
import { HomeIndexComponent } from './home/home-index/home-index.component';
import { ActivoDetailComponent } from './activo/activo-detail/activo-detail.component';
import { ActivoCreateComponent } from './activo/activo-create/activo-create.component';
import { ActaIndexComponent } from './acta/acta-index/acta-index.component';
import { LoginIndexComponent } from './login/login-index/login-index.component';
import { ActaBajaCreateComponent } from './acta/acta-baja-create/acta-baja-create.component';
import { ActaMoverCreateComponent } from './acta/acta-mover-create/acta-mover-create.component';
import { ActivoScanComponent } from './activo/activo-scan/activo-scan.component';


export const routes: Routes = [
    { path:'activos', component: ActivoIndexComponent , canActivate: [authGuard] },
    { path:'index', component: HomeIndexComponent , canActivate: [authGuard] },
    { path: 'login', component: LoginIndexComponent },

    { path:'actas', component: ActaIndexComponent},
    { path:'actas/baja', component: ActaBajaCreateComponent},
    { path:'actas/traslado', component: ActaMoverCreateComponent},
    
    { path:'activos/crear', component: ActivoCreateComponent},
    { path:'activos/scan', component: ActivoScanComponent },

    { path:'activos/:id', component: ActivoDetailComponent },
    

    //en caso de que el link no tenga nada, se redirige a /home
    { path:'', redirectTo:'/index' ,pathMatch:'full'},
    //en caso de que no se encuentre el link, se redirige a pagina no encontrada
    { path:'**',component:PageNotFoundComponent},
];
