export interface AiModel {
  id: string;
  name: string;
  type: 'LLM' | 'Vision' | 'Audio' | 'Multimodal' | 'IDE' | 'Autre'; // Ajout de 'IDE'
  description: string;
  vramRequiredGb: number;
  source: string;
  tags: string[];
}
