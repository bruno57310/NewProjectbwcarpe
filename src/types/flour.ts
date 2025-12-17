export interface Flour {
  id: string;
  name: string;
  category: string;
  description?: string;
  nutritional_values: {
    proteins: number;
    lipids: number;
    carbs: number;
    fiber: number;
    moisture: number;
    ash: number;
  };
  protein_composition: {
    albumins: number;
    globulins: number;
    prolamins: number;
    glutelins: number;
  };
  enzymatic_composition: {
    amylases: number;
    proteases: number;
    lipases: number;
    phytases: number;
  };
  anti_nutrients: {
    phytic_acid: string | number;
    tannins: string | number;
    trypsin_inhibitors: string | number;
    saponins: string | number;
    lectins: string | number;
  };
  protein_profile: 'simple' | 'complex';
  protein_quality: 'complete' | 'incomplete';
  mechanical_properties: {
    binding: string;
    stickiness: string;
    water_absorption: string;
  };
  solubility: string;
  recommended_ratio: {
    min: number;
    max: number;
  };
  tips: string[];
  image_url?: string;
  price_per_kg?: number;
  created_at?: string;
  updated_at?: string;
  category_id?: string;
  flour_categories?: {
    name: string;
  };
  user_id_private_flours?: string;
  private_flour_categories?: {
    name: string;
  };
  private_flour_categories_id?: string;
  anti_nutrients_total?: number;
  enzymes_total?: number;
}
