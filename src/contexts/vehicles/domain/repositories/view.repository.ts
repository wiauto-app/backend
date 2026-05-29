import { View } from "../entities/view";




export abstract class ViewRepository {
  abstract record(view: View): Promise<void>;
}