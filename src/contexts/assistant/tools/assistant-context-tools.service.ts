import { Injectable } from "@nestjs/common";
import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { DealershipService } from "@/src/contexts/dealership/services/dealership.service";
import type { AssistantPageContext } from "../types/assistant-page-context";
import { AssistantNewsService } from "../services/assistant-news.service";

const PLATFORM_TOPICS = {
  overview: {
    title: "Qué es WiAuto",
    points: ["Explorar vehículos", "Comparar opciones", "Contactar vendedores y concesionarias", "Consultar noticias del motor"],
  },
  buy: {
    title: "Comprar con WiAuto",
    points: ["Buscar con filtros o lenguaje natural", "Comparar anuncios", "Analizar alternativas antes de contactar"],
  },
  sell: {
    title: "Vender con WiAuto",
    points: ["Publicar un anuncio", "Completar los datos del vehículo", "Gestionar contactos desde el área de usuario"],
  },
} as const;

@Injectable()
export class AssistantContextToolsService {
  constructor(
    private readonly dealershipService: DealershipService,
    private readonly newsService: AssistantNewsService,
  ) {}

  createTools(context: Exclude<AssistantPageContext, "vehicles">): ToolSet {
    if (context === "home") {
      return {
        explainPlatform: tool({
          description: "Explica funciones reales de WiAuto y cómo comenzar a comprar o vender.",
          inputSchema: z.object({
            topic: z.enum(["overview", "buy", "sell"]).default("overview"),
          }),
          execute: async ({ topic }) => PLATFORM_TOPICS[topic],
        }),
      };
    }

    if (context === "dealerships") {
      return {
        searchDealerships: tool({
          description: "Busca concesionarias reales de WiAuto por texto, provincia, valoración o inventario.",
          inputSchema: z.object({
            query: z.string().max(80).optional(),
            province_slug: z.string().max(80).optional(),
            minimum_rating: z.number().min(0).max(5).optional(),
            minimum_vehicles: z.number().int().min(0).max(1000).optional(),
          }),
          execute: async (input) => {
            const result = await this.dealershipService.findAll({
              page: 1,
              limit: 5,
              query: input.query,
              province_slug: input.province_slug,
              rating_since: input.minimum_rating,
              vehicles_number: input.minimum_vehicles,
              order_by: input.minimum_rating ? "rating" : undefined,
              order_direction: "DESC",
            });

            return {
              total: result.total,
              dealerships: result.data.map((dealer) => ({
                name: dealer.name,
                description: dealer.description,
                address: dealer.address,
                rating: dealer.rating,
                vehicles_count: dealer.vehicles_count,
                reviews_count: dealer.reviews_count,
                url: `/concesionaria/${dealer.slug}`,
              })),
            };
          },
        }),
      };
    }

    return {
      getNewsHighlights: tool({
        description: "Obtiene noticias reales y recientes publicadas por WiAuto.",
        inputSchema: z.object({
          featured: z.boolean().default(false),
          category: z.string().max(80).optional(),
        }),
        execute: async (input) => this.newsService.findHighlights(input),
      }),
    };
  }
}
