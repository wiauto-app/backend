import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { generateText, Output, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import z from "zod";

import { VersionEntity } from "../../catalog/versions/entities/version.entity";
import { TractionEntity } from "../../entities/traction.entity";
import { TRANSMISSION_TYPE } from "../../types/vehicle";

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

    /**
     * En nuestro catálogo can_charge indica que el vehículo
     * utiliza un sistema eléctrico recargable.
     */
    const isElectric = version.fuel_type.can_charge;

    const vehicleContext = {
      make: version.make.name,
      model: version.model.name,
      version: version.name,
      year: version.year.year,
      body_type: version.body_type.name,

      fuel_type: {
        name: version.fuel_type.name,
        slug: version.fuel_type.slug,
        can_charge: version.fuel_type.can_charge,
      },

      is_electric: isElectric,
    };

    const { output } = await generateText({
      model: openai("gpt-4o-mini"),

      output: Output.object({
        schema: vehicleSpecsSchema,
      }),

      tools: {
        //@ts-expect-error AI SDK incompatible version
        web_search: openai.tools.webSearch({
          searchContextSize: "medium",
        }),
      },

      stopWhen: stepCountIs(5),

      prompt: `
Obtén las especificaciones técnicas REALES del siguiente vehículo.

VEHÍCULO:

${JSON.stringify(vehicleContext, null, 2)}

TRACCIONES DISPONIBLES:

${JSON.stringify(availableTractions, null, 2)}

CLASIFICACIÓN DEL VEHÍCULO:

is_electric = ${isElectric}

IMPORTANTE:

El valor "is_electric" ya ha sido determinado por el sistema.

NO debes intentar reinterpretarlo.

${isElectric
          ? `
ESTE VEHÍCULO ES ELÉCTRICO O RECARGABLE.

Debes intentar obtener especialmente:

- potencia en CV
- autonomía en km
- capacidad útil o nominal de batería en kWh
- tiempo aproximado de carga
- tipo de tracción
- transmisión

Usa búsqueda web si necesitas confirmar estos datos.

Para autonomy:
- utiliza autonomía oficial WLTP cuando esté disponible.
- si existen varias cifras dependiendo de configuración, utiliza la correspondiente
  exactamente a esta versión.
- no utilices autonomía EPA si existe una cifra WLTP aplicable al vehículo europeo.

Para battery_capacity:
- expresarla en kWh.
- preferir capacidad útil cuando pueda identificarse claramente.
- si solamente está disponible la capacidad nominal, puede utilizarse esa.

Para time_to_charge:
- expresarlo en horas.
- preferir una carga AC doméstica/wallbox representativa.
- NO utilizar como tiempo de carga principal el tiempo 10%-80% DC rápido,
  porque normalmente se expresa en minutos.
`
          : `
ESTE VEHÍCULO NO ESTÁ CLASIFICADO COMO ELÉCTRICO RECARGABLE.

Normalmente:

autonomy = null
battery_capacity = null
time_to_charge = null

salvo que exista una razón técnica clara para que alguno aplique.
`
        }

REGLAS OBLIGATORIAS:

1. traction_id debe ser EXCLUSIVAMENTE uno de estos IDs:

${availableTractions
          .map((traction) => `- ${traction.id}: ${traction.name}`)
          .join("\n")}

2. No inventes un traction_id.

3. Selecciona el traction_id cuya descripción corresponda realmente
   al vehículo.

4. transmission debe utilizar exclusivamente uno de los valores
   permitidos por el schema.

5. power debe expresarse exclusivamente en CV.

6. displacement debe expresarse en cc.

7. Si is_electric = true:
   displacement DEBE ser exactamente 0.

8. Si is_electric = true, debes intentar activamente determinar:

   - autonomy
   - battery_capacity
   - time_to_charge

   NO devuelvas null automáticamente simplemente porque esos valores
   no aparecen en el objeto VEHÍCULO.

   Primero intenta obtenerlos mediante búsqueda.

9. Devuelve null únicamente cuando, después de intentar determinar el
   dato, no exista información razonablemente fiable.

10. No confundas diferentes versiones del mismo modelo.

Ejemplo:

ALPINE A290 GT Performance

NO debe recibir automáticamente las especificaciones de:

ALPINE A290 GT
ALPINE A290 GT Premium
ALPINE A290 GTS

si sus especificaciones son diferentes.

11. El año del vehículo también debe tenerse en cuenta.

12. Devuelve exclusivamente el objeto definido por el schema.
      `,
    });

    /**
     * Guardrail adicional.
     *
     * No dependemos de que el LLM recuerde que un eléctrico
     * no tiene cilindrada.
     */
    if (isElectric) {
      output.displacement = 0;
    }

    return output;
  }
}

const vehicleSpecsSchema = z.object({
  traction_id: z
    .uuid()
    .describe(
      "ID exacto de una de las tracciones proporcionadas por el sistema.",
    ),

  transmission: z
    .enum(TRANSMISSION_TYPE)
    .describe("Tipo de transmisión del vehículo."),

  power: z
    .number()
    .nonnegative()
    .describe("Potencia máxima del vehículo expresada en CV."),

  displacement: z
    .number()
    .nonnegative()
    .describe(
      "Cilindrada expresada en cc. Para vehículos eléctricos debe ser exactamente 0.",
    ),

  autonomy: z
    .number()
    .positive()
    .nullable()
    .describe(
      "Autonomía oficial del vehículo en km, preferiblemente WLTP. Null solamente cuando no aplique o no pueda determinarse.",
    ),

  battery_capacity: z
    .number()
    .positive()
    .nullable()
    .describe(
      "Capacidad de la batería en kWh. Preferiblemente capacidad útil si está disponible.",
    ),

  time_to_charge: z
    .number()
    .positive()
    .nullable()
    .describe(
      "Tiempo aproximado de carga en horas. Preferiblemente carga AC completa cuando esté disponible.",
    ),
});

export type VehicleSpecs = z.infer<typeof vehicleSpecsSchema>;