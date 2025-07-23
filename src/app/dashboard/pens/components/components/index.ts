// ==================================================
// 📁 src/app/dashboard/pens/components/components/index.ts
// Central export file for all pen table components
// ==================================================

// ✅ Export only existing table components
export { BolcsiAnimalTable } from './BolcsiAnimalTable';      // TODO: Create this
export { OviAnimalTable } from './OviAnimalTable';            // TODO: Create this
export { HaremAnimalTable } from './HaremAnimalTable';
export { VemhesAnimalTable } from './VemhesAnimalTable';      // TODO: Create this
export { ElletoAnimalTable } from './ElletoAnimalTable';
export { TehenAnimalTable } from './TehenAnimalTable';        // TODO: Create this
export { HizobikaAnimalTable } from './HizobikaAnimalTable';
export { KorhazAnimalTable } from './KorhazAnimalTable';
export { KarantenAnimalTable } from './KarantenAnimalTable';
export { SelejtAnimalTable } from './SelejtAnimalTable';
export { AtmenetiAnimalTable } from './AtmenetiAnimalTable';

// ✅ Type exports - using existing component
export type AnimalTableProps = {
    animals: any[];
    selectedAnimals: string[];
    onToggleAnimal: (id: string) => void;
    onSelectAll: () => void;
    onClearSelection: () => void;
    handleAnimalClick: (animal: any) => void;
};

/**
 * Available pen table components:
 * 
 * 🍼 BolcsiAnimalTable    - 12 hónapos célnap
 * 🎓 OviAnimalTable       - 24 hónapos célnap  
 * 👑 HaremAnimalTable     - VV logika, hárem kezelés
 * 🤰 VemhesAnimalTable    - Ellés előkészítés, protokollok
 * 🍼 ElletoAnimalTable    - Ellés utáni kezelés
 * 🐄 TehenAnimalTable     - Tejtermelő tehenek
 * 💪 HizobikaAnimalTable  - Hízlalás, 18-24 hónapos célok
 * 🏥 KorhazAnimalTable    - Orvosi kezelések
 * 🔒 KarantenAnimalTable  - Elkülönítés, megfigyelés
 * 📦 SelejtAnimalTable    - Értékesítésre váró állatok
 * 🔄 AtmenetiAnimalTable  - Áthelyezésre váró állatok
 */