import { Component, LOCALE_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
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

interface DocumentNode {
  name: string;
  children?: DocumentNode[];
  path?: string;
}

interface ExampleFlatNode {
  expandable: boolean;
  name: string;
  level: number;
  path?: string;
}

@Component({
  selector: 'app-acta-listado',
  standalone: true,
  imports: [MatTreeModule, MatButtonModule, MatIconModule, CommonModule, MatCardModule],
  templateUrl: './acta-listado.component.html',
  styleUrl: './acta-listado.component.scss'
})
export class ActaListadoComponent {

  public isLoadingResults = false;
  datos:any;
  destroy$:Subject<boolean>=new Subject<boolean>();

  selectedDocument: any = null;

  private _transformer = (node: DocumentNode, level: number) => ({
    expandable: !!node.children && node.children.length > 0,
    name: node.name,
    level: level,
    path: node.path,
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
    private sanitizer: DomSanitizer
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
          console.log(this.datos)
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
      acc[capitalizedMonth].push({ name: doc.titulo, path: doc.ruta });
      return acc;
    }, {});
  
    // Convert to tree structure
    for (const month in groupedByMonth) {
      treeData.push({
        name: month,
        children: groupedByMonth[month]
      });
    }
  
    this.dataSource.data = treeData;
  }

  hasChild = (_: number, node: ExampleFlatNode) => node.expandable;


  onDocumentClick(node: ExampleFlatNode) {
    this.selectedDocument = this.datos.find((doc: any) => doc.titulo === node.name);
  }
  
  downloadDocument(path: string) {
    const url = `${environment.apiURL}media/${path}`;
    window.open(url, '_blank');
  }

  marcarImpreso(){
    if (!this.selectedDocument) return;

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
          console.log(data)
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

}
