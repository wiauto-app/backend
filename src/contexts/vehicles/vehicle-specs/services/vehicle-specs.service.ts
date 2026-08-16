import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { VersionEntity } from "../../catalog/versions/entities/version.entity";
import { Repository } from "typeorm";
import { generateText, Output } from "ai";
import z from "zod";
import { TRANSMISSION_TYPE } from "../../types/vehicle";
import { TractionEntity } from "../../entities/traction.entity";
import {
  openai,
  type OpenAILanguageModelResponsesOptions,
} from '@ai-sdk/openai';
import { envs } from "@/src/common/envs";
import { deepseek } from "@ai-sdk/deepseek";

@Injectable()
export class VehicleSpecsService {
  constructor(
    @InjectRepository(VersionEntity)
    private readonly versionRepository: Repository<VersionEntity>,

    @InjectRepository(TractionEntity)
    private readonly tractionRepository: Repository<TractionEntity>,
  ) { }

  async getVehicleSpecs(versionId: number): Promise<VehicleSpecs> {

    const version = await this.versionRepository.findOne({
      where: {
        id: versionId,
      },
      relations: {
        body_type: true,
        fuel_type: true,
        make: true,
        model: true,
        year: true,
      },
    });

    if (!version) {
      throw new NotFoundException("Version not found");
    }

    const tractions = await this.tractionRepository.find();
    if (tractions.length === 0) {
      throw new NotFoundException("No tractions configured");
    }

    const availableTractions = tractions.map((traction) => ({
      id: traction.id,
      name: traction.name,
    }));

    const { output } = await generateText({
      model: openai("gpt-4o-mini"),
      // model: deepseek(envs.DEEPSEEK_MODEL),
      output: Output.object({
        schema: vehicleSpecsSchema,
      }),
      providerOptions: {
        openai: {
          reasoningEffort: 'low', // 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'
        } satisfies OpenAILanguageModelResponsesOptions,
      },
      prompt: `
Obtén las especificaciones técnicas del siguiente vehículo:

VEHÍCULO:
${JSON.stringify(version)}

TRACCIONES DISPONIBLES:
${JSON.stringify(availableTractions)}

Reglas obligatorias:

- traction_id debe ser EXCLUSIVAMENTE uno de los IDs existentes en TRACCIONES DISPONIBLES.
- No inventes un traction_id.
- Selecciona la tracción que corresponda al vehículo.
- transmission debe utilizar únicamente uno de los valores permitidos por el schema.
- power debe expresarse en CV.
- displacement debe expresarse en cc.
- Si el vehículo es eléctrico y no tiene cilindrada, displacement debe ser 0.
- Si autonomía, batería o tiempo de carga no aplican al vehículo, devuelve null.
- No inventes información cuando no sea posible determinarla.
- Devuelve únicamente el objeto solicitado.
      `,
    });

    return output;
  }
}

const vehicleSpecsSchema = z.object({
  traction_id: z
    .uuid()
    .describe(
      "ID de la tracción. Debe corresponder exactamente a uno de los IDs disponibles proporcionados.",
    ),

  transmission: z.enum(TRANSMISSION_TYPE).describe(
    "Tipo de transmisión del vehículo.",
  ),

  power: z
    .number()
    .nonnegative()
    .describe("Potencia del vehículo en CV."),

  displacement: z
    .number()
    .nonnegative()
    .describe("Cilindrada del vehículo en cc. Para vehículos eléctricos debe ser 0."),

  autonomy: z
    .number()
    .nonnegative()
    .nullable()
    .describe(
      "Autonomía en km. Solo para vehículos eléctricos o cuando aplique.",
    ),

  battery_capacity: z
    .number()
    .nonnegative()
    .nullable()
    .describe(
      "Capacidad de batería en kWh. Solo para vehículos eléctricos o híbridos cuando aplique.",
    ),

  time_to_charge: z
    .number()
    .nonnegative()
    .nullable()
    .describe(
      "Tiempo de carga en horas. Solo para vehículos eléctricos o híbridos cuando aplique.",
    ),
});

export type VehicleSpecs = z.infer<typeof vehicleSpecsSchema>;