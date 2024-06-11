import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import {MatCardModule} from '@angular/material/card';

@Component({
  selector: 'app-acta-index',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatDividerModule, MatButtonModule,],
  templateUrl: './acta-index.component.html',
  styleUrl: './acta-index.component.scss'
})
export class ActaIndexComponent {

}
