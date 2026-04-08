import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonItem, IonLabel, IonInput, IonButton, IonIcon, IonSpinner, IonChip,
  IonList, IonListHeader, IonSelect, IonSelectOption, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonText, IonAvatar, ToastController, IonCheckbox,
  IonAccordion, IonAccordionGroup
} from '@ionic/angular/standalone';
import { PersonasService } from '../../core/services/personas.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { addIcons } from 'ionicons';
import {
  searchOutline, saveOutline, idCardOutline, personOutline,
  callOutline, mailOutline, mapOutline, addOutline, trashOutline,
  checkmarkCircleOutline, alertCircleOutline, fingerPrintOutline,
  createOutline, closeCircle
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
    IonCheckbox, IonAccordion, IonAccordionGroup, CommonModule, ReactiveFormsModule
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
  isManualMode = false;

  private fb           = inject(FormBuilder);
  private personasSvc  = inject(PersonasService);
  private http         = inject(HttpClient);
  public  route        = inject(ActivatedRoute);
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
      checkmarkCircleOutline, alertCircleOutline, fingerPrintOutline,
      createOutline, closeCircle
    });

    this.form = this.fb.group({
      cedula:    ['', Validators.required],
      email:     ['', Validators.email],
      direccion: [''],
      nombre:    [''],
      apellido:  [''],
      genero:    ['M'],
      fechaNacimiento: [''],
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

  cedulaChanged(event: any) {
    const val = event.target.value?.trim() || '';
    if (val === '') {
      this.resetForm();
    }
  }

  resetForm() {
    this.ciudadano = null;
    this.fotoUrl = null;
    this.padronError = null;
    this.isManualMode = false;
    
    // Si no vinimos directamente por la URL a Editar
    if (!this.route.snapshot.paramMap.get('id')) {
      this.isEditing = false;
      this.personaId = null;
    }
    
    this.contactos.clear();
    this.form.patchValue({
      cedula: '', // Limpiamos también la cédula al reiniciar explícitamente el estado
      email: '',
      direccion: '',
      nombre: '',
      apellido: '',
      fechaNacimiento: ''
    });
  }

  buscarEnPadron() {
    const cedula = this.form.get('cedula')?.value?.trim();
    if (!cedula) return;

    this.isBuscando   = true;
    this.ciudadano    = null;
    this.fotoUrl      = null;
    this.padronError  = null;
    this.isManualMode = false;

    // 1. Primero verificamos si ya existe en nuestro sistema
    this.personasSvc.getPersonaByCedula(cedula).subscribe({
      next: (data) => {
        this.isBuscando = false;
        
        // Solo mostrar la advertencia si NO estábamos editando a este mismo usuario
        if (!this.isEditing || this.personaId !== data.id) {
          this.showToast('Esta persona ya se encuentra registrada en el sistema.', 'warning');
        }
        this.isEditing = true;
        this.personaId = data.id!;
        
        this.form.patchValue({ cedula: data.cedula, email: data.email, direccion: data.direccion });
        
        this.contactos.clear();
        const agrupados = new Map<string, { valor: string, isMovil: boolean, isWhatsApp: boolean, isPrincipal: boolean }>();
        (data.contactos || []).forEach((c: any) => {
          if (!agrupados.has(c.valor)) {
            agrupados.set(c.valor, { valor: c.valor, isMovil: false, isWhatsApp: false, isPrincipal: false });
          }
          const item = agrupados.get(c.valor)!;
          if (c.tipo === 1) item.isMovil = true;
          if (c.tipo === 5) item.isWhatsApp = true;
          if (c.esPrincipal) item.isPrincipal = true;
        });

        agrupados.forEach(c => {
          this.contactos.push(this.fb.group({
            valor:      [c.valor, Validators.required],
            isPrincipal: [c.isPrincipal],
            isMovil:     [c.isMovil],
            isWhatsApp:  [c.isWhatsApp],
          }));
        });
        
        // Simular un ciudadano encontrado o si tuvimos foto
        this.ciudadano = {
          cedula: data.cedula,
          nombres: data.nombre,
          apellido1: data.apellido,
          apellido2: '',
          idSexo: data.genero === 'F' ? 2 : 1,
          fechaNacimiento: data.fechaNacimiento || null,
          nombreCompleto: data.nombreCompleto || `${data.nombre} ${data.apellido}`,
          genero: data.genero
        };
        this.fotoUrl = `${environment.apiUrl}/personas/${cedula}/foto`;
      },
      error: (err) => {
        // No está en nuestro sistema, buscar en PadronJCE
        const token = localStorage.getItem('auth_token');
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

        this.http.get<PadronCiudadano>(
          `${environment.apiUrl}/personas/buscar-padron/${cedula}`,
          { headers }
        ).subscribe({
          next: (data) => {
            this.ciudadano   = data;
            this.fotoUrl     = `${environment.apiUrl}/personas/${cedula}/foto`;
            this.isBuscando  = false;
          },
          error: (errPadron) => {
            if (errPadron.status === 404) {
              this.padronError = `Cédula no encontrada en el padrón. Por favor, introduzca los datos manualmente.`;
              this.isManualMode = true;
              this.showToast(this.padronError, 'warning');
            } else if (errPadron.status === 500 && errPadron.error?.detalle) {
              this.padronError = `Error del servidor: ${errPadron.error.detalle}`;
            } else {
              this.padronError = `Error ${errPadron.status}: No se pudo consultar el padrón.`;
            }
            this.isBuscando = false;
          }
        });
      }
    });
  }

  // ── Gestión de contactos ─────────────────────────────────────────────────────

  agregarContacto() {
    this.contactos.push(this.fb.group({
      valor:       ['', [Validators.required, Validators.maxLength(50)]],
      isPrincipal: [false],
      isMovil:     [true],
      isWhatsApp:  [true],
    }));
  }

  eliminarContacto(i: number) {
    this.contactos.removeAt(i);
  }

  formatPhone(event: any, index: number) {
    const input = event.target;
    let value = input.value;
    if (!value) return;

    // Remover todos los caracteres que no sean dígitos
    let digits = value.replace(/\D/g, '');
    
    // Limitar a máximo 10 dígitos (formato estándar de RD o internacional corto)
    // Si necesitas códigos de país como +1, esta lógica permite el código dentro de otra lógica, 
    // pero para RD normalmente son 10 dígitos (ej: 809-555-5555)
    if (digits.length > 10) {
      digits = digits.substring(0, 10);
    }

    // Aplicar máscara (XXX) XXX-XXXX
    let formatted = '';
    if (digits.length > 0) {
      formatted = '(' + digits.substring(0, 3);
    }
    if (digits.length >= 4) {
      formatted += ') ' + digits.substring(3, 6);
    }
    if (digits.length >= 7) {
      formatted += '-' + digits.substring(6, 10);
    }

    // Actualizar el control del formulario previniendo eventos infinitos
    const control = this.contactos.at(index).get('valor');
    if (control && control.value !== formatted) {
      control.setValue(formatted, { emitEvent: false });
    }
    
    // Forzar en el input literal de la vista
    input.value = formatted;
  }

  // ── Cargar persona en modo edición ───────────────────────────────────────────

  loadPersonaEdit(id: string) {
    this.isLoading = true;
    this.personasSvc.getPersona(id).subscribe({
      next: (data: any) => {
        this.form.patchValue({ cedula: data.cedula, email: data.email, direccion: data.direccion });
        this.buscarEnPadron();
        
        const agrupados = new Map<string, { valor: string, isMovil: boolean, isWhatsApp: boolean, isPrincipal: boolean }>();
        (data.contactos || []).forEach((c: any) => {
          if (!agrupados.has(c.valor)) {
            agrupados.set(c.valor, { valor: c.valor, isMovil: false, isWhatsApp: false, isPrincipal: false });
          }
          const item = agrupados.get(c.valor)!;
          if (c.tipo === 1) item.isMovil = true;
          if (c.tipo === 5) item.isWhatsApp = true;
          if (c.esPrincipal) item.isPrincipal = true;
          // Si es de otro tipo solo lo mantenemos sin movil/whatsapp
        });

        agrupados.forEach(c => {
          this.contactos.push(this.fb.group({
            valor:      [c.valor, Validators.required],
            isPrincipal: [c.isPrincipal],
            isMovil:     [c.isMovil],
            isWhatsApp:  [c.isWhatsApp],
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
    if (!this.ciudadano && !this.isEditing && !this.isManualMode) {
      this.showToast('Primero busca y verifica la cédula en el padrón', 'warning');
      return;
    }
    
    // Si estamos en modo manual, hacemos requeridos nombre y apellido
    if (this.isManualMode) {
      if (!this.form.value.nombre || !this.form.value.apellido) {
        this.showToast('Por favor, ingresa el nombre y apellido.', 'warning');
        return;
      }
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showToast('Completa los campos requeridos', 'warning');
      return;
    }

    this.isSaving = true;
    
    const contactosAEnviar: any[] = [];
    this.form.value.contactos.forEach((c: any) => {
       if (c.isMovil) {
          contactosAEnviar.push({ tipo: 1, valor: c.valor, esPrincipal: c.isPrincipal, nota: null });
       }
       if (c.isWhatsApp) {
          contactosAEnviar.push({ tipo: 5, valor: c.valor, esPrincipal: c.isPrincipal, nota: null });
       }
       if (!c.isMovil && !c.isWhatsApp) {
          contactosAEnviar.push({ tipo: 99, valor: c.valor, esPrincipal: c.isPrincipal, nota: null }); // 99=Otro
       }
    });
    
    const payload: any = {
      cedula:    this.form.value.cedula,
      email:     this.form.value.email || null,
      direccion: this.form.value.direccion || null,
      contactos: contactosAEnviar,
    };
    
    if (this.isManualMode) {
      payload.nombre = this.form.value.nombre;
      payload.apellido = this.form.value.apellido;
      payload.genero = this.form.value.genero;
      if (this.form.value.fechaNacimiento) {
        payload.fechaNacimiento = this.form.value.fechaNacimiento;
      }
    }

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
