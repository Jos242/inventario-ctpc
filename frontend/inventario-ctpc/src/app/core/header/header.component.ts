import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../share/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  logged: any;
  currentUser: any;
  userName: string | null;
  userType: string | null;
  adminType: string | null;

  constructor(private authService: AuthService, private router: Router) {
    this.authService.isLoggedIn$().subscribe((x) => {
      this.logged = x;
    })

    

  }

  ngOnInit(): void {
    this.authService.getUserName$().subscribe(userName => {
      this.userName = userName;
    });

    // Subscribe to user type changes
    this.authService.getUserType$().subscribe(userType => {
      this.userType = userType;;
    });
    
    this.authService.getAdminType$().subscribe(adminType => {
      this.adminType = adminType;
    });
    
  }



  logout(): void {
    this.authService.logout();
  }

}
