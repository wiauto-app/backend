import { ContactClick } from "../entities/contact-click";

export abstract class ContactClickRepository {
  abstract record(contact_click: ContactClick): Promise<void>;
}
