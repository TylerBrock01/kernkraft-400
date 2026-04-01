import { Controller, Get, Param } from '@nestjs/common';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get(':uuid')
  async getTicket(@Param('uuid') uuid: string) {
    return this.ticketsService.findOneByUuid(uuid);
  }
}