export interface SavedMix {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  composition: {
    flourId: string;
    percentage: number;
    flourName: string;
    source?: 'public' | 'enterprise' | 'private';
    antiNutrientContribution?: {
      lectins: number;
      tannins: number;
      saponins: number;
      phytic_acid: number;
      trypsin_inhibitors: number;
      anti_nutrients_total_contri: number;
    };
  }[];
  created_at: string;
  updated_at: string;
  tags?: string[];
  shared?: boolean;
}

export interface MixFormData {
  name: string;
  description: string;
  composition: {
    flourId: string;
    percentage: number;
    flourName: string;
    source?: 'public' | 'enterprise' | 'private';
    antiNutrientContribution?: {
      lectins: number;
      tannins: number;
      saponins: number;
      phytic_acid: number;
      trypsin_inhibitors: number;
      anti_nutrients_total_contri: number;
    };
  }[];
  tags?: string[];
}
