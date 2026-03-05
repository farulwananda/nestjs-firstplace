import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

import { NotesService } from './notes.service.js';
import { CreateNoteDto } from './dto/create-note.dto.js';
import { UpdateNoteDto } from './dto/update-note.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new note' })
  @ApiResponse({ status: 201, description: 'Note created successfully' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createNoteDto: CreateNoteDto,
  ) {
    return this.notesService.create(userId, createNoteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notes for the current user' })
  @ApiQuery({
    name: 'archived',
    required: false,
    type: Boolean,
    description: 'Filter by archive status',
  })
  @ApiResponse({ status: 200, description: 'List of notes' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('archived') archived?: string,
  ) {
    const archivedBool =
      archived !== undefined ? archived === 'true' : undefined;
    return this.notesService.findAll(userId, archivedBool);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific note by ID' })
  @ApiResponse({ status: 200, description: 'The note' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id') noteId: string,
  ) {
    return this.notesService.findOne(userId, noteId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a note' })
  @ApiResponse({ status: 200, description: 'Note updated successfully' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') noteId: string,
    @Body() updateNoteDto: UpdateNoteDto,
  ) {
    return this.notesService.update(userId, noteId, updateNoteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a note' })
  @ApiResponse({ status: 200, description: 'Note deleted successfully' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  async remove(@CurrentUser('id') userId: string, @Param('id') noteId: string) {
    return this.notesService.remove(userId, noteId);
  }
}
