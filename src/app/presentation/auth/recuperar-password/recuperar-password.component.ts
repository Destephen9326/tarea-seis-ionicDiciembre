import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { shieldCheckmark } from 'ionicons/icons';

@Component({
  selector: 'app-recuperar-password',
  templateUrl: './recuperar-password.component.html',
  styleUrls: ['./recuperar-password.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class RecuperarPasswordComponent implements OnInit {

  public formularioRecuperacion!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController
  ) {
    addIcons({ shieldCheckmark });
  }

  ngOnInit() {
    // Validamos que sea un correo real y requerido
    this.formularioRecuperacion = this.fb.group({
      correoRecuperacion: ['', [Validators.required, Validators.email]]
    });
  }

  // Getters para el HTML
  get correoControl(): AbstractControl | null {
    return this.formularioRecuperacion.get('correoRecuperacion');
  }

  get correoInvalido(): boolean {
    return !!(this.correoControl?.invalid && this.correoControl?.touched);
  }

  // Cerrar sin hacer nada
  cerrarModal() {
    this.modalCtrl.dismiss();
  }

  // Simulador de envío
  enviarEnlace() {
    if (this.formularioRecuperacion.valid) {
      console.log('Enviando enlace a:', this.formularioRecuperacion.value.correoRecuperacion);
      this.modalCtrl.dismiss(); 
    } else {
      this.formularioRecuperacion.markAllAsTouched();
    }
  }
}