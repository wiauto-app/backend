import { Controller, Delete, Body, UseGuards } from "@nestjs/common";
import { V1_FILES } from "../../media.constants";
import { RemoveFilesUseCase } from "../../../application/images-use-cases/remove-files-use-case/remove-files.use-case";
import { RemoveFilesHttpDto } from "./remove-file.http-dto";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

@UseGuards(JwtGuard)
@Controller(V1_FILES)
export class RemoveFileController {
  constructor(private readonly removeFilesUseCase: RemoveFilesUseCase) { }

  @Delete()
  run(@Body() removeFilesDto: RemoveFilesHttpDto) {
    return this.removeFilesUseCase.execute(removeFilesDto);
  }
}