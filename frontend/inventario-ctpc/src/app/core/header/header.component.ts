import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

}
