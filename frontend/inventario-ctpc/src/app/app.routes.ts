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
import { UsuarioIndexComponent } from './usuario/usuario-index/usuario-index.component';
import { RevisionIndexComponent } from './revision/revision-index/revision-index.component';
import { RevisionAulaComponent } from './revision/revision-aula/revision-aula.component';
import { RevisionAdminComponent } from './revision/revision-admin/revision-admin.component';
import { adminGuard } from './share/guards/admin.guard';
import { UsuarioCreateComponent } from './usuario/usuario-create/usuario-create.component';
import { UsuarioDetailComponent } from './usuario/usuario-detail/usuario-detail.component';
import { UsuarioEditComponent } from './usuario/usuario-edit/usuario-edit.component';
import { UbicacionIndexComponent } from './ubicacion/ubicacion-index/ubicacion-index.component';
import { UbicacionCreateComponent } from './ubicacion/ubicacion-create/ubicacion-create.component';
import { UbicacionDetailComponent } from './ubicacion/ubicacion-detail/ubicacion-detail.component';
import { UbicacionEditComponent } from './ubicacion/ubicacion-edit/ubicacion-edit.component';
import { AdquisicionIndexComponent } from './adquisicion/adquisicion-index/adquisicion-index.component';
import { AdquisicionDetailComponent } from './adquisicion/adquisicion-detail/adquisicion-detail.component';
import { AdquisicionCreateComponent } from './adquisicion/adquisicion-create/adquisicion-create.component';
import { AdquisicionEditComponent } from './adquisicion/adquisicion-edit/adquisicion-edit.component';


export const routes: Routes = [
    { path:'activos', component: ActivoIndexComponent, canActivate: [authGuard, adminGuard]  },
    { path:'index', component: HomeIndexComponent, canActivate: [authGuard, adminGuard] },
    // { path:'index', component: HomeIndexComponent , canActivate: [authGuard] },
    { path: 'login', component: LoginIndexComponent },

    { path:'admin', component: AdminIndexComponent, canActivate: [authGuard, adminGuard] },

    { path:'actas', component: ActaIndexComponent, canActivate: [authGuard, adminGuard]},
    { path:'actas/baja', component: ActaBajaCreateComponent, canActivate: [authGuard, adminGuard]},
    { path:'actas/traslado', component: ActaMoverCreateComponent, canActivate: [authGuard, adminGuard]},
    { path:'actas/lista', component: ActaListadoComponent, canActivate: [authGuard, adminGuard]},
    { path:'actas/excels', component: ActaExcelsComponent, canActivate: [authGuard, adminGuard]},
    { path:'actas/excel-custom', component: ActaExcelCustomComponent, canActivate: [authGuard, adminGuard]},

    { path:'usuarios', component: UsuarioIndexComponent, canActivate: [authGuard, adminGuard]},
    { path:'usuarios/crear', component: UsuarioCreateComponent, canActivate: [authGuard, adminGuard]},
    { path:'usuarios/:id', component: UsuarioDetailComponent, canActivate: [authGuard, adminGuard]},
    { path:'usuarios/:id/edit', component: UsuarioEditComponent, canActivate: [authGuard, adminGuard]},
    
    { path:'activos/crear', component: ActivoCreateComponent, canActivate: [authGuard, adminGuard]},
    { path:'activos/scan', component: ActivoScanComponent },

    { path:'revision', component: RevisionIndexComponent, canActivate: [authGuard]} ,
    { path:'revision/aula', component: RevisionAulaComponent, canActivate: [authGuard]} ,
    { path:'revision/admin', component: RevisionAdminComponent, canActivate: [authGuard, adminGuard]} ,

    { path:'activos/:id/edit', component: ActivoUpdateComponent, canActivate: [authGuard, adminGuard] },
    { path:'activos/:id', component: ActivoDetailComponent },

    { path:'ubicaciones', component: UbicacionIndexComponent, canActivate: [authGuard, adminGuard]},
    { path:'ubicaciones/crear', component: UbicacionCreateComponent, canActivate: [authGuard, adminGuard]},
    { path:'ubicaciones/:id', component: UbicacionDetailComponent, canActivate: [authGuard, adminGuard]},
    { path:'ubicaciones/:id/edit', component: UbicacionEditComponent, canActivate: [authGuard, adminGuard]},

    { path:'adquisiciones', component: AdquisicionIndexComponent, canActivate: [authGuard, adminGuard]},
    { path:'adquisiciones/crear', component: AdquisicionCreateComponent, canActivate: [authGuard, adminGuard]},
    { path:'adquisiciones/:id', component: AdquisicionDetailComponent, canActivate: [authGuard, adminGuard]},
    { path:'adquisiciones/:id/edit', component: AdquisicionEditComponent, canActivate: [authGuard, adminGuard]},
    
    

    //en caso de que el link no tenga nada, se redirige a /home
    { path:'', redirectTo:'/index' ,pathMatch:'full'},
    //en caso de que no se encuentre el link, se redirige a pagina no encontrada
    { path:'**',component:PageNotFoundComponent},
];
