import { Controller, Body, Param, ParseIntPipe, Get, Post, Patch, Delete } from '@nestjs/common';
import { DeleteResult } from 'typeorm';

import { Permanence } from './entities/permanence.entity.js';
import { PermanencesService } from './permanences.service.js';
import { CreatePermanenceDto } from './dto/create-permanence.dto.js';
import { UpdatePermanenceDto } from './dto/update-permanence.dto.js';

@Controller('permanences')
export class PermanencesController {
  constructor(private readonly permanencesService: PermanencesService) {}

  @Get(':id')
    async findById(@Param('id', ParseIntPipe) id: number): Promise<Permanence> {
      return await this.permanencesService.findById(id);
    }
  
  @Post()
  async create(@Body() createPermanenceDto: CreatePermanenceDto): Promise<Permanence> {
    return await this.permanencesService.create(createPermanenceDto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermanenceDto: UpdatePermanenceDto,
  ): Promise<Permanence> {
    return await this.permanencesService.update(id, updatePermanenceDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<DeleteResult> {
    return await this.permanencesService.remove(id);
  }
}
