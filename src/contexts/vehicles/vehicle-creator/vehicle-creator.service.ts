import { envs } from "@/src/common/envs";
import { Injectable } from "@nestjs/common";
import { OpenAI } from "openai";
import { VehicleCreatorDto } from "./dto/vehicle-creator.dto";

@Injectable()
export class VehicleCreatorService {

  private readonly openai: OpenAI;

  constructor(
  ) {
    this.openai = new OpenAI({
      apiKey: envs.OPENAI_API_KEY,
    });
  }

  async createVehicle(createVehicleDto: VehicleCreatorDto) {
    const { image_url } = createVehicleDto;
    const response = await this.openai.responses.create({
      model: "gpt-5.6-luna",
      text:{
        
      },

      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: `
              Eres un inspector automotriz especializado en crear publicaciones de vehículos para un marketplace.

Analiza todas las imágenes proporcionadas.

Tu objetivo NO es adivinar información, sino extraer únicamente aquello que pueda observarse con suficiente evidencia.

REGLAS IMPORTANTES

1. Nunca inventes datos.
2. Si un dato no puede determinarse visualmente, devuelve null.
3. Si solo puedes hacer una estimación, indícalo claramente.
4. Para cada campo indica un porcentaje de confianza de 0 a 100.
5. Usa OCR para leer placas, logotipos, emblemas o cualquier texto visible.
6. Si existen varias imágenes, combínalas para obtener la mayor cantidad de información posible.
7. Describe únicamente daños visibles.
8. Nunca deduzcas kilometraje, transmisión, motor, potencia, VIN, versión o equipamiento si no aparecen claramente.
9. Si detectas accesorios visibles, agrégalos.
10. Si detectas modificaciones, indícalas.
11. Genera una descripción comercial profesional utilizando únicamente información confirmada.

Devuelve exclusivamente un JSON.
              `
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
              Analiza la siguiente imagen: ${image_url}

              Devuelve un JSON con la información del vehículo.
              `
            },
            {
              type: "input_image",
              image_url: image_url,
              detail: "auto",
            }
          ]
        },

      ]
    })

    return response.output_text
  }

}