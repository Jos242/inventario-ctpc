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
import { AdminIndexComponent } from './admin/admin-index/admin-index.component';
import { ActaListadoComponent } from './acta/acta-listado/acta-listado.component';
import { ActivoUpdateComponent } from './activo/activo-update/activo-update.component';
import { ActaExcelsComponent } from './acta/acta-excels/acta-excels.component';
import { ActaExcelCustomComponent } from './acta/acta-excel-custom/acta-excel-custom.component';


export const routes: Routes = [
    { path:'activos', component: ActivoIndexComponent, canActivate: [authGuard]  },
    { path:'index', component: HomeIndexComponent, canActivate: [authGuard] },
    // { path:'index', component: HomeIndexComponent , canActivate: [authGuard] },
    { path: 'login', component: LoginIndexComponent },

    { path:'admin', component: AdminIndexComponent, canActivate: [authGuard] },

    { path:'actas', component: ActaIndexComponent, canActivate: [authGuard]},
    { path:'actas/baja', component: ActaBajaCreateComponent, canActivate: [authGuard]},
    { path:'actas/traslado', component: ActaMoverCreateComponent, canActivate: [authGuard]},
    { path:'actas/lista', component: ActaListadoComponent, canActivate: [authGuard]},
    { path:'actas/excels', component: ActaExcelsComponent, canActivate: [authGuard]},
    { path:'actas/excel-custom', component: ActaExcelCustomComponent, canActivate: [authGuard]},
    
    { path:'activos/crear', component: ActivoCreateComponent, canActivate: [authGuard]},
    { path:'activos/scan', component: ActivoScanComponent },

    { path:'activos/:id/edit', component: ActivoUpdateComponent },
    { path:'activos/:id', component: ActivoDetailComponent },
    
    

    //en caso de que el link no tenga nada, se redirige a /home
    { path:'', redirectTo:'/index' ,pathMatch:'full'},
    //en caso de que no se encuentre el link, se redirige a pagina no encontrada
    { path:'**',component:PageNotFoundComponent},
];
