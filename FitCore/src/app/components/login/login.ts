import { AfterViewInit, Component, ViewChild, ElementRef} from '@angular/core';
import { stringify } from 'querystring';
import { json } from 'stream/consumers';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login implements AfterViewInit {
  @ViewChild('halter1') halter1!: ElementRef;
  @ViewChild('halter2') halter2!: ElementRef;
  @ViewChild('halter3') halter3!: ElementRef;
  @ViewChild('halter4') halter4!: ElementRef;
  ngAfterViewInit(): void {
    this.animationHalterStart()
  }

  public animationHalterStart(){
    this.animationHalter()
    setInterval(() => {
      this.animationHalter()
    }, 4000)
  }
  public animationHalter(){

      setTimeout(() => {
        this.halter4.nativeElement.style.transform = 'scale(1) rotate(5deg)'
        this.halter4.nativeElement.style.transition = 'transform 300ms ease'

        this.halter1.nativeElement.style.transform = 'scale(1.05) rotate(5deg)'
        this.halter1.nativeElement.style.transition = 'transform 300ms ease'
      },500)
      setTimeout(() => {
        this.halter2.nativeElement.style.transform = 'scale(1.05) rotate(5deg)'
        this.halter2.nativeElement.style.transition = 'transform 300ms ease'

        this.halter1.nativeElement.style.transform = 'scale(1) rotate(5deg)'
        this.halter1.nativeElement.style.transition = 'transform 300ms ease'
      },1500)
      setTimeout(() => {
        this.halter3.nativeElement.style.transform = 'scale(1.05) rotate(5deg)'
        this.halter3.nativeElement.style.transition = 'transform 300ms ease'

        this.halter2.nativeElement.style.transform = 'scale(1) rotate(5deg)'
        this.halter2.nativeElement.style.transition = 'transform 300ms ease'
      },2500)

      setTimeout(() => {
        this.halter4.nativeElement.style.transform = 'scale(1.05) rotate(5deg)'
        this.halter4.nativeElement.style.transition = 'transform 300ms ease'

        this.halter3.nativeElement.style.transform = 'scale(1) rotate(5deg)'
        this.halter3.nativeElement.style.transition = 'transform 300ms ease'
      },3500)
    }
    @ViewChild('Email') Email!: ElementRef;
    @ViewChild('Senha') Senha!: ElementRef;
    public handleSubmit() {
      JSON.stringify({
        email: this.Email.nativeElement.value,
        senha: this.Senha.nativeElement.value,
      })
    }
}
