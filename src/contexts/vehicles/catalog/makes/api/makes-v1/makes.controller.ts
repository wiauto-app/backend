import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { V1_CATALOG_MAKES } from "../../../route.constants";
import { MakesService } from "../../services/makes.service";
import { SyncMakeLogosService } from "../../services/sync-make-logos.service";
import { CreateMakeHttpDto } from "./dto/create-make.http-dto";
import { FindSearchMakesHttpDto } from "./dto/find-search-makes.http-dto";
import { SyncMakeLogosHttpDto } from "./dto/sync-make-logos.http-dto";
import { UpdateMakeHttpDto } from "./update-make.http-dto";

@Controller(V1_CATALOG_MAKES)
export class MakesController {
  constructor(
    private readonly makes_service: MakesService,
    private readonly sync_make_logos_service: SyncMakeLogosService,
  ) {}

  @Post()
  create(@Body() dto: CreateMakeHttpDto) {
    return this.makes_service.create(dto);
  }

  @Post("sync-logos")
  // @UseGuards(JwtGuard)
  syncLogos(@Body() dto: SyncMakeLogosHttpDto) {
    return this.sync_make_logos_service.execute({
      make_id: dto.make_id,
      force: dto.force,
    });
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateMakeHttpDto,
  ) {
    return this.makes_service.update(id, dto);
  }

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.makes_service.findAll(query);
  }

  @Get("search")
  findSearchMakes(@Query() query: FindSearchMakesHttpDto) {
    return this.makes_service.findSearchMakes(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.makes_service.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.makes_service.remove(id);
  }
}
