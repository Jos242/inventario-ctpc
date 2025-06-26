import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import {MatCardModule} from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-admin-index',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatDividerModule, MatCardModule, MatIconModule, MatTooltipModule],
  templateUrl: './admin-index.component.html',
  styleUrl: './admin-index.component.scss'
})
export class AdminIndexComponent {

}
