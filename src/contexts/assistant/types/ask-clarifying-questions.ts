import { SearchVehiclesInput } from "../schemas/search-vehicles.schema";

export interface ClarifyingQuestionOption {
  id: string;
  label: string;
  filter_patch?: SearchVehiclesInput;
}

export interface ClarifyingQuestion {
  id: string;
  prompt: string;
  multi: boolean;
  options: ClarifyingQuestionOption[];
}

export interface AskClarifyingQuestionsResult {
  questions: ClarifyingQuestion[];
}
