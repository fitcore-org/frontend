import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  private router = inject(Router)
  public modalMenu : boolean = false;
  public setModalMenu() : void {
    this.modalMenu = !this.modalMenu
  }
  public toLogin(){
    this.router.navigate(['/login'])
  }
  public toHome(){
    this.router.navigate([''])
  }
}
