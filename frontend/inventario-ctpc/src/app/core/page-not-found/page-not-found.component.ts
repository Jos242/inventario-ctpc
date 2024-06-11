import { Component } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [MatButtonModule, RouterLink],
  templateUrl: './page-not-found.component.html',
  styleUrl: './page-not-found.component.scss'
})
export class PageNotFoundComponent {

}
