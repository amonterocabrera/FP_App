import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonItem, IonLabel, IonInput, IonButton, IonIcon, IonSpinner, IonChip,
  IonList, IonListHeader, IonSelect, IonSelectOption, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonText, IonAvatar, ToastController
} from '@ionic/angular/standalone';
import { PersonasService } from '../../core/services/personas.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { addIcons } from 'ionicons';
import {
  searchOutline, saveOutline, idCardOutline, personOutline,
  callOutline, mailOutline, mapOutline, addOutline, trashOutline,
  checkmarkCircleOutline, alertCircleOutline, fingerPrintOutline
} from 'ionicons/icons';
import { environment } from '../../../environments/environment';

interface PadronCiudadano {
  cedula: string;
  nombres: string;
  apellido1: string;
  apellido2: string;
  idSexo: number;
  fechaNacimiento: string | null;
  nombreCompleto: string;
  genero: string;
}

@Component({
  selector: 'app-persona-form',
  templateUrl: './persona-form.component.html',
  styleUrls: ['./persona-form.component.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonItem, IonLabel, IonInput, IonButton, IonIcon, IonSpinner, IonChip,
    IonList, IonListHeader, IonSelect, IonSelectOption,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonText, IonAvatar,
    CommonModule, ReactiveFormsModule
  ]
})
export class PersonaFormComponent implements OnInit {
  form: FormGroup;
  isEditing    = false;
  personaId: string | null = null;
  isLoading    = false;
  isSaving     = false;
  isBuscando   = false;
  ciudadano: PadronCiudadano | null = null;
  fotoUrl: string | null = null;
  padronError: string | null = null;

  private fb           = inject(FormBuilder);
  private personasSvc  = inject(PersonasService);
  private http         = inject(HttpClient);
  private route        = inject(ActivatedRoute);
  private location     = inject(Location);
  private toastCtrl    = inject(ToastController);

  readonly tiposContacto = [
    { value: 1, label: 'Móvil'    },
    { value: 2, label: 'Fijo'     },
    { value: 3, label: 'Trabajo'  },
    { value: 4, label: 'Casa'     },
    { value: 5, label: 'WhatsApp' },
    { value: 99, label: 'Otro'   },
  ];

  constructor() {
    addIcons({
      searchOutline, saveOutline, idCardOutline, personOutline,
      callOutline, mailOutline, mapOutline, addOutline, trashOutline,
      checkmarkCircleOutline, alertCircleOutline, fingerPrintOutline
    });

    this.form = this.fb.group({
      cedula:    ['', Validators.required],
      email:     ['', Validators.email],
      direccion: [''],
      contactos: this.fb.array([]),
    });
  }

  ngOnInit() {
    this.personaId = this.route.snapshot.paramMap.get('id');
    if (this.personaId) {
      this.isEditing = true;
      this.loadPersonaEdit(this.personaId);
    }
  }

  // ── Getters ─────────────────────────────────────────────────────────────────

  get contactos(): FormArray {
    return this.form.get('contactos') as FormArray;
  }

  // ── Búsqueda en PadronJCE ────────────────────────────────────────────────────

  buscarEnPadron() {
    const cedula = this.form.get('cedula')?.value?.trim();
    if (!cedula) return;

    this.isBuscando   = true;
    this.ciudadano    = null;
    this.fotoUrl      = null;
    this.padronError  = null;

    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<PadronCiudadano>(
      `${environment.apiUrl}/api/personas/buscar-padron/${cedula}`,
      { headers }
    ).subscribe({
      next: (data) => {
        this.ciudadano   = data;
        this.fotoUrl     = `${environment.apiUrl}/api/personas/${cedula}/foto`;
        this.isBuscando  = false;
      },
      error: (err) => {
        if (err.status === 404) {
          this.padronError = `Cédula '${cedula}' no encontrada en el PadronJCE.`;
        } else if (err.status === 500 && err.error?.detalle) {
          // Error de conexión u otro error de BD — mostrar detalles para diagnóstico
          this.padronError = `Error del servidor: ${err.error.detalle}`;
        } else {
          this.padronError = `Error ${err.status}: No se pudo consultar el padrón.`;
        }
        this.isBuscando = false;
      }
    });
  }

  // ── Gestión de contactos ─────────────────────────────────────────────────────

  agregarContacto() {
    this.contactos.push(this.fb.group({
      tipo:       [1, Validators.required],
      valor:      ['', [Validators.required, Validators.maxLength(50)]],
      esPrincipal: [false],
      nota:       [''],
    }));
  }

  eliminarContacto(i: number) {
    this.contactos.removeAt(i);
  }

  // ── Cargar persona en modo edición ───────────────────────────────────────────

  loadPersonaEdit(id: string) {
    this.isLoading = true;
    this.personasSvc.getPersona(id).subscribe({
      next: (data: any) => {
        this.form.patchValue({ cedula: data.cedula, email: data.email, direccion: data.direccion });
        this.buscarEnPadron();
        (data.contactos || []).forEach((c: any) => {
          this.contactos.push(this.fb.group({
            tipo:       [c.tipo, Validators.required],
            valor:      [c.valor, Validators.required],
            esPrincipal: [c.esPrincipal],
            nota:       [c.nota],
          }));
        });
        this.isLoading = false;
      },
      error: () => {
        this.showToast('Error al cargar datos', 'danger');
        this.isLoading = false;
        this.location.back();
      }
    });
  }

  // ── Guardar ──────────────────────────────────────────────────────────────────

  save() {
    if (!this.ciudadano && !this.isEditing) {
      this.showToast('Primero busca y verifica la cédula en el padrón', 'warning');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showToast('Completa los campos requeridos', 'warning');
      return;
    }

    this.isSaving = true;
    const payload = {
      cedula:    this.form.value.cedula,
      email:     this.form.value.email || null,
      direccion: this.form.value.direccion || null,
      contactos: this.form.value.contactos,
    };

    if (this.isEditing && this.personaId) {
      this.personasSvc.updatePersona(this.personaId, {
        email:     payload.email ?? undefined,
        direccion: payload.direccion ?? undefined,
        contactos: payload.contactos,
      }).subscribe({
        next: () => {
          this.isSaving = false;
          this.showToast('Actualizado exitosamente', 'success');
          this.location.back();
        },
        error: (err: any) => {
          this.isSaving = false;
          this.showToast(err?.error?.error || 'Error al actualizar', 'danger');
        }
      });
    } else {
      this.personasSvc.createPersona(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.showToast('Persona registrada exitosamente', 'success');
          this.location.back();
        },
        error: (err: any) => {
          this.isSaving = false;
          this.showToast(err?.error?.error || 'Error al crear persona', 'danger');
        }
      });
    }
  }

  async showToast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 2800, color, position: 'bottom' });
    await t.present();
  }
}
