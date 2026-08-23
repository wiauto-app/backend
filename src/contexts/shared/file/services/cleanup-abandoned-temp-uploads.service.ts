import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThan, In, Repository } from "typeorm";

import { TemporaryUploadEntity } from "../entities/temporary-upload.entity";
import { ObjectStorageService } from "../../object-storage/object-storage.service";

interface CleanupStats {
  candidatesFound: number;
  filesDeleted: number;
  rowsDeleted: number;
  r2Errors: number;
}

@Injectable()
export class CleanupAbandonedTempUploadsService {
  private readonly logger = new Logger(CleanupAbandonedTempUploadsService.name);
  private readonly batchSize = 500;

  constructor(
    @InjectRepository(TemporaryUploadEntity)
    private readonly tempUploadRepo: Repository<TemporaryUploadEntity>,
    private readonly objectStorageService: ObjectStorageService,
  ) {}

  async execute(): Promise<CleanupStats> {
    const now = new Date();
    const stats: CleanupStats = {
      candidatesFound: 0,
      filesDeleted: 0,
      rowsDeleted: 0,
      r2Errors: 0,
    };

    this.logger.log("Iniciando limpieza de temporary_uploads abandonados");

    // Buscar candidatos: status IN (pending_upload, uploaded) AND expires_at < now
    const candidates = await this.tempUploadRepo.find({
      where: {
        status: In(["pending_upload", "uploaded"]),
        expires_at: LessThan(now),
      },
      take: this.batchSize,
    });

    stats.candidatesFound = candidates.length;

    if (candidates.length === 0) {
      this.logger.log("No hay temporary_uploads abandonados para limpiar");
      return stats;
    }

    this.logger.log(
      `Encontrados ${candidates.length} temporary_uploads abandonados`,
    );

    const idsToDelete: string[] = [];

    // Procesar cada candidato
    for (const upload of candidates) {
      try {
        // Intentar borrar de R2
        await this.objectStorageService.deleteByPath(upload.storage_path);
        stats.filesDeleted++;
        idsToDelete.push(upload.id);
      } catch (error) {
        const status = (
          error as {
            $metadata?: {
              httpStatusCode?: number;
            };
          }
        ).$metadata?.httpStatusCode;

        if (status === 404) {
          // Archivo no existe en R2, igual marcar para borrar fila
          this.logger.debug(
            `Archivo no encontrado en R2 para upload ${upload.id}, marcando fila para eliminación`,
          );
          idsToDelete.push(upload.id);
        } else {
          // Otro error: loguear y continuar
          stats.r2Errors++;
          this.logger.warn(
            `Error al borrar archivo R2 para upload ${upload.id}: ${(error as Error).message}`,
          );
        }
      }
    }

    // Hard-delete de las filas que se pudieron procesar
    if (idsToDelete.length > 0) {
      await this.tempUploadRepo.delete({ id: In(idsToDelete) });
      stats.rowsDeleted = idsToDelete.length;
      this.logger.log(
        `Eliminadas ${stats.rowsDeleted} filas de temporary_uploads`,
      );
    }

    this.logger.log(
      `Limpieza completada. Stats: ${JSON.stringify(stats)}`,
    );

    return stats;
  }
}
