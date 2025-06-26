import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmacionDialogComponent } from '../confirmacion-dialog/confirmacion-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {

  constructor(private dialog: MatDialog) {}

  confirm(index: any = 0, data: any = '', activos: any = null): Observable<any> {
    const mensajes = [
      //0 confirmación default.
      {
        texto: 'Está seguro que quiere realizar esta acción?',
        false: 'No',
        true:  'Si'
      },
      //1 revision-index: nueva revision.
      {
        texto: 'Una vez iniciada la revisión de inventario, será rederigido al inventario de su aula. Debe finalizar de realizar la revision antes de cerrar la pagina. Está seguro que desea continuar con la revisión?',
        false: 'No',
        true:  'Si'
      },
      //2 revision-index: nueva revision, otra existente.
      {
        texto: 'Ya tiene iniciada una revisión de inventario en esta ubicación. Desea continuar con la revisión o empezar una nueva?',
        false: 'Nueva',
        true:  'Continuar'
      },
      //3 acta-baja-create: agregar +50 activos para dar de baja.
      {
        texto: `Está por agregar <strong>${data}</strong> activos a dar de baja. Está seguro que desea agregarlos?`,
        false: 'Cancelar',
        true:  'Aceptar'
      },
      //4 acta-baja-create, acta-mover-create: generar pdf o word.
      {
        texto: 'Qué tipo de archivo desea para generar el acta?',
        false: 'Word',
        true:  'PDF'
      },
      //5 acta-baja-create: crear documento confirmar cantidad de activos a dar de baja.
      {
        texto: `Está por dar de baja a <strong>${data}</strong> activos. Está seguro que desea continuar?`,
        false: 'Cancelar',
        true:  'Aceptar'
      },
      //6 acta-baja-create: crear documento +500, doble verificación.
      {
        texto: `Está intentando dar de baja a <strong>${data}</strong> activos. Esta acción es masiva y no se puede deshacer fácilmente. ¿Está completamente seguro de que desea continuar?`,
        false: 'Cancelar',
        true:  'Aceptar'
      },
      //7 acta-baja-create: agregar activos seleccionar razon de baja.
      {
        texto: `Seleccione la razón por la cual se estará dando de baja a los activos.`,
        false: 'Obsolencia',
        true:  'Inservibilidad'
      },
      //8 acta-mover-create: agregar activos seleccionar destino de traslado.
      {
        texto: `Seleccione el destino de traslado de los activos.`,
        false: 'Cancelar',
        true:  'Aceptar',
        ubicaciones: true,
        activos: activos
      },
      //9 acta-listado: confirmar que se haya impreso fisicamente la marcar como impreso.
      {
        texto: `Por favor asegurese de haber impreso el documento fisicamente antes de marcarlo como impreso.`,
        false: 'Cancelar',
        true:  'Confirmar',
      }
    ];
    const dialogRef: MatDialogRef<ConfirmacionDialogComponent> = this.dialog.open(ConfirmacionDialogComponent, {
      width: '600px',
      data: mensajes[index]
    });

    return dialogRef.afterClosed();
  }
}