import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';

// Interface pour les options, pour garder le code propre
export interface MultiSelectOption {
  id: any;
  name: string;
}

@Component({
  selector: 'app-multi-select',
  standalone: true,
  imports: [CommonModule, MatCheckboxModule, MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './multi-select.component.html',
  styleUrls: ['./multi-select.component.scss']
})
export class MultiSelectComponent {
  // Entrées et Sorties du composant
  @Input() options: MultiSelectOption[] = [];
  @Input() selectedIds: any[] = [];
  @Output() selectionChange = new EventEmitter<any[]>();

  // Calcule le texte à afficher sur le bouton
  get selectionText(): string {
    if (!this.selectedIds || this.selectedIds.length === 0) {
      return 'Sélectionner des GPUs';
    }
    if (this.selectedIds.length === this.options.length) {
      return 'Tous les GPUs sélectionnés';
    }
    return `${this.selectedIds.length} GPU(s) sélectionné(s)`;
  }

  // Vérifie si "Tout sélectionner" doit être coché
  isAllSelected(): boolean {
    return this.options.length > 0 && this.selectedIds.length === this.options.length;
  }

  // Vérifie si "Tout sélectionner" doit être en état indéterminé (tiret)
  isIndeterminate(): boolean {
    return this.selectedIds.length > 0 && !this.isAllSelected();
  }

  // Gère le clic sur "Tout sélectionner"
  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectionChange.emit([]); // Emet un tableau vide pour tout désélectionner
    } else {
      // Emet un tableau avec tous les IDs pour tout sélectionner
      this.selectionChange.emit(this.options.map(opt => opt.id));
    }
  }

  // Gère le clic sur une option individuelle
  toggleOption(optionId: any): void {
    const newSelection = [...this.selectedIds]; // Crée une copie
    const index = newSelection.indexOf(optionId);

    if (index > -1) {
      newSelection.splice(index, 1); // Si l'option est déjà sélectionnée, on la retire
    } else {
      newSelection.push(optionId); // Sinon, on l'ajoute
    }
    this.selectionChange.emit(newSelection); // Emet le nouveau tableau de sélection
  }
}
