import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import {MatCardModule} from '@angular/material/card';

@Component({
  selector: 'app-home-index',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatDividerModule, MatButtonModule,],
  templateUrl: './home-index.component.html',
  styleUrl: './home-index.component.scss'
})
export class HomeIndexComponent {

}
