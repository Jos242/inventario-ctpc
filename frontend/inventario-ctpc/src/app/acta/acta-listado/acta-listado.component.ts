import { Component, LOCALE_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GenericService } from '../../share/generic.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import localeCR from '@angular/common/locales/es-CR'
import {MatCardModule} from '@angular/material/card';
import { ConfirmationService } from '../../share/confirmation.service';

interface doc {
  id?: number;
  titulo: string;
  tipo?: string;
  ruta?: string;
  creado_el?: string;
  impreso?: boolean;
}

interface DocumentNode extends doc {
  children?: DocumentNode[];
}

interface ExampleFlatNode extends doc {
  expandable: boolean;
  level: number;
}

@Component({
  selector: 'app-acta-listado',
  standalone: true,
  imports: [MatTreeModule, MatButtonModule, MatIconModule, CommonModule, MatCardModule, RouterLink],
  templateUrl: './acta-listado.component.html',
  styleUrl: './acta-listado.component.scss'
})
export class ActaListadoComponent {

  public isLoadingResults = false;
  datos: any;
  destroy$: Subject<boolean>=new Subject<boolean>();

  selectedDocument: any = null;

  lastTraslado: any;
  lastBaja: any;

  private _transformer = (node: DocumentNode, level: number) => ({
    ...node,
    expandable: !!node.children && node.children.length > 0,
    level: level
  });

  treeControl = new FlatTreeControl<ExampleFlatNode>(
    node => node.level,
    node => node.expandable,
  );

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    node => node.level,
    node => node.expandable,
    node => node.children,
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  constructor(
    private gService: GenericService,
    private router: Router,
    private route: ActivatedRoute,
    private httpClient: HttpClient,
    private sanitizer: DomSanitizer,
    private confirmationService: ConfirmationService
  ) {
    this.loadDocs();
  }

  loadDocs() {
    this.isLoadingResults = true;

    const loadingTimeout = setTimeout(() => {
      if (this.isLoadingResults) {
        Swal.fire({
          icon: 'error',
          title: 'Hay problemas...',
          text: 'La carga de datos está durando más de lo esperado... Por favor intente nuevamente',
        });
      }
    }, 15000);

    this.gService.list('obtener-documentos/')
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: any) => {
        this.datos = data;

        const bajas = data.filter(doc =>
          doc.titulo?.toLowerCase().includes('baja')
        );
        const traslados = data.filter(doc =>
          doc.titulo?.toLowerCase().includes('traslado')
        );

        this.lastBaja = this.getItemWithBiggestId(bajas);
        this.lastTraslado = this.getItemWithBiggestId(traslados);

        this.isLoadingResults = false;
        clearTimeout(loadingTimeout);
        this.processData();
      },
      error: () => {
        this.isLoadingResults = false;
        clearTimeout(loadingTimeout);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un error al cargar los datos, por favor recargue la página para intentar otra vez o contacte a su administrador.',
        });
      }
    });
  }

  getItemWithBiggestId(data: any[]): any | null {
    if (!data || data.length === 0) return null;
    return data.reduce((max, current) => current.id > max.id ? current : max);
  }

  processData() {
    const treeData: DocumentNode[] = [];
  
    // Helper function to capitalize the first letter of a string
    const capitalizeFirstLetter = (string: string) => {
      return string.charAt(0).toUpperCase() + string.slice(1);
    };
  
    // Sort documents by creation date (newest first)
    this.datos.sort((a: any, b: any) => new Date(b.creado_el).getTime() - new Date(a.creado_el).getTime());
  
    // Group documents by month
    const groupedByMonth = this.datos.reduce((acc: any, doc: any) => {
      const date = new Date(doc.creado_el);
      const month = date.toLocaleString('es-CR', { month: 'long', year: 'numeric' });
      const capitalizedMonth = capitalizeFirstLetter(month);
      if (!acc[capitalizedMonth]) acc[capitalizedMonth] = [];
      acc[capitalizedMonth].push(doc);
      return acc;
    }, {});
  
    // Convert to tree structure
    for (const month in groupedByMonth) {
      treeData.push({
        titulo: month,
        children: groupedByMonth[month]
      });
    }
  
    this.dataSource.data = treeData;
  }

  hasChild = (_: number, node: ExampleFlatNode) => node.expandable;


  onDocumentClick(node: ExampleFlatNode) {
    console.log(node)
    this.selectedDocument = this.datos.find((doc: any) => doc.titulo === node.titulo);
  }
  
  downloadDocument(path: string) {
    const url = `${environment.apiURL}${path}`;
    window.open(url, '_blank');
  }

  async marcarImpreso(){
    const confirmation = this.confirmationService.confirm(9);
    const result = await firstValueFrom(confirmation);

    if (!this.selectedDocument || !result) return;

    const updateData = {
      titulo: this.selectedDocument.titulo,
      tipo: this.selectedDocument.tipo,
      impreso: true
    };

    this.isLoadingResults = true;

    const loadingTimeout = setTimeout(() => {
      if (this.isLoadingResults) {
        Swal.fire({
          icon: 'error',
          title: 'Hay problemas...',
          text: 'La carga de datos está durando más de lo esperado... Por favor intente nuevamente',
        });
      }
    }, 15000);

    this.gService.patch(`update-doc-info/${this.selectedDocument.id}/`, updateData)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: any) => {
        this.selectedDocument.impreso = true;
        
        clearTimeout(loadingTimeout);
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: `Documento ${this.selectedDocument.titulo} marcado como impreso.`,
        });
      },
      error: () => {
        this.isLoadingResults = false;
        clearTimeout(loadingTimeout);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un error al marcar el documento como impreso. Por favor intente nuevamente.',
        });
      }
    });
  }

  checkBorrar(doc: any) {
    if (doc?.id != this.lastBaja?.id && doc?.id != this.lastTraslado?.id) {
      if (doc.tipo == "EXCEL") {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  

  async deleteDocumento(doc: any){
    const confirmation = this.confirmationService.confirm();
    const result = await firstValueFrom(confirmation);

    if (!doc || !result) return;

    this.isLoadingResults = true;

    const loadingTimeout = setTimeout(() => {
      if (this.isLoadingResults) {
        Swal.fire({
          icon: 'error',
          title: 'Hay problemas...',
          text: 'La carga de datos está durando más de lo esperado... Por favor intente nuevamente',
        });
      }
    }, 15000);

    this.gService.delete(`delete-document/${doc.id}/`)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: any) => {
        clearTimeout(loadingTimeout);
        
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: `Documento ${this.selectedDocument.titulo} marcado como impreso.`,
        });

        this.loadDocs();
      },
      error: () => {
        this.isLoadingResults = false;
        clearTimeout(loadingTimeout);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un error al marcar el documento como impreso. Por favor intente nuevamente.',
        });
      }
    });
  }
}
