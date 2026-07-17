import { Controller, Delete, Body, UseGuards } from "@nestjs/common";
import { V1_FILES } from "../../media.constants";
import { RemoveFilesService } from "../../services/remove-files.service";
import { RemoveFilesHttpDto } from "./remove-file.http-dto";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

@UseGuards(JwtGuard)
@Controller(V1_FILES)
export class RemoveFileController {
  constructor(private readonly removeFilesService: RemoveFilesService) { }

  @Delete()
  run(@Body() removeFilesDto: RemoveFilesHttpDto) {
    return this.removeFilesService.execute(removeFilesDto);
  }
}